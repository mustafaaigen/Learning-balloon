'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2 } from 'lucide-react';
import {
  playBalloonPopSound,
  triggerBalloonPopVibration,
} from '@/lib/audio-engine';

export interface CarouselBalloonItem {
  label: string;
  color: string;
  icon?: string;
}

interface BalloonGraphicProps {
  color: string;
  mainText: string;
  subText?: string;
  icon?: string;
  meaningText?: string;
  voiceLevel?: number;
  state:
    | 'swirling'
    | 'speaking'
    | 'mic_ready'
    | 'listening'
    | 'celebrating'
    | 'retry';
  onReplaySound: () => void;
  rtl?: boolean;
  carouselItems?: CarouselBalloonItem[];
  activeIndex?: number;
  poppedIndices?: number[];
}

const VOICE_WAVE_BAR_ANGLES = Array.from({ length: 24 }, (_, idx) => idx * 15);

const BURST_SHARDS = [
  { angle: 0, dist: 145, size: 'w-6 h-8', color: '#FF5E7E', emoji: '✨', kind: 'shard' },
  { angle: 18, dist: 180, size: 'w-4 h-4', color: '#FACC15', emoji: '⭐', kind: 'star' },
  { angle: 36, dist: 135, size: 'w-7 h-3', color: '#38BDF8', emoji: '🎉', kind: 'ribbon' },
  { angle: 54, dist: 165, size: 'w-5 h-6', color: '#A855F7', emoji: '🌟', kind: 'shard' },
  { angle: 72, dist: 190, size: 'w-4 h-4', color: '#10B981', emoji: '✨', kind: 'orb' },
  { angle: 90, dist: 145, size: 'w-5 h-7', color: '#10B981', emoji: '✨', kind: 'shard' },
  { angle: 108, dist: 175, size: 'w-7 h-3', color: '#FF8E53', emoji: '🎊', kind: 'ribbon' },
  { angle: 126, dist: 155, size: 'w-6 h-6', color: '#FF5E7E', emoji: '⭐', kind: 'star' },
  { angle: 144, dist: 185, size: 'w-4 h-4', color: '#FACC15', emoji: '🌟', kind: 'orb' },
  { angle: 162, dist: 140, size: 'w-7 h-5', color: '#FACC15', emoji: '🌟', kind: 'shard' },
  { angle: 180, dist: 165, size: 'w-6 h-8', color: '#38BDF8', emoji: '💥', kind: 'shard' },
  { angle: 198, dist: 190, size: 'w-7 h-3', color: '#A855F7', emoji: '✨', kind: 'ribbon' },
  { angle: 216, dist: 150, size: 'w-5 h-6', color: '#A855F7', emoji: '✨', kind: 'star' },
  { angle: 234, dist: 175, size: 'w-5 h-5', color: '#10B981', emoji: '🎉', kind: 'orb' },
  { angle: 252, dist: 140, size: 'w-7 h-6', color: '#FF8E53', emoji: '⭐', kind: 'shard' },
  { angle: 270, dist: 160, size: 'w-5 h-7', color: '#FF5E7E', emoji: '🌟', kind: 'shard' },
  { angle: 288, dist: 185, size: 'w-7 h-3', color: '#FACC15', emoji: '🎊', kind: 'ribbon' },
  { angle: 306, dist: 170, size: 'w-6 h-5', color: '#FACC15', emoji: '🎊', kind: 'star' },
  { angle: 324, dist: 155, size: 'w-6 h-6', color: '#38BDF8', emoji: '✨', kind: 'orb' },
  { angle: 342, dist: 145, size: 'w-7 h-5', color: '#A855F7', emoji: '⭐', kind: 'shard' },
];

const BURST_SPARK_STREAKS = Array.from({ length: 12 }, (_, idx) => ({
  angle: idx * 30,
  color:
    idx % 3 === 0
      ? '#FACC15'
      : idx % 3 === 1
      ? '#FF5E7E'
      : '#38BDF8',
}));

