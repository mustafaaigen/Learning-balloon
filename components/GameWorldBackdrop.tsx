'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  playBalloonPopSound,
  triggerBalloonPopVibration,
} from '@/lib/audio-engine';

interface GameWorldBackdropProps {
  showAmbientBalloons?: boolean;
  isDark?: boolean;
}

const AMBIENT_BALLOONS = [
  { id: 1, color: '#FF6B8B', hueRotate: 0, left: '4%', delay: 0, duration: 16, scale: 0.74, label: '🎈' },
  { id: 2, color: '#FF8E53', hueRotate: 22, left: '15%', delay: 2.2, duration: 18, scale: 0.65, label: '⭐' },
  { id: 3, color: '#84CC16', hueRotate: 115, left: '82%', delay: 1.0, duration: 15, scale: 0.7, label: '🌟' },
  { id: 4, color: '#38BDF8', hueRotate: 195, left: '90%', delay: 3.4, duration: 17, scale: 0.66, label: '🎈' },
  { id: 5, color: '#FACC15', hueRotate: 42, left: '72%', delay: 4.5, duration: 19, scale: 0.6, label: '✨' },
  { id: 6, color: '#A855F7', hueRotate: 275, left: '10%', delay: 6.0, duration: 16, scale: 0.62, label: '🎉' },
  { id: 7, color: '#FF6B8B', hueRotate: 0, left: '26%', delay: 4.0, duration: 20, scale: 0.58, label: '🌈' },
  { id: 8, color: '#10B981', hueRotate: 145, left: '64%', delay: 1.8, duration: 17, scale: 0.6, label: '🦋' },
];

const NIGHT_STARS = [
  { top: '8%', left: '22%', size: 'w-2 h-2', delay: '0s' },
  { top: '14%', left: '34%', size: 'w-2.5 h-2.5', delay: '0.6s' },
  { top: '7%', left: '48%', size: 'w-1.5 h-1.5', delay: '1.2s' },
  { top: '16%', left: '62%', size: 'w-2 h-2', delay: '0.3s' },
  { top: '10%', left: '74%', size: 'w-2 h-2', delay: '0.9s' },
  { top: '26%', left: '20%', size: 'w-1.5 h-1.5', delay: '1.5s' },
  { top: '28%', left: '52%', size: 'w-2.5 h-2.5', delay: '0.4s' },
  { top: '24%', left: '78%', size: 'w-1.5 h-1.5', delay: '1.1s' },
  { top: '36%', left: '12%', size: 'w-2 h-2', delay: '0.8s' },
  { top: '34%', left: '68%', size: 'w-2 h-2', delay: '1.4s' },
];

const MEADOW_FLOWERS = [
  { bottom: '18%', left: '7%', scale: 0.9 },
  { bottom: '14%', left: '13%', scale: 0.7 },
  { bottom: '22%', left: '19%', scale: 0.85 },
  { bottom: '10%', left: '25%', scale: 1.0 },
  { bottom: '19%', left: '34%', scale: 0.75 },
  { bottom: '12%', left: '42%', scale: 0.9 },
  { bottom: '24%', left: '58%', scale: 0.8 },
  { bottom: '15%', left: '66%', scale: 0.95 },
  { bottom: '21%', left: '75%', scale: 0.7 },
  { bottom: '11%', left: '83%', scale: 1.0 },
  { bottom: '17%', left: '91%', scale: 0.85 },
];

const POP_SHARD_ANGLES = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
];

