export function buildAdminListHref(
  basePath: string,
  options: {
    year?: number;
    view?: "silinenler";
    currentYear: number;
  },
): string {
  const params = new URLSearchParams();

  if (options.view === "silinenler") {
    params.set("view", "silinenler");
  }

  if (options.year && options.year !== options.currentYear) {
    params.set("year", String(options.year));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
