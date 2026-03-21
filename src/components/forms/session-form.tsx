"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export function SessionForm() {
  const reduce = useReducedMotion();

  const item = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.01 : 0.5, ease: EASE_OUT },
    },
  };

  const fieldClass =
    "w-full border-0 border-b-2 border-black bg-transparent px-0 py-4 text-sm text-zinc-900 transition-colors placeholder:text-gray-300 focus:border-gray-400 focus:ring-0 focus:outline-none dark:border-white dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400";

  return (
    <motion.form
      className="space-y-12"
      onSubmit={(e) => {
        e.preventDefault();
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-8%" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : 0.11,
            delayChildren: reduce ? 0 : 0.06,
          },
        },
      }}
    >
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <motion.div className="space-y-4" variants={item}>
          <label
            className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-white"
            htmlFor="session-name"
          >
            Name
          </label>
          <input
            id="session-name"
            name="name"
            type="text"
            placeholder="FULL NAME"
            className={fieldClass}
          />
        </motion.div>
        <motion.div className="space-y-4" variants={item}>
          <label
            className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-white"
            htmlFor="session-email"
          >
            Email
          </label>
          <input
            id="session-email"
            name="email"
            type="email"
            placeholder="YOUR@EMAIL.COM"
            className={fieldClass}
          />
        </motion.div>
      </div>
      <motion.div className="space-y-4" variants={item}>
        <label
          className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-white"
          htmlFor="session-message"
        >
          Message
        </label>
        <textarea
          id="session-message"
          name="message"
          rows={3}
          placeholder="DESCRIBE YOUR VISION"
          className={fieldClass}
        />
      </motion.div>
      <motion.div className="pt-12 text-center" variants={item}>
        <motion.button
          type="submit"
          className="border border-black bg-black px-16 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:bg-white hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:hover:text-black"
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          Send Message
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
