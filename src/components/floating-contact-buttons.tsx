"use client";

import { motion } from "framer-motion";
import { Phone, MessageCircle } from "lucide-react";

const PHONE_TEL = "+442079460123";
const WHATSAPP_NUMBER = "442079460123";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Merhaba%20Bekography%2C%20bilgi%20almak%20istiyorum.`;

export function FloatingContactButtons() {
  return (
    <div className="fixed bottom-5 right-4 z-[70] flex flex-col gap-2 md:right-5">
      <motion.a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp ile iletişime geç"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25d366] text-black shadow-lg transition-transform hover:scale-[1.03]"
        whileTap={{ scale: 0.96 }}
      >
        <MessageCircle className="h-5 w-5" />
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
