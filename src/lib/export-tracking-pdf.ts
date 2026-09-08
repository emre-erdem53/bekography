import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const STYLE_PROPS = [
  "display",
  "position",
  "top",
  "left",
  "right",
  "bottom",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-radius",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "color",
  "font-size",
  "font-weight",
  "font-family",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration",
  "white-space",
  "word-break",
  "flex-direction",
  "flex-wrap",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "align-items",
  "justify-content",
  "justify-items",
  "gap",
  "grid-template-columns",
  "grid-column",
  "grid-row",
  "opacity",
  "overflow",
  "overflow-x",
  "overflow-y",
  "box-shadow",
  "object-fit",
  "object-position",
  "vertical-align",
  "list-style",
] as const;

function inlineComputedStyles(source: Element, clone: Element) {
  if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) {
    return;
  }

  const computed = window.getComputedStyle(source);
  for (const prop of STYLE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (!value || value === "initial" || value === "auto") continue;
    try {
      clone.style.setProperty(prop, value);
    } catch {
      // ignore unsupported values
    }
  }

  clone.style.setProperty("color", computed.color);
  clone.style.setProperty("background-color", computed.backgroundColor);

  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);
  for (let i = 0; i < sourceChildren.length; i++) {
    const cloneChild = cloneChildren[i];
    if (cloneChild) {
      inlineComputedStyles(sourceChildren[i], cloneChild);
    }
  }
}

function stripStylesheets(clonedDocument: Document) {
  clonedDocument
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((node) => node.remove());
}

function resetCloneLayout(clonedElement: HTMLElement, width: number) {
  // mx-auto / centered parents leave a computed margin-left that html2canvas
  // treats as an extra offset, shifting the whole page to the right.
  clonedElement.style.setProperty("margin", "0", "important");
  clonedElement.style.setProperty("margin-left", "0", "important");
  clonedElement.style.setProperty("margin-right", "0", "important");
  clonedElement.style.setProperty("transform", "none", "important");
  clonedElement.style.setProperty("position", "static", "important");
  clonedElement.style.setProperty("left", "auto", "important");
  clonedElement.style.setProperty("right", "auto", "important");
  clonedElement.style.setProperty("top", "auto", "important");
  clonedElement.style.setProperty("inset", "auto", "important");
  clonedElement.style.setProperty("max-width", "none", "important");
  clonedElement.style.setProperty("width", `${width}px`, "important");
  clonedElement.style.background = "#000000";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  });
}

function unwrapNextImageUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.includes("/_next/image")) {
      const raw = parsed.searchParams.get("url");
      if (raw) return decodeURIComponent(raw);
    }
  } catch {
    // ignore
  }
  return url;
}

function pickSrcFromSrcset(srcset: string): string | null {
  const candidates = srcset
    .split(",")
    .map((part) => {
      const [url, descriptor] = part.trim().split(/\s+/);
      const width = descriptor?.endsWith("w")
        ? Number.parseInt(descriptor, 10)
        : descriptor?.endsWith("x")
          ? Number.parseFloat(descriptor) * 1000
          : 0;
      return { url, width: Number.isFinite(width) ? width : 0 };
    })
    .filter((entry) => Boolean(entry.url));

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.width - a.width);
  return candidates[0]?.url ?? null;
}

function resolveImageFetchUrl(img: HTMLImageElement): string | null {
  const current = img.currentSrc || "";
  if (current && !current.startsWith("data:")) {
    return unwrapNextImageUrl(current);
  }

  const srcset = img.getAttribute("srcset");
  if (srcset) {
    const fromSrcset = pickSrcFromSrcset(srcset);
    if (fromSrcset && !fromSrcset.startsWith("data:")) {
      return unwrapNextImageUrl(fromSrcset);
    }
  }

  const src = img.getAttribute("src") || img.src || "";
  if (src && !src.startsWith("data:")) {
    return unwrapNextImageUrl(src);
  }

  // Tiny blur placeholder already in src — try data-pdf / original attributes.
  const dataSrc =
    img.getAttribute("data-pdf-src") ||
    img.getAttribute("data-src") ||
    img.getAttribute("data-original");
  if (dataSrc && !dataSrc.startsWith("data:")) {
    return unwrapNextImageUrl(dataSrc);
  }

  return null;
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const absolute = new URL(url, window.location.origin).toString();

  try {
    const direct = await fetch(absolute, {
      mode: "cors",
      credentials: "omit",
      cache: "reload",
    });
    if (direct.ok) return direct.blob();
  } catch {
    // fall through to proxy
  }

  const proxyUrl = `/api/pdf-image?url=${encodeURIComponent(absolute)}`;
  const proxied = await fetch(proxyUrl, { credentials: "same-origin" });
  if (!proxied.ok) {
    throw new Error(`Image proxy failed (${proxied.status})`);
  }
  return proxied.blob();
}

