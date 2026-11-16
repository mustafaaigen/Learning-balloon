'use client';

let audioCtx: AudioContext | null = null;
const decodedBufferCache = new Map<string, AudioBuffer>();
const rawBase64Cache = new Map<string, { base64: string; mimeType: string }>();
const inflightPreloads = new Map<
  string,
  Promise<{ base64: string; mimeType: string } | null>
>();

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

const trimmedWavUrlCache = new Map<string, string>();

// Convert a silence-trimmed AudioBuffer into a fast in-memory WAV Blob URL
// so HTML5 Audio can play it with preservesPitch=true and ZERO leading/trailing MP3 dead-air!
function audioBufferToWavUrl(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// Trim pure digital dead-air from MP3 edges so speech starts & finishes fast without lag
function trimSilenceFromBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer
): AudioBuffer {
  try {
    const channelData = buffer.getChannelData(0);
    const len = channelData.length;
    const sampleRate = buffer.sampleRate;
    const threshold = 0.0012;

    let startSample = 0;
    while (
      startSample < len &&
      Math.abs(channelData[startSample]) < threshold
    ) {
      startSample++;
    }

    let endSample = len - 1;
    while (
      endSample > startSample &&
      Math.abs(channelData[endSample]) < threshold
    ) {
      endSample--;
    }

    // Generous 85ms lead-in and 110ms tail so initial consonants (like چ Che, پ Pe, ت Te) are 100% intact
    const padStart = Math.floor(sampleRate * 0.085);
    const padEnd = Math.floor(sampleRate * 0.11);
    startSample = Math.max(0, startSample - padStart);
    endSample = Math.min(len - 1, endSample + padEnd);

    const trimmedLength = endSample - startSample + 1;
    if (trimmedLength <= 0 || trimmedLength >= len * 0.96) {
      return buffer;
    }

    const trimmedBuffer = ctx.createBuffer(
      buffer.numberOfChannels,
      trimmedLength,
      sampleRate
    );

    // Clean linear peak normalization without nonlinear tanh distortion
    let maxPeak = 0.01;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      for (let i = startSample; i <= endSample; i++) {
        const abs = Math.abs(src[i]);
        if (abs > maxPeak) maxPeak = abs;
      }
    }
    const targetGain = Math.min(2.0, 0.92 / maxPeak);

    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = trimmedBuffer.getChannelData(ch);
      for (let i = 0; i < trimmedLength; i++) {
        dst[i] = Math.max(-0.98, Math.min(0.98, src[startSample + i] * targetGain));
      }
    }
    return trimmedBuffer;
  } catch {
    return buffer;
  }
}

// Trigger a short, tactile mobile vibration via the Web Vibration API whenever a balloon is popped
export function triggerBalloonPopVibration(
  pattern: number | number[] = [45, 25, 65]
) {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

// Fun, realistic 3D Balloon POP sound effect (rubber snap + air burst + sparkle)
export function playBalloonPopSound() {
  triggerBalloonPopVibration([45, 25, 65]);
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Sharp rubber pop impulse (white noise burst through bandpass filter)
  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.085);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2.2);
      output[i] = (Math.random() * 2 - 1) * env;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(980, now);
    filter.Q.setValueAtTime(1.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + 0.085);
  } catch {}

  // 2. Resonant air-pop pitch drop (classic cartoon balloon pop thump)
  const popOsc = ctx.createOscillator();
  const popGain = ctx.createGain();
  popOsc.type = 'sine';
  popOsc.frequency.setValueAtTime(540, now);
  popOsc.frequency.exponentialRampToValueAtTime(95, now + 0.09);

  popGain.gain.setValueAtTime(0.35, now);
  popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

  popOsc.connect(popGain);
  popGain.connect(ctx.destination);
  popOsc.start(now);
  popOsc.stop(now + 0.1);

  // 3. Cheerful mini sparkle pop chime
  const chimeFreqs = [783.99, 1046.5];
  chimeFreqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const t = now + 0.04 + idx * 0.045;
    osc.frequency.setValueAtTime(f, t);
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  });
}

export function playBalloonSwirlSound() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [392, 493.88, 587.33, 659.25];
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const t = now + i * 0.045;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.12, t + 0.09);

    gain.gain.setValueAtTime(0.008, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}

export function playBalloonFloatSound() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';

  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

export function playMicStartChime() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.01, now + idx * 0.06);
    gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.06 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.13);
  });
}

export function playStarRewardFanfare() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const startTime = now + idx * 0.065;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}

export function playGentleRetryTone() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [440, 370];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const startTime = now + idx * 0.09;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.11, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.2);
  });
}

export type StudioVoicePersona = 'Giusy' | 'Zephyr' | 'Kore';

export const GIUSY_VOICE_PREVIEW_URL =
  '/assets/aistudio/voice_preview_giusy_-_sales_and_customer_support_415a393a.mp3';