const RING_POP_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

// Clear left & right side slots around the center spotlight balloon so EVERY background balloon is 100% uncovered & clickable!
const RING_SLOTS = [
  { x: -260, y: -62, scale: 0.64 },
  { x: 260, y: -62, scale: 0.64 },
  { x: -178, y: -98, scale: 0.56 },
  { x: 178, y: -98, scale: 0.56 },
  { x: -288, y: 26, scale: 0.6 },
  { x: 288, y: 26, scale: 0.6 },
  { x: -192, y: 72, scale: 0.54 },
  { x: 192, y: 72, scale: 0.54 },
];

// Hue rotations so the uploaded pink-coral-orange balloon variant appears both in its iconic original color (0deg) and harmonious 3D variants
const VARIANT_HUE_ROTATIONS = [0, 0, 22, 130, 195, 338, 40, 275];

export default function BalloonGraphic({
  color,
  mainText,
  subText,
  icon,
  meaningText,
  voiceLevel = 0,
  state,
  onReplaySound,
  rtl = false,
  carouselItems = [],
  activeIndex = 0,
  poppedIndices = [],
}: BalloonGraphicProps) {
  const isSwirling = state === 'swirling';
  const isSpeaking = state === 'speaking';
  const isCelebrating = state === 'celebrating';
  const isListening = state === 'listening';
  const clampedVoice = Math.max(0, Math.min(100, voiceLevel));
  const voiceRatio = clampedVoice / 100;

  // Track fun manual pops on the surrounding background ring balloons & tap bursts on main balloon
  const [poppedRingMap, setPoppedRingMap] = useState<Record<number, boolean>>({});
  const [tapPopPulse, setTapPopPulse] = useState<number>(0);

  const handlePopRingBalloon = useCallback(
    (slotKey: number, e: React.PointerEvent | React.MouseEvent) => {
      e.stopPropagation();
      triggerBalloonPopVibration([40, 20, 45]);
      playBalloonPopSound();
      setPoppedRingMap((prev) => ({ ...prev, [slotKey]: true }));

      // Respawn the background balloon after 2.2 seconds so kids can keep popping!
      setTimeout(() => {
        setPoppedRingMap((prev) => {
          const next = { ...prev };
          delete next[slotKey];
          return next;
        });
      }, 2200);
    },
    []
  );

  const isFullSentence =
    mainText.length > 18 ||
    Boolean(meaningText && subText && subText.length > 18);
  const isLongPhrase = !isFullSentence && mainText.length > 10;
  const isMediumWord =
    !isFullSentence && !isLongPhrase && mainText.length > 4 && mainText.length <= 10;

  const spotlightHue =
    VARIANT_HUE_ROTATIONS[activeIndex % VARIANT_HUE_ROTATIONS.length];

  // Pick up to 8 surrounding unpopped balloons to place in clear clickable slots around the main balloon
  const ringBalloons = useMemo(() => {
    if (!carouselItems || carouselItems.length === 0) return [];
    const total = carouselItems.length;
    const maxSlots = Math.min(RING_SLOTS.length, total - 1);
    const items: Array<
      CarouselBalloonItem & {
        slotX: number;
        slotY: number;
        slotScale: number;
        slotIdx: number;
        itemIdx: number;
        hueRotate: number;
      }
    > = [];

    let offset = 1;
    while (items.length < maxSlots && offset < total) {
      const itemIndex = (activeIndex + offset) % total;
      offset++;
      if (poppedIndices.includes(itemIndex)) continue;
      const slot = RING_SLOTS[items.length];
      items.push({
        ...carouselItems[itemIndex],
        slotX: slot.x,
        slotY: slot.y,
        slotScale: slot.scale,
        slotIdx: items.length,
        itemIdx: itemIndex,
        hueRotate:
          VARIANT_HUE_ROTATIONS[itemIndex % VARIANT_HUE_ROTATIONS.length],
      });
    }
    return items;
  }, [carouselItems, activeIndex, poppedIndices]);

  return (
    <div className="relative w-full max-w-4xl h-[136px] sm:h-[195px] md:h-[215px] py-0.5 sm:py-1.5 flex items-center justify-center select-none overflow-visible pointer-events-none">
      {/* 1. Background Ring Balloons in Game Stage using Uploaded Balloon Variant PNG */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-[0.44] sm:scale-[0.72] md:scale-[0.88]">
        {ringBalloons.map((b, i) => {
          const isRingBalloonPopped = Boolean(poppedRingMap[b.itemIdx]);

          return (
            <motion.div
              key={`ring-slot-${b.slotIdx}-${b.itemIdx}`}
              initial={{
                x: b.slotX * 0.5,
                y: b.slotY,
                scale: 0.4,
                opacity: 0.88,
              }}
              animate={{
                x: isSwirling
                  ? [b.slotX * 0.4, b.slotX * 1.08, b.slotX]
                  : [b.slotX, b.slotX + (i % 2 === 0 ? 8 : -8), b.slotX],
                y: isSwirling
                  ? [b.slotY + 30, b.slotY - 15, b.slotY]
                  : [b.slotY, b.slotY - 11, b.slotY],
                scale: b.slotScale,
                opacity: 0.96,
              }}
              transition={{
                duration: isSwirling ? 0.36 : 3.0 + (i % 3) * 0.35,
                repeat: isSwirling ? 0 : Infinity,
                ease: 'easeInOut',
              }}
              className="absolute flex flex-col items-center pointer-events-auto z-20"
            >
              <AnimatePresence mode="wait">
                {!isRingBalloonPopped ? (
                  <motion.button
                    key="ring-intact"
                    type="button"
                    onPointerDown={(e) => handlePopRingBalloon(b.itemIdx, e)}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{
                      scale: [1, 1.4, 0],
                      opacity: [1, 1, 0],
                      transition: { duration: 0.18 },
                    }}
                    title="Tap to pop balloon!"
                    className="p-1.5 flex flex-col items-center cursor-pointer touch-manipulation focus:outline-none group"
                  >
                    {/* Uploaded 3D Balloon Variant PNG */}
                    <div className="relative w-32 h-40 sm:w-36 sm:h-44 flex flex-col items-center justify-center text-center transition-transform group-hover:scale-110 active:scale-125">
                      <img
                        src="/assets/aistudio/balloon_variant.png"
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{
                          filter: `hue-rotate(${b.hueRotate}deg) saturate(1.08) drop-shadow(0 16px 26px rgba(15,23,42,0.28))`,
                        }}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                      />
                      <div className="relative z-10 -mt-7 flex flex-col items-center justify-center px-3">
                        {b.icon && (
                          <span className="text-xl mb-0.5 drop-shadow">
                            {b.icon}
                          </span>
                        )}
                        <span className="font-display font-extrabold text-white text-xl sm:text-2xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.38)] line-clamp-1 px-1">
                          {b.label}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    key="ring-popped"
                    initial={{ scale: 0.4, opacity: 1 }}
                    animate={{ scale: 1.85, opacity: 0 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="relative w-36 h-36 flex flex-col items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0.95 }}
                      animate={{ scale: 1.75, opacity: 0 }}
                      transition={{ duration: 0.45 }}
                      className="absolute inset-0 rounded-full bg-amber-300/55 blur-md"
                    />
                    <div
                      style={{ borderColor: b.color }}
                      className="absolute inset-0 rounded-full border-4"
                    />
                    <span className="text-4xl drop-shadow">💥</span>
                    <span className="text-xs font-display font-extrabold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-3 py-0.5 rounded-full shadow-md border border-white">
                      POP! 🎈
                    </span>
                    {RING_POP_ANGLES.map((deg, rIdx) => {
                      const r = (deg * Math.PI) / 180;
                      const dist = rIdx % 2 === 0 ? 84 : 62;
                      return (
                        <motion.span
                          key={deg}
                          initial={{ x: 0, y: 0, scale: 1.3, rotate: 0, opacity: 1 }}
                          animate={{
                            x: Math.cos(r) * dist,
                            y: Math.sin(r) * dist + 14,
                            scale: [1.3, 0.9, 0.1],
                            rotate: deg + 220,
                            opacity: [1, 0.9, 0],
                          }}
                          transition={{ duration: 0.58, ease: 'easeOut' }}
                          style={{
                            backgroundColor:
                              rIdx % 3 === 0
                                ? b.color
                                : rIdx % 3 === 1
                                ? '#FACC15'
                                : '#38BDF8',
                          }}
                          className={`absolute ${
                            rIdx % 2 === 0
                              ? 'w-4 h-5 rounded-tl-full rounded-br-full'
                              : 'w-3 h-3 rounded-full'
                          } shadow-xs`}
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

      {/* 2. Main Spotlight Balloon 'Burst' Particle System (When Word / Sentence is Read Correctly or Balloon Pops!) */}
      <AnimatePresence>
        {(isCelebrating || tapPopPulse > 0) && (
          <motion.div
            key={`pop-explosion-${activeIndex}-${mainText}-${tapPopPulse}-${isCelebrating ? 'cel' : 'tap'}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-40"
          >
            {/* Flash Core */}
            <motion.div
              initial={{ scale: 0.25, opacity: 0.95 }}
              animate={{ scale: 2.35, opacity: 0 }}
              transition={{ duration: 0.44, ease: 'easeOut' }}
              className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-r from-white via-yellow-200 to-rose-400 blur-xl"
            />

            {/* Triple Concentric Shockwave Rings */}
            <motion.div
              initial={{ scale: 0.35, opacity: 1 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.68, ease: 'easeOut' }}
              style={{ borderColor: '#FF5E7E' }}
              className="absolute w-40 h-40 sm:w-52 sm:h-52 rounded-full border-8 shadow-[0_0_50px_rgba(255,94,126,0.85)]"
            />
            <motion.div
              initial={{ scale: 0.25, opacity: 1 }}
              animate={{ scale: 1.95, opacity: 0 }}
              transition={{ duration: 0.56, ease: 'easeOut', delay: 0.04 }}
              className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 border-amber-300 shadow-[0_0_80px_rgba(251,191,36,0.95)]"
            />
            <motion.div
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 2.7, opacity: 0 }}
              transition={{ duration: 0.74, ease: 'easeOut', delay: 0.08 }}
              className="absolute w-40 h-40 sm:w-52 sm:h-52 rounded-full border-2 border-sky-300"
            />

            {/* Radial High-Velocity Spark Streaks */}
            {BURST_SPARK_STREAKS.map((streak, sIdx) => {
              const rad = (streak.angle * Math.PI) / 180;
              return (
                <motion.div
                  key={`streak-${sIdx}`}
                  initial={{
                    x: Math.cos(rad) * 18,
                    y: Math.sin(rad) * 18,
                    scaleX: 0.2,
                    opacity: 1,
                    rotate: streak.angle,
                  }}
                  animate={{
                    x: Math.cos(rad) * 155,
                    y: Math.sin(rad) * 155,
                    scaleX: [0.3, 1.45, 0.1],
                    opacity: [1, 0.95, 0],
                    rotate: streak.angle,
                  }}
                  transition={{ duration: 0.52, ease: 'easeOut' }}
                  style={{ backgroundColor: streak.color }}
                  className="absolute w-8 h-1.5 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.9)]"
                />
              );
            })}

            {/* 20 Multi-Shape Burst Particles (Latex Shards, Ribbons, Glowing Orbs & Stars) with Gravity Arc */}
            {BURST_SHARDS.map((shard, idx) => {
              const rad = (shard.angle * Math.PI) / 180;
              return (
                <motion.div
                  key={idx}
                  initial={{ x: 0, y: 0, scale: 0.95, rotate: 0, opacity: 1 }}
                  animate={{
                    x: [
                      0,
                      Math.cos(rad) * (shard.dist * 0.72),
                      Math.cos(rad) * shard.dist,
                    ],
                    y: [
                      0,
                      Math.sin(rad) * (shard.dist * 0.72) - 10,
                      Math.sin(rad) * shard.dist + 32,
                    ],
                    scale: [1.35, 1.05, 0.12],
                    rotate: shard.angle + (idx % 2 === 0 ? 260 : -260),
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.84, ease: 'easeOut' }}
                  className="absolute flex items-center justify-center"
                >
                  <div
                    style={{ backgroundColor: shard.color || color || '#FF5E7E' }}
                    className={`${shard.size} ${
                      shard.kind === 'orb'
                        ? 'rounded-full shadow-[0_0_14px_rgba(255,255,255,0.9)]'
                        : shard.kind === 'ribbon'
                        ? 'rounded-full skew-x-12'
                        : 'rounded-tl-full rounded-br-full rounded-tr-md'
                    } shadow-md border border-white/60`}
                  />
                  <span className="text-lg sm:text-2xl -ml-2 drop-shadow">
                    {shard.emoji}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Spotlight Foreground 3D Target Balloon using the Exact Uploaded Balloon Variant PNG */}
      <motion.div
        key={`spotlight-${activeIndex}-${mainText}`}
        initial={{
          x: -140,
          y: -20,
          scale: 0.55,
          opacity: 0.7,
        }}
        animate={{
          x: isSwirling ? [-140, 60, 0] : 0,
          y: isSwirling
            ? [-20, 8, 0]
            : isCelebrating
            ? [0, -18, -28]
            : isSpeaking
            ? [0, -10, 0]
            : [0, -6, 0],
          scale: isSwirling
            ? [0.55, 0.88, 1]
            : isCelebrating
            ? [1, 1.38, 1.48, 0]
            : isSpeaking
            ? [1, 1.06, 1]
            : isListening
            ? [1, 1.03, 1]
            : 1,
          rotate: isCelebrating ? [0, -6, 8, 0] : 0,
          opacity: isCelebrating ? [1, 1, 1, 0] : 1,
        }}
        transition={{
          x: { duration: 0.35, ease: 'easeOut' },
          y: {
            duration: isCelebrating
              ? 0.28
              : isSwirling
              ? 0.35
              : isSpeaking
              ? 0.5
              : 2.4,
            repeat: isSwirling || isCelebrating ? 0 : Infinity,
            ease: 'easeInOut',
          },
          scale: {
            duration: isCelebrating
              ? 0.28
              : isSwirling
              ? 0.35
              : isSpeaking
              ? 0.5
              : 1.3,
            repeat:
              (isSpeaking || isListening) && !isCelebrating ? Infinity : 0,
            ease: isCelebrating ? 'easeOut' : 'easeInOut',
          },
          opacity: { duration: isCelebrating ? 0.28 : 0.2 },
        }}
        className="relative z-30 flex flex-col items-center pointer-events-none"
      >
        <button
          type="button"
          onClick={() => {
            triggerBalloonPopVibration(30);
            setTapPopPulse((p) => p + 1);
            setTimeout(() => setTapPopPulse(0), 650);
            onReplaySound();
          }}
          title="Tap balloon to pop / hear pronunciation"
          className={`group pointer-events-auto cursor-pointer focus:outline-none relative ${
            isFullSentence
              ? 'w-44 h-44 sm:w-68 sm:h-68 md:w-76 md:h-74'
              : isLongPhrase
              ? 'w-40 h-44 sm:w-60 sm:h-64 md:w-68 md:h-70'
              : 'w-36 h-42 sm:w-54 sm:h-62 md:w-64 md:h-68'
          } flex flex-col items-center justify-center text-center transition-transform duration-200 hover:scale-[1.03] active:scale-95 ${
            isCelebrating ? 'pointer-events-none' : ''
          }`}
        >
          {/* Active Microphone Circular Voice Progress Wave & Modulated Radial Equalizer around the Balloon */}
          <AnimatePresence>
            {isListening && !isCelebrating && (
              <motion.div
                key="voice-wave-aura"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute inset-0 -top-2 sm:-top-4 flex items-center justify-center z-0"
              >
                {/* Outer Expanding Voice-Modulated Ripple Ring */}
                <motion.div
                  animate={{
                    scale: [
                      1 + voiceRatio * 0.14,
                      1.16 + voiceRatio * 0.34,
                      1 + voiceRatio * 0.14,
                    ],
                    opacity: [
                      0.35 + voiceRatio * 0.45,
                      0.12 + voiceRatio * 0.25,
                      0.35 + voiceRatio * 0.45,
                    ],
                  }}
                  transition={{
                    duration: Math.max(0.55, 1.35 - voiceRatio * 0.65),
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    boxShadow: `0 0 ${Math.round(
                      24 + clampedVoice * 0.65
                    )}px rgba(255, 94, 126, ${0.35 + voiceRatio * 0.5})`,
                  }}
                  className="absolute w-38 h-38 sm:w-58 sm:h-58 md:w-66 md:h-66 rounded-full border-4 border-rose-400/75 bg-rose-500/10"
                />

                {/* Inner Voice-Modulated Glow Halo */}
                <div
                  style={{
                    transform: `scale(${(1 + voiceRatio * 0.22).toFixed(3)})`,
                    opacity: Math.min(1, 0.45 + voiceRatio * 0.55),
                  }}
                  className="absolute w-36 h-36 sm:w-54 sm:h-54 md:w-62 md:h-62 rounded-full border-2 border-amber-300/80 bg-gradient-to-tr from-rose-500/20 via-amber-300/20 to-sky-400/25 transition-all duration-75"
                />

                {/* Circular Progress Wave Ring + 24 Radial Sound Wave Bars */}
                <svg
                  viewBox="0 0 260 260"
                  className="w-42 h-42 sm:w-62 sm:h-62 md:w-70 md:h-70 overflow-visible drop-shadow-[0_0_14px_rgba(255,94,126,0.55)]"
                >
                  <defs>
                    <linearGradient
                      id="balloonVoiceWaveGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="50%" stopColor="#FACC15" />
                      <stop offset="100%" stopColor="#FF5E7E" />
                    </linearGradient>
                  </defs>

                  {/* Base Dashed Track Circle */}
                  <circle
                    cx="130"
                    cy="130"
                    r="106"
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="3.5"
                    strokeDasharray="6 6"
                  />

                  {/* Dynamic Voice-Level Progress Arc */}
                  <circle
                    cx="130"
                    cy="130"
                    r="106"
                    fill="none"
                    stroke="url(#balloonVoiceWaveGrad)"
                    strokeWidth={4 + voiceRatio * 4}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 106}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      106 *
                      (1 - Math.max(0.12, voiceRatio))
                    }
                    transform="rotate(-90 130 130)"
                    className="transition-all duration-75"
                  />

                  {/* 24 Radial Equalizer Bars Modulated by voiceLevel */}
                  {VOICE_WAVE_BAR_ANGLES.map((deg, idx) => {
                    const rad = (deg * Math.PI) / 180;
                    const waveFactor =
                      0.45 + 0.55 * Math.abs(Math.sin(idx * 0.85 + voiceRatio * 6));
                    const barLen = 6 + voiceRatio * 24 * waveFactor;
                    const innerR = 111;
                    const outerR = innerR + barLen;
                    const x1 = 130 + Math.cos(rad) * innerR;
                    const y1 = 130 + Math.sin(rad) * innerR;
                    const x2 = 130 + Math.cos(rad) * outerR;
                    const y2 = 130 + Math.sin(rad) * outerR;
                    return (
                      <line
                        key={deg}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={idx % 2 === 0 ? '#FDE047' : '#FF5E7E'}
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        opacity={0.55 + voiceRatio * 0.45}
                        className="transition-all duration-75"
                      />
                    );
                  })}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exact Uploaded 3D Glossy Pink-Coral-Orange Balloon PNG (with rubber neck & string loop!) */}
          <img
            src="/assets/aistudio/balloon_variant.png"
            alt="3D Learning Balloon"
            referrerPolicy="no-referrer"
            style={{
              filter: `hue-rotate(${spotlightHue}deg) saturate(1.08) drop-shadow(0 20px 34px rgba(15,23,42,0.34))`,
            }}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Replay Speaker Badge in Upper-Right of the Balloon Sphere */}
          <div
            className={`absolute top-3 right-5 sm:top-6 sm:right-9 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white shadow-[0_6px_14px_rgba(0,0,0,0.22),inset_0_2px_4px_rgba(255,255,255,0.75)] transition-all ${
              isSpeaking
                ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 scale-110 ring-4 ring-white/70'
                : 'bg-white/30 backdrop-blur-xs group-hover:bg-white/45'
            }`}
          >
            <Volume2
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                isSpeaking ? 'animate-bounce' : ''
              }`}
            />
          </div>

          {/* Content Overlay centered in the upper-middle sphere of the 3D balloon */}
          <div
            className={`relative z-10 -mt-6 sm:-mt-11 flex flex-col items-center justify-center overflow-hidden ${
              isFullSentence
                ? 'w-[80%] sm:w-[78%] max-w-[165px] sm:max-w-[238px] max-h-[115px] sm:max-h-[168px] bg-black/26 backdrop-blur-[2px] rounded-2xl py-1.5 sm:py-2 px-2 sm:px-3 border border-white/35 shadow-[inset_0_2px_6px_rgba(255,255,255,0.45)]'
                : 'w-[80%] max-w-[165px] sm:max-w-[210px] px-2 sm:px-3'
            }`}
          >
            {/* Optional Word / Conversation Emoji Icon */}
            {icon && (
              <div
                className={`${
                  isFullSentence
                    ? 'text-sm sm:text-xl mb-0.5 leading-none shrink-0'
                    : 'text-xl sm:text-4xl mb-0.5 leading-none shrink-0'
                } drop-shadow-[0_4px_8px_rgba(0,0,0,0.28)]`}
              >
                {icon}
              </div>
            )}

            {/* Primary Alphabet Letter, Word, or Conversation Phrase */}
            <div
              dir={rtl ? 'rtl' : 'ltr'}
              className={`w-full max-w-full overflow-hidden break-words font-display font-extrabold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.42)] ${
                isFullSentence
                  ? 'text-[10px] sm:text-xs md:text-sm leading-snug line-clamp-2'
                  : isLongPhrase
                  ? 'text-xs sm:text-base md:text-lg leading-snug line-clamp-2'
                  : isMediumWord || icon
                  ? 'text-base sm:text-3xl md:text-4xl leading-tight tracking-tight truncate'
                  : 'text-3xl sm:text-7xl md:text-8xl leading-none'
              }`}
            >
              {mainText}
            </div>

            {/* Phonetic or Pronunciation Guide */}
            {subText && (
              <div className="mt-0.5 sm:mt-1 text-[9px] sm:text-[11px] font-extrabold text-white drop-shadow-xs bg-black/30 border border-white/30 px-1.5 sm:px-2 py-0.5 rounded-full w-auto max-w-full truncate shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
                {subText}
              </div>
            )}

            {/* Native Translation Meaning */}
            {meaningText && (
              <div className="mt-0.5 text-[9px] sm:text-[11px] font-bold text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] w-full max-w-full truncate shrink-0">
                {meaningText}
              </div>
            )}
          </div>
        </button>

        {/* 3D Ground Perspective Shadow underneath the balloon string loop */}
        <div className="w-16 h-2.5 rounded-full bg-slate-950/22 blur-md -mt-1 pointer-events-none" />
      </motion.div>
    </div>
  );
}