async function videoFrameToDataUrl(
  video: HTMLVideoElement,
): Promise<string | null> {
  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener("loadeddata", done);
        video.removeEventListener("error", done);
        resolve();
      };
      video.addEventListener("loadeddata", done);
      video.addEventListener("error", done);
    });
  }

  if (video.videoWidth <= 0 || video.videoHeight <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0);
  try {
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}

async function prepareMediaForCapture(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));
  for (const img of images) {
    img.setAttribute("loading", "eager");
    img.setAttribute("decoding", "sync");
    img.removeAttribute("loading");
  }

  // Lazy-loaded / below-fold media: scroll through the capture tree.
  const totalHeight = element.scrollHeight;
  const step = Math.max(window.innerHeight * 0.8, 400);
  for (let y = 0; y < totalHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }
  window.scrollTo(0, 0);
  await new Promise((resolve) => setTimeout(resolve, 50));

  await Promise.all(images.map((img) => waitForImage(img)));
}

/**
 * html2canvas often drops cross-origin / Next.js-optimized images even when
 * they render on screen. Embed them as data URLs before capture.
 */
async function embedImagesAsDataUrls(
  element: HTMLElement,
): Promise<() => void> {
  await prepareMediaForCapture(element);

  const images = Array.from(element.querySelectorAll("img"));
  const restores: Array<() => void> = [];

  await Promise.all(
    images.map(async (img) => {
      // Already a real (non-placeholder) data URL.
      if (
        img.src.startsWith("data:") &&
        img.naturalWidth > 32 &&
        img.complete
      ) {
        return;
      }

      const fetchUrl = resolveImageFetchUrl(img);
      if (!fetchUrl) return;

      try {
        const blob = await fetchImageBlob(fetchUrl);
        const dataUrl = await blobToDataUrl(blob);
        const previousSrc = img.getAttribute("src");
        const previousSrcset = img.getAttribute("srcset");
        const previousCrossOrigin = img.getAttribute("crossorigin");

        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
        img.removeAttribute("crossorigin");
        img.setAttribute("src", dataUrl);
        await waitForImage(img);

        restores.push(() => {
          if (previousSrc != null) img.setAttribute("src", previousSrc);
          else img.removeAttribute("src");
          if (previousSrcset != null) img.setAttribute("srcset", previousSrcset);
          else img.removeAttribute("srcset");
          if (previousCrossOrigin != null) {
            img.setAttribute("crossorigin", previousCrossOrigin);
          }
        });
      } catch {
        // Keep original src; capture may still succeed via useCORS.
      }
    }),
  );

  // Replace videos with a still frame <img> so posters survive html2canvas.
  const videos = Array.from(element.querySelectorAll("video"));
  for (const video of videos) {
    try {
      const dataUrl = await videoFrameToDataUrl(video);
      if (!dataUrl || !video.parentElement) continue;

      const replacement = document.createElement("img");
      replacement.src = dataUrl;
      replacement.alt = "";
      replacement.setAttribute("data-pdf-image", "true");
      replacement.className = video.className;
      replacement.style.cssText = video.style.cssText;
      if (!replacement.style.objectFit) {
        replacement.style.objectFit = "cover";
      }
      if (!replacement.style.width) {
        replacement.style.width = "100%";
        replacement.style.height = "100%";
      }

      const parent = video.parentElement;
      parent.replaceChild(replacement, video);
      restores.push(() => {
        parent.replaceChild(video, replacement);
      });
    } catch {
      // ignore video frame failures
    }
  }

  return () => {
    for (const restore of restores.reverse()) restore();
  };
}


async function renderCanvas(element: HTMLElement, scale: number) {
  const width = Math.ceil(element.offsetWidth || element.scrollWidth);
  const height = Math.ceil(element.scrollHeight);

  return html2canvas(element, {
    backgroundColor: "#000000",
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
    scrollX: -window.scrollX,
    scrollY: -window.scrollY,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    onclone: (clonedDocument, clonedElement) => {
      stripStylesheets(clonedDocument);
      inlineComputedStyles(element, clonedElement);
      resetCloneLayout(clonedElement, width);

      // Ensure every cloned <img> keeps an embeddable data URL / absolute src.
      const liveImages = element.querySelectorAll("img");
      const clonedImages = clonedElement.querySelectorAll("img");
      clonedImages.forEach((cloneImg, index) => {
        const liveImg = liveImages[index];
        if (!(cloneImg instanceof HTMLImageElement)) return;
        if (liveImg instanceof HTMLImageElement && liveImg.src.startsWith("data:")) {
          cloneImg.removeAttribute("srcset");
          cloneImg.src = liveImg.src;
        }
        cloneImg.style.opacity = "1";
        cloneImg.style.visibility = "visible";
        if (
          cloneImg.style.position === "absolute" &&
          (!cloneImg.style.width || cloneImg.style.width === "auto")
        ) {
          cloneImg.style.width = "100%";
          cloneImg.style.height = "100%";
        }
      });

      const { body, documentElement } = clonedDocument;
      if (body) {
        body.style.margin = "0";
        body.style.padding = "0";
        body.style.background = "#000000";
      }
      if (documentElement) {
        documentElement.style.margin = "0";
        documentElement.style.padding = "0";
        documentElement.style.background = "#000000";
      }
    },
  });
}

function loadDataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = dataUrl;
  });
}

async function renderCanvasWithHtmlToImage(
  element: HTMLElement,
  pixelRatio: number,
) {
  const dataUrl = await toPng(element, {
    backgroundColor: "#000000",
    pixelRatio,
    cacheBust: true,
    style: {
      margin: "0",
      marginLeft: "0",
      marginRight: "0",
      transform: "none",
      maxWidth: "none",
    },
  });

  return loadDataUrlToCanvas(dataUrl);
}

/**
 * Crops uniform black letterboxing that html2canvas sometimes leaves on one
 * side when capturing centered layouts.
 */
function trimBlackEdges(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const { width, height } = canvas;
  const { data } = context.getImageData(0, 0, width, height);
  const isBlack = (index: number) =>
    data[index] <= 8 && data[index + 1] <= 8 && data[index + 2] <= 8;

  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  outerTop: for (; top < height; top++) {
    for (let x = 0; x < width; x++) {
      if (!isBlack((top * width + x) * 4)) break outerTop;
    }
  }
  outerBottom: for (; bottom > top; bottom--) {
    for (let x = 0; x < width; x++) {
      if (!isBlack((bottom * width + x) * 4)) break outerBottom;
    }
  }
  outerLeft: for (; left < width; left++) {
    for (let y = top; y <= bottom; y++) {
      if (!isBlack((y * width + left) * 4)) break outerLeft;
    }
  }
  outerRight: for (; right > left; right--) {
    for (let y = top; y <= bottom; y++) {
      if (!isBlack((y * width + right) * 4)) break outerRight;
    }
  }

  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;
  if (
    cropWidth <= 0 ||
    cropHeight <= 0 ||
    (left === 0 && top === 0 && right === width - 1 && bottom === height - 1)
  ) {
    return canvas;
  }

  // Ignore tiny trims (anti-aliasing) and near-empty results.
  if (left < 4 && right > width - 5 && top < 4 && bottom > height - 5) {
    return canvas;
  }
  if (cropWidth < width * 0.5 || cropHeight < height * 0.5) {
    return canvas;
  }

  const trimmed = document.createElement("canvas");
  trimmed.width = cropWidth;
  trimmed.height = cropHeight;
  const trimmedContext = trimmed.getContext("2d");
  if (!trimmedContext) return canvas;
  trimmedContext.fillStyle = "#000000";
  trimmedContext.fillRect(0, 0, cropWidth, cropHeight);
  trimmedContext.drawImage(
    canvas,
    left,
    top,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );
  return trimmed;
}

function fillPdfPageBlack(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(0, 0, 0);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
}

function addCanvasToPdf(canvas: HTMLCanvasElement, pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Edge-to-edge on black pages — no white letterbox margins.
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  fillPdfPageBlack(pdf);
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    fillPdfPageBlack(pdf);
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  await document.fonts.ready;

  const previousScrollX = window.scrollX;
  const previousScrollY = window.scrollY;
  window.scrollTo(0, 0);

  const previousMarginLeft = element.style.marginLeft;
  const previousMarginRight = element.style.marginRight;
  const previousMaxWidth = element.style.maxWidth;
  const previousWidth = element.style.width;
  const previousTransform = element.style.transform;

  // Temporarily pin the live element so capture isn't biased by mx-auto.
  const captureWidth = Math.ceil(element.offsetWidth || element.scrollWidth);
  element.style.marginLeft = "0";
  element.style.marginRight = "0";
  element.style.maxWidth = "none";
  element.style.width = `${captureWidth}px`;
  element.style.transform = "none";

  let restoreImages: (() => void) | undefined;

  try {
    restoreImages = await embedImagesAsDataUrls(element);
    // Layout settle after src swaps / video → img replacements.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => setTimeout(resolve, 100));

    let canvas: HTMLCanvasElement | undefined;
    let lastError: unknown;

    for (const scale of [2, 1.5] as const) {
      try {
        canvas = await renderCanvas(element, scale);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!canvas) {
      try {
        canvas = await renderCanvasWithHtmlToImage(element, 2);
      } catch (fallbackError) {
        throw lastError ?? fallbackError;
      }
    }

    canvas = trimBlackEdges(canvas);

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas is empty");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    addCanvasToPdf(canvas, pdf);
    pdf.save(filename);
  } finally {
    restoreImages?.();
    element.style.marginLeft = previousMarginLeft;
    element.style.marginRight = previousMarginRight;
    element.style.maxWidth = previousMaxWidth;
    element.style.width = previousWidth;
    element.style.transform = previousTransform;
    window.scrollTo(previousScrollX, previousScrollY);
  }
}
