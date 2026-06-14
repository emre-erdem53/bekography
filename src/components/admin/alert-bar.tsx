"use client";

import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

type AlertBarProps = {
  message: string;
  href?: string;
};

export function AlertBar({ message, href }: AlertBarProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setVisible(false);
        }}
        className="rounded-lg p-1 hover:bg-red-500/20"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
