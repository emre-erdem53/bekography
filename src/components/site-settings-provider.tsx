"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultSiteSettings,
  getPaymentTypeDescriptions,
  getPaymentTypeLabels,
  type SiteSettingsData,
} from "@/lib/site-settings";

type SiteSettingsContextValue = {
  settings: SiteSettingsData;
  refreshSettings: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings?: SiteSettingsData;
}) {
  const [settings, setSettings] = useState<SiteSettingsData>(
    initialSettings ?? defaultSiteSettings(),
  );

  async function refreshSettings() {
    const response = await fetch("/api/settings");
    if (!response.ok) return;
    const data = await response.json();
    setSettings(data);
  }

  useEffect(() => {
    if (!initialSettings) {
      void refreshSettings();
    }
  }, [initialSettings]);

  const value = useMemo(
    () => ({ settings, refreshSettings }),
    [settings],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    return defaultSiteSettings();
  }
  return context.settings;
}

export function usePaymentTypeCopy() {
  const settings = useSiteSettings();
  return useMemo(
    () => ({
      labels: getPaymentTypeLabels(settings),
      descriptions: getPaymentTypeDescriptions(settings),
    }),
    [settings],
  );
}

export function useSiteSettingsActions() {
  const context = useContext(SiteSettingsContext);
  return {
    refreshSettings: context?.refreshSettings ?? (async () => {}),
  };
}
