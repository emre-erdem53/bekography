"use client";

import { useEffect, useState } from "react";
import { AlertBar } from "@/components/admin/alert-bar";

type ApprovedRequestAlert = {
  id: string;
  customerName: string;
};

export function ApprovedRequestAlerts() {
  const [alerts, setAlerts] = useState<ApprovedRequestAlert[]>([]);

  useEffect(() => {
    fetch("/api/admin/alerts")
      .then((res) => res.json())
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="min-w-0 space-y-2 overflow-hidden border-b border-white/10 px-4 py-3 sm:px-6 md:px-8">
      {alerts.map((alert) => (
        <AlertBar
          key={alert.id}
          message={`${alert.customerName} adına onaylanmış bir talep bulunmaktadır ancak rezervasyonu oluşturulmamış durumda. Rezervasyon oluşturulmalısınız.`}
          href={`/admin/rezervasyonlar/yeni?requestId=${alert.id}`}
        />
      ))}
    </div>
  );
}
