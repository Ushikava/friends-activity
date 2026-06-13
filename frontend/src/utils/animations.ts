import type { Variants } from 'framer-motion'

export const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export const statVariants: Variants = {
  hidden: { opacity: 0, scale: 0.82 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
}

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}
