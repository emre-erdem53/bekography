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
  "transform",
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

async function renderCanvas(element: HTMLElement, scale: number) {
  const scrollY = window.scrollY;

  return html2canvas(element, {
    backgroundColor: "#000000",
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    scrollX: 0,
    scrollY: -scrollY,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDocument, clonedElement) => {
      stripStylesheets(clonedDocument);
      inlineComputedStyles(element, clonedElement);
      clonedElement.style.background = "#000000";
      clonedElement.style.width = `${element.scrollWidth}px`;
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
  });

  return loadDataUrlToCanvas(dataUrl);
}

function addCanvasToPdf(canvas: HTMLCanvasElement, pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  await document.fonts.ready;

  const previousScrollY = window.scrollY;
  window.scrollTo(0, 0);

  try {
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
    window.scrollTo(0, previousScrollY);
  }
}