let currentStudioVoice: StudioVoicePersona = 'Giusy';
const customVoiceDataUrlMap = new Map<string, string>();

export function getStudioVoicePersona(): StudioVoicePersona {
  currentStudioVoice = 'Giusy';
  return 'Giusy';
}

export function setStudioVoicePersona(_voice: StudioVoicePersona): void {
  currentStudioVoice = 'Giusy';
}

export async function playGiusyOriginalSample(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio(GIUSY_VOICE_PREVIEW_URL);
    await audio.play();
  } catch {}
}

export function registerCustomVoiceClip(key: string, dataUrl: string): void {
  customVoiceDataUrlMap.set(key.trim().toLowerCase(), dataUrl);
}

async function fetchAndCacheRawTTS(
  text: string,
  bcp47: string,
  languageName: string
): Promise<{ base64: string; mimeType: string } | null> {
  const cleanText = String(text)
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
  const voiceName = getStudioVoicePersona();
  const cacheKey = `v14:${voiceName}:${bcp47}:${cleanText}`;
  const existing = rawBase64Cache.get(cacheKey);
  if (existing) return existing;

  const inflight = inflightPreloads.get(cacheKey);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          langCode: bcp47,
          languageName,
          voiceName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const item = {
            base64: data.audioBase64 as string,
            mimeType: (data.mimeType as string) || 'audio/wav',
          };
          rawBase64Cache.set(cacheKey, item);

          // Pre-decode into AudioBuffer & trimmed WAV Blob URL if AudioContext is ready
          const ctx = getSharedAudioContext();
          if (ctx && !decodedBufferCache.has(cacheKey)) {
            try {
              const binaryString = window.atob(item.base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const rawBuf = await ctx.decodeAudioData(bytes.buffer.slice(0));
              const trimmed = trimSilenceFromBuffer(ctx, rawBuf);
              decodedBufferCache.set(cacheKey, trimmed);
              trimmedWavUrlCache.set(cacheKey, audioBufferToWavUrl(trimmed));
            } catch {}
          }
          return item;
        }
      }
    } catch {}
    return null;
  })();

  inflightPreloads.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inflightPreloads.delete(cacheKey);
  }
}

// Preload TTS audio ahead of time so playback starts cleanly without network lag
export function preloadPronounceText(
  text: string,
  bcp47: string,
  languageName: string
): void {
  if (typeof window === 'undefined' || !text) return;
  fetchAndCacheRawTTS(text, bcp47, languageName).catch(() => {});
}

let studioPlaybackSpeed: 1.0 | 0.78 = 1.0;

export function getAudioPlaybackSpeed(): 1.0 | 0.78 {
  return studioPlaybackSpeed;
}

export function setAudioPlaybackSpeed(speed: 1.0 | 0.78): void {
  studioPlaybackSpeed = speed;
}

async function playCachedOrRawBuffer(
  cacheKey: string,
  base64: string,
  mimeType: string,
  rateOverride?: number
): Promise<boolean> {
  const targetRate = rateOverride ?? studioPlaybackSpeed;

  // Ensure decoded buffer and silence-trimmed WAV URL are ready
  try {
    const ctx = getSharedAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (!decodedBufferCache.has(cacheKey)) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoded = await ctx.decodeAudioData(bytes.buffer.slice(0));
        const trimmed = trimSilenceFromBuffer(ctx, decoded);
        decodedBufferCache.set(cacheKey, trimmed);
        if (!trimmedWavUrlCache.has(cacheKey)) {
          trimmedWavUrlCache.set(cacheKey, audioBufferToWavUrl(trimmed));
        }
      }
    }
  } catch {}

  // When playing in Slow Clear mode (< 0.99), use HTML5 Audio with preservesPitch=true first
  // so time-stretching NEVER lowers or distorts vocal formants!
  if (targetRate < 0.99) {
    const wavUrl = trimmedWavUrlCache.get(cacheKey);
    try {
      const audio = new Audio(wavUrl || `data:${mimeType};base64,${base64}`);
      audio.volume = 1.0;
      if ('preservesPitch' in audio) {
        (audio as any).preservesPitch = true;
      }
      if ('mozPreservesPitch' in audio) {
        (audio as any).mozPreservesPitch = true;
      }
      if ('webkitPreservesPitch' in audio) {
        (audio as any).webkitPreservesPitch = true;
      }
      audio.playbackRate = targetRate;

      const trimmedBuf = decodedBufferCache.get(cacheKey);
      const maxWaitMs = trimmedBuf
        ? Math.min(
            14000,
            Math.ceil((trimmedBuf.duration / targetRate) * 1000) + 250
          )
        : 11000;

      await audio.play();
      await new Promise<void>((res) => {
        const timer = setTimeout(res, maxWaitMs);
        audio.onended = () => {
          clearTimeout(timer);
          res();
        };
        audio.onerror = () => {
          clearTimeout(timer);
          res();
        };
      });
      return true;
    } catch {}
  }

  // 1. Primary for 1.0x Normal Speed: Clean Natural Web Audio Playback (100% unshifted native pitch & zero clipping)
  try {
    const ctx = getSharedAudioContext();
    const audioBuffer = decodedBufferCache.get(cacheKey);
    if (ctx && audioBuffer) {
      return await new Promise<boolean>((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 1.0;

        const masterSpeakerGain = ctx.createGain();
        masterSpeakerGain.gain.setValueAtTime(1.0, ctx.currentTime);

        source.connect(masterSpeakerGain);
        masterSpeakerGain.connect(ctx.destination);

        const maxMs = Math.min(
          12000,
          Math.ceil(audioBuffer.duration * 1000) + 200
        );
        const timeout = setTimeout(() => resolve(true), maxMs);
        source.onended = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        source.start(0);
      });
    }
  } catch {}

  // 2. Fallback: HTML5 Audio with silence-trimmed WAV
  const wavUrl = trimmedWavUrlCache.get(cacheKey);
  try {
    const audio = new Audio(wavUrl || `data:${mimeType};base64,${base64}`);
    audio.volume = 1.0;
    if ('preservesPitch' in audio) {
      (audio as any).preservesPitch = true;
    }
    audio.playbackRate = targetRate;

    const trimmedBuf = decodedBufferCache.get(cacheKey);
    const maxWaitMs = trimmedBuf
      ? Math.min(
          12000,
          Math.ceil((trimmedBuf.duration / targetRate) * 1000) + 200
        )
      : 10000;

    await audio.play();
    await new Promise<void>((res) => {
      const timer = setTimeout(res, maxWaitMs);
      audio.onended = () => {
        clearTimeout(timer);
        res();
      };
      audio.onerror = () => {
        clearTimeout(timer);
        res();
      };
    });
    return true;
  } catch {}

  return false;
}

