"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Primitivos de animación reutilizables para el portal. Son Client
 * Components delgados que reciben contenido ya resuelto por Server
 * Components (incluidos límites <Suspense>) como `children` — React permite
 * pasar ese árbol server-renderizado como children de un Client Component
 * sin perder el streaming.
 */

const variantesFade: Variants = {
  oculto: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      animate="visible"
      variants={variantesFade}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const contenedorStagger: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export function StaggerGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      animate="visible"
      variants={contenedorStagger}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={variantesFade}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.ul
      className={className}
      initial="oculto"
      animate="visible"
      variants={contenedorStagger}
    >
      {children}
    </motion.ul>
  );
}

export function StaggerListItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.li
      className={className}
      variants={variantesFade}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.li>
  );
}