export default function GameWorldBackdrop({
  showAmbientBalloons = true,
  isDark = false,
}: GameWorldBackdropProps) {
  const [poppedMap, setPoppedMap] = useState<Record<number, boolean>>({});

  const handlePopAmbientBalloon = useCallback(
    (id: number, e: React.PointerEvent | React.MouseEvent) => {
      e.stopPropagation();
      playBalloonPopSound();
      triggerBalloonPopVibration([35, 20, 40]);
      setPoppedMap((prev) => ({ ...prev, [id]: true }));

      // Respawn a fresh floating balloon after 2.3 seconds so kids can keep popping!
      setTimeout(() => {
        setPoppedMap((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2300);
    },
    []
  );

  return (
    <>
      {/* Layer 1: 3D Sky, Uploaded Sun & Moon Variants, Extracted Fluffy Clouds & Velvety Green Hills (z-0) */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 transition-colors duration-500"
        aria-hidden="true"
      >
        {/* 1. Day vs Night 3D Sky Gradient */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-b from-[#070B19] via-[#111C38] to-[#1E1B4B]'
              : 'bg-gradient-to-b from-[#3B9AE8] via-[#65B8F7] to-[#B8E3FF]'
          }`}
        />

        {/* Twinkling Night Stars when Dark Mode is active */}
        {isDark && (
          <div className="absolute inset-0">
            {NIGHT_STARS.map((star, idx) => (
              <div
                key={idx}
                style={{
                  top: star.top,
                  left: star.left,
                  animationDelay: star.delay,
                }}
                className={`absolute ${star.size} rounded-full bg-amber-100 shadow-[0_0_10px_#FEF08A] animate-pulse`}
              />
            ))}
          </div>
        )}

        {/* 2. Full, Whole 3D Fluffy Clouds across the Sky (Zero half-cut edges on any screen size) */}
        {/* Upper Left Full 3D Cloud */}
        <div
          className={`absolute top-[15%] left-[3%] sm:left-[5%] w-48 sm:w-64 md:w-76 animate-float-breeze transition-opacity duration-500 ${
            isDark ? 'opacity-80' : 'opacity-98'
          }`}
        >
          <img
            src="/assets/aistudio/cloud_left_variant.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain drop-shadow-[0_14px_24px_rgba(15,23,42,0.16)]"
          />
        </div>

        {/* Upper Right Full 3D Cloud */}
        <div
          className={`absolute top-[14%] right-[3%] sm:right-[5%] w-48 sm:w-64 md:w-76 animate-float-slow transition-opacity duration-500 ${
            isDark ? 'opacity-80' : 'opacity-98'
          }`}
        >
          <img
            src="/assets/aistudio/cloud_left_variant.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain scale-x-[-1] drop-shadow-[0_16px_26px_rgba(15,23,42,0.16)]"
          />
        </div>

        {/* Mid-Sky Left & Right Full 3D Clouds for Full-Screen Desktop Richness */}
        <div
          className={`hidden lg:block absolute top-[8%] left-[24%] w-44 xl:w-52 animate-float-slow transition-opacity duration-500 ${
            isDark ? 'opacity-65' : 'opacity-90'
          }`}
        >
          <img
            src="/assets/aistudio/cloud_right_variant.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain drop-shadow-[0_12px_20px_rgba(15,23,42,0.12)]"
          />
        </div>

        <div
          className={`hidden lg:block absolute top-[9%] right-[24%] w-44 xl:w-52 animate-float-breeze transition-opacity duration-500 ${
            isDark ? 'opacity-65' : 'opacity-90'
          }`}
        >
          <img
            src="/assets/aistudio/cloud_left_variant.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain drop-shadow-[0_12px_20px_rgba(15,23,42,0.12)]"
          />
        </div>

        {/* Lower Horizon Full 3D Fluffy Clouds nestled above the green hills */}
        <div
          className={`absolute bottom-[19%] left-[4%] sm:left-[6%] w-44 sm:w-60 md:w-72 animate-float-breeze transition-opacity duration-500 ${
            isDark ? 'opacity-75' : 'opacity-95'
          }`}
        >
          <img
            src="/assets/aistudio/cloud_right_variant.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain drop-shadow-[0_12px_20px_rgba(15,23,42,0.14)]"
          />
        </div>

        <div
          className={`absolute bottom-[20%] right-[4%] sm:right-[6%] w-44 sm:w-60 md:w-72 animate-float-slow transition-opacity duration-500 ${
            isDark ? 'opacity-75' : 'opacity-95'
          }`}
        >
          <img
            src="/assets/aistudio/cloud_right_variant.png"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain scale-x-[-1] drop-shadow-[0_12px_20px_rgba(15,23,42,0.14)]"
          />
        </div>

        {/* 3. Day Mode: 3D Sun in the upper-left corner | Dark Mode: Uploaded 3D Crescent Moon in the exact same upper-left spot */}
        <div className="absolute top-12 left-2 sm:top-14 sm:left-4 md:top-14 md:left-6 z-10 transition-all duration-500">
          {!isDark ? (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-yellow-300/55 pointer-events-none" />
              <img
                src="/assets/aistudio/sun_variant.png"
                alt="3D Sun with Sunglasses"
                referrerPolicy="no-referrer"
                className="relative w-22 h-22 sm:w-26 sm:h-26 md:w-30 md:h-30 object-contain animate-gentle-bob drop-shadow-[0_14px_28px_rgba(245,158,11,0.55)]"
              />
            </div>
          ) : (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-amber-300/45 pointer-events-none" />
              <img
                src="/assets/aistudio/moon_variant.png"
                alt="3D Golden Crescent Moon"
                referrerPolicy="no-referrer"
                className="relative w-22 h-22 sm:w-26 sm:h-26 md:w-30 md:h-30 object-contain animate-gentle-bob scale-105 drop-shadow-[0_0_32px_rgba(253,224,71,0.85)]"
              />
            </div>
          )}
        </div>

        {/* 4. Plush 3D Velvety Rolling Green Hills & Wildflower Meadow matching images__2__99d7dc3b.jpg */}
        <div className="absolute bottom-0 inset-x-0 h-32 sm:h-40 md:h-44 overflow-hidden">
          <svg
            viewBox="0 0 1440 260"
            fill="none"
            preserveAspectRatio="none"
            className="absolute bottom-0 w-full h-full drop-shadow-[0_-10px_24px_rgba(21,128,61,0.22)]"
          >
            <defs>
              <linearGradient id="hillBackGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#15803D' : '#BEF264'} />
                <stop offset="50%" stopColor={isDark ? '#166534' : '#84CC16'} />
                <stop offset="100%" stopColor={isDark ? '#064E3B' : '#3F6212'} />
              </linearGradient>
              <linearGradient id="hillMidGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isDark ? '#166534' : '#A3E635'} />
                <stop offset="55%" stopColor={isDark ? '#14532D' : '#65A30D'} />
                <stop offset="100%" stopColor={isDark ? '#052E16' : '#365314'} />
              </linearGradient>
              <linearGradient id="hillFrontGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#22C55E' : '#bef264'} />
                <stop offset="35%" stopColor={isDark ? '#15803D' : '#84CC16'} />
                <stop offset="100%" stopColor={isDark ? '#064E3B' : '#4D7C0F'} />
              </linearGradient>
            </defs>

            {/* Left & Right Plush 3D Slopes */}
            <path
              d="M0 70 C290 15, 560 175, 920 95 C1150 45, 1320 65, 1440 90 L1440 260 L0 260 Z"
              fill="url(#hillBackGrad)"
            />
            <path
              d="M0 135 C360 200, 820 40, 1440 115 L1440 260 L0 260 Z"
              fill="url(#hillMidGrad)"
            />
            <path
              d="M0 175 C460 110, 940 205, 1440 150 L1440 260 L0 260 Z"
              fill="url(#hillFrontGrad)"
            />
          </svg>

          {/* Tiny White Meadow Blossoms scattered across the velvety green hills */}
          {MEADOW_FLOWERS.map((fl, idx) => (
            <div
              key={idx}
              style={{
                bottom: fl.bottom,
                left: fl.left,
                transform: `scale(${fl.scale})`,
              }}
              className="absolute flex items-center gap-1 opacity-85"
            >
              <span className="w-2 h-1.5 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
              <span className="w-1.5 h-1 rounded-full bg-lime-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Layer 2: Interactive Poppable Floating Sky Balloons using the Uploaded Balloon Variant PNG (z-[15]) */}
      {showAmbientBalloons && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-[15]">
          {AMBIENT_BALLOONS.map((b) => {
            const isPopped = Boolean(poppedMap[b.id]);

            return (
              <motion.div
                key={b.id}
                initial={{ y: '105vh', opacity: 0.95 }}
                animate={{ y: '-24vh', opacity: [0.92, 1, 0.92] }}
                transition={{
                  duration: b.duration,
                  repeat: Infinity,
                  delay: b.delay,
                  ease: 'linear',
                }}
                style={{ left: b.left, scale: b.scale }}
                className="absolute pointer-events-auto"
              >
                <AnimatePresence mode="wait">
                  {!isPopped ? (
                    <motion.button
                      key="balloon-intact"
                      type="button"
                      onPointerDown={(e) => handlePopAmbientBalloon(b.id, e)}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{
                        scale: [1, 1.38, 1.48, 0],
                        opacity: [1, 1, 1, 0],
                        transition: {
                          duration: 0.2,
                          times: [0, 0.45, 0.75, 1],
                          ease: 'easeOut',
                        },
                      }}
                      title="Tap to pop balloon!"
                      className="p-1.5 animate-gentle-bob flex flex-col items-center cursor-pointer touch-manipulation focus:outline-none group relative"
                    >
                      <div className="relative w-28 h-36 flex items-center justify-center transition-transform group-hover:scale-110 active:scale-125">
                        <img
                          src="/assets/aistudio/balloon_variant.png"
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{
                            filter: `hue-rotate(${b.hueRotate}deg) saturate(1.08) drop-shadow(0 12px 20px rgba(15,23,42,0.22))`,
                          }}
                          className="w-full h-full object-contain pointer-events-none select-none"
                        />
                        <span className="absolute -mt-6 text-white font-display font-extrabold text-2xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.32)]">
                          {b.label}
                        </span>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="balloon-popped"
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-36 h-36 flex flex-col items-center justify-center pointer-events-none"
                    >
                      {/* Radial Flash Core */}
                      <motion.div
                        initial={{ scale: 0.2, opacity: 1 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.32, ease: 'easeOut' }}
                        className="absolute w-20 h-20 rounded-full bg-white/95 blur-xs"
                      />
                      {/* Primary Shockwave Ring */}
                      <motion.div
                        initial={{ scale: 0.4, opacity: 1 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{ borderColor: b.color }}
                        className="absolute w-24 h-24 rounded-full border-4"
                      />
                      {/* Secondary Shockwave Ring */}
                      <motion.div
                        initial={{ scale: 0.25, opacity: 0.9 }}
                        animate={{ scale: 2.7, opacity: 0 }}
                        transition={{
                          duration: 0.65,
                          delay: 0.04,
                          ease: 'easeOut',
                        }}
                        className="absolute w-24 h-24 rounded-full border-2 border-dashed border-amber-300"
                      />
                      {/* Center POP! Burst */}
                      <motion.div
                        initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
                        animate={{
                          scale: [0.3, 1.35, 1],
                          rotate: [-10, 8, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{ duration: 0.85, ease: 'easeOut' }}
                        className="relative z-10 flex flex-col items-center"
                      >
                        <span className="text-4xl font-extrabold drop-shadow">
                          💥
                        </span>
                        <span className="text-xs font-display font-extrabold text-white bg-gradient-to-r from-pink-500 to-orange-500 px-2.5 py-0.5 rounded-full shadow border border-white">
                          POP! 🎈
                        </span>
                      </motion.div>
                      {/* 12 Flying Latex Shards with Gravity Arc */}
                      {POP_SHARD_ANGLES.map((deg, idx) => {
                        const rad = (deg * Math.PI) / 180;
                        const dist = idx % 2 === 0 ? 78 : 56;
                        return (
                          <motion.span
                            key={deg}
                            initial={{
                              x: 0,
                              y: 0,
                              scale: 1.25,
                              rotate: 0,
                              opacity: 1,
                            }}
                            animate={{
                              x: Math.cos(rad) * dist,
                              y: Math.sin(rad) * dist + 16,
                              scale: 0,
                              rotate: deg + 180,
                              opacity: 0,
                            }}
                            transition={{ duration: 0.62, ease: 'easeOut' }}
                            style={{ backgroundColor: b.color }}
                            className={`absolute shadow-xs ${
                              idx % 2 === 0
                                ? 'w-4 h-2.5 rounded-tl-full rounded-br-full'
                                : 'w-3 h-3 rounded-full'
                            }`}
                          />
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
