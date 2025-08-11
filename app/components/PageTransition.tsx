'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 0.98
    }
  };

  const contentVariants = {
    initial: { opacity: 0, y: 30 },
    in: { 
      opacity: 1, 
      y: 0
    },
    out: { 
      opacity: 0, 
      y: -30
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
      >
        <motion.div variants={contentVariants}>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 