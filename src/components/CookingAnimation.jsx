import React from 'react';
import { motion } from 'framer-motion';

export default function CookingAnimation({ type = 'chef', className = '' }) {
  if (type === 'chef') {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Chef's body */}
          <motion.circle
            cx="50"
            cy="60"
            r="25"
            fill="#e8d5b7"
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Chef's apron */}
          <motion.path
            d="M35 65 L65 65 L70 85 L30 85 Z"
            fill="#10b981"
            animate={{
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Chef's head */}
          <motion.circle
            cx="50"
            cy="40"
            r="15"
            fill="#fdbcb4"
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Chef's hat */}
          <motion.path
            d="M30 30 Q50 20, 70 30 L70 35 L30 35 Z"
            fill="#ffffff"
            animate={{
              y: [0, -1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Steam bubbles */}
          <motion.circle
            cx="25"
            cy="30"
            r="3"
            fill="#60a5fa"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0,
            }}
          />
          <motion.circle
            cx="75"
            cy="25"
            r="3"
            fill="#60a5fa"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
          <motion.circle
            cx="35"
            cy="15"
            r="2"
            fill="#60a5fa"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </svg>
      </motion.div>
    );
  }

  if (type === 'cooking') {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Pot */}
          <motion.path
            d="M20 60 L20 50 C20 45, 25 40, 30 40 L70 40 C75 40, 80 45, 80 50 L80 60"
            fill="#64748b"
            stroke="#475569"
            strokeWidth="2"
          />
          {/* Pot handle */}
          <motion.path
            d="M80 50 Q85 50, 85 55"
            fill="none"
            stroke="#475569"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Lid */}
          <motion.ellipse cx="50" cy="45" rx="30" ry="8" fill="#94a3b8" />
          {/* Steam */}
          <motion.path
            d="M 40 35 Q 40 25, 35 20"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.path
            d="M 50 35 Q 50 25, 50 20"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
          <motion.path
            d="M 60 35 Q 60 25, 65 20"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.6,
            }}
          />
        </svg>
      </motion.div>
    );
  }

  if (type === 'recipe-book') {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Book */}
          <motion.rect x="20" y="30" width="50" height="60" rx="3" fill="#8b5cf6" />
          {/* Pages */}
          <motion.path
            d="M25 35 L25 85 M30 35 L30 85 M35 35 L35 85 M40 35 L40 85 M45 35 L45 85 M50 35 L50 85"
            fill="none"
            stroke="#e879f9"
            strokeWidth="0.5"
            opacity="0.6"
          />
          {/* Text lines */}
          <motion.line
            x1="30"
            y1="42"
            x2="48"
            y2="42"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              scaleX: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.line
            x1="30"
            y1="50"
            x2="48"
            y2="50"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.line
            x1="30"
            y1="58"
            x2="45"
            y2="58"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    );
  }

  return null;
}
