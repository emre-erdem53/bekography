/** Hizmet grid renkleri — admin panelinden düzenlenmez, site temasına sabitlenir. */
export const PACKAGE_SERVICE_THEME = {
  serviceGridColor: "#1a1a1a",
  serviceTextColor: "#fafafa",
  serviceSubTextColor: "#a1a1aa",
} as const;

export function applyPackageServiceTheme<T extends object>(content: T) {
  return { ...content, ...PACKAGE_SERVICE_THEME };
}