function speakWithBrowserTTS(
  text: string,
  bcp47: string,
  rateOverride?: number
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = bcp47.split('-')[0].toLowerCase();

      const langVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase() === bcp47.toLowerCase() ||
          v.lang.toLowerCase().startsWith(langPrefix)
      );

      const femalePattern =
        /female|woman|girl|giusy|elsa|alice|federica|uzma|gul|swara|kalpana|heera|veena|zira|samantha|victoria|karen|moira|tessa|amelie|anna|paulina|monica|luciana|kyoko|mei-jia|ting-ting|sin-ji|yuna|damayanti|lekha|alva|klara|nora|sara|zuzana|yelda|milena|laura|ellen|google/i;

      const matchingVoice =
        langVoices.find((v) => femalePattern.test(v.name)) || langVoices[0];

      const cleanText = String(text)
        .replace(/\s*\([^)]*\)/g, '')
        .trim();

      const targetRate = rateOverride ?? studioPlaybackSpeed;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = matchingVoice ? matchingVoice.lang : bcp47;
      utterance.rate = targetRate < 0.99 ? 0.78 : 0.96;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      const timeout = setTimeout(() => {
        resolve();
      }, 8500);

      utterance.onend = () => {
        clearTimeout(timeout);
        resolve();
      };
      utterance.onerror = () => {
        clearTimeout(timeout);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export async function pronounceText(
  text: string,
  bcp47: string,
  languageName: string,
  _phoneticFallback?: string,
  rateOverride?: number
): Promise<void> {
  if (typeof window === 'undefined') return;

  const cleanText = String(text)
    .replace(/\s*\([^)]*\)/g, '')
    .trim();

  const customClip =
    customVoiceDataUrlMap.get(cleanText.toLowerCase()) ||
    customVoiceDataUrlMap.get('__global_custom_voice__');
  if (customClip) {
    try {
      const audio = new Audio(customClip);
      await audio.play();
      await new Promise<void>((res) => {
        const t = setTimeout(res, 4500);
        audio.onended = () => {
          clearTimeout(t);
          res();
        };
        audio.onerror = () => {
          clearTimeout(t);
          res();
        };
      });
      return;
    } catch {}
  }

  const voiceName = getStudioVoicePersona();
  const cacheKey = `v14:${voiceName}:${bcp47}:${cleanText}`;

  // 1. If already cached in RAM, play with natural unshifted studio audio
  const cachedRaw = rawBase64Cache.get(cacheKey);
  if (cachedRaw) {
    const played = await playCachedOrRawBuffer(
      cacheKey,
      cachedRaw.base64,
      cachedRaw.mimeType,
      rateOverride
    );
    if (played) return;
  }

  // 2. Fetch (or await in-flight preload) and play
  const fetched = await fetchAndCacheRawTTS(cleanText, bcp47, languageName);
  if (fetched) {
    const played = await playCachedOrRawBuffer(
      cacheKey,
      fetched.base64,
      fetched.mimeType,
      rateOverride
    );
    if (played) return;
  }

  // 3. Browser speechSynthesis fallback in native bcp47
  await speakWithBrowserTTS(cleanText, bcp47, rateOverride);
}
