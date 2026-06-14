"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Phone } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

const PHONE_TEL = "+905469370464";
const WHATSAPP_NUMBER = "905469370464";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Merhaba%20Bekography%2C%20bilgi%20almak%20istiyorum.`;

export function FloatingContactButtons() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.items.length);
  const onPackagesRoute = pathname.startsWith("/paketler");
  const raised = onPackagesRoute && cartCount > 0;

  return (
    <div
      className={`fixed right-4 z-[55] flex flex-col gap-2 md:right-5 ${
        raised ? "bottom-28" : "bottom-5"
      }`}
    >
      <motion.a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp ile iletişime geç"
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#ffffff] shadow-lg transition-transform hover:scale-[1.03]"
        whileTap={{ scale: 0.96 }}
      >
        <Image
          src="/whatsapp.svg"
          alt=""
          width={24}
          height={24}
          priority
          loading="eager"
          aria-hidden
        />
      </motion.a>

      <motion.a
        href={`tel:${PHONE_TEL}`}
        aria-label="Telefon ile ara"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-lg ring-1 ring-white/15 transition-transform hover:scale-[1.03] dark:bg-white dark:text-black"
        whileTap={{ scale: 0.96 }}
      >
        <Phone className="h-5 w-5" />
      </motion.a>
    </div>
  );
}
