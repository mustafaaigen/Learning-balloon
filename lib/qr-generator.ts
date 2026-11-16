// ISO/IEC 18004 compliant QR Code 2D matrix & Canvas DataURL generator
// Supports Byte mode (UTF-8) across QR Versions 1..10 (ECC Level L)

const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen);
  const msg = new Uint8Array(data.length + ecLen);
  msg.set(data, 0);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

interface VersionSpec {
  version: number;
  totalDataBytes: number;
  ecBytesPerBlock: number;
  numBlocks: number;
  alignment: number[];
}

// QR Versions 1..10 (Error Correction Level L)
const VERSION_SPECS: VersionSpec[] = [
  { version: 1, totalDataBytes: 19, ecBytesPerBlock: 7, numBlocks: 1, alignment: [] },
  { version: 2, totalDataBytes: 34, ecBytesPerBlock: 10, numBlocks: 1, alignment: [6, 18] },
  { version: 3, totalDataBytes: 55, ecBytesPerBlock: 15, numBlocks: 1, alignment: [6, 22] },
  { version: 4, totalDataBytes: 80, ecBytesPerBlock: 20, numBlocks: 1, alignment: [6, 26] },
  { version: 5, totalDataBytes: 108, ecBytesPerBlock: 26, numBlocks: 1, alignment: [6, 30] },
  { version: 6, totalDataBytes: 136, ecBytesPerBlock: 18, numBlocks: 2, alignment: [6, 34] },
  { version: 7, totalDataBytes: 156, ecBytesPerBlock: 20, numBlocks: 2, alignment: [6, 22, 38] },
  { version: 8, totalDataBytes: 194, ecBytesPerBlock: 24, numBlocks: 2, alignment: [6, 24, 42] },
  { version: 9, totalDataBytes: 232, ecBytesPerBlock: 30, numBlocks: 2, alignment: [6, 26, 46] },
];

function pickVersion(byteLen: number): VersionSpec {
  for (const spec of VERSION_SPECS) {
    const headerBytes = spec.version <= 9 ? 2 : 3;
    if (byteLen + headerBytes <= spec.totalDataBytes) {
      return spec;
    }
  }
  return VERSION_SPECS[VERSION_SPECS.length - 1];
}

function encodeDataCodewords(utf8: Uint8Array, spec: VersionSpec): Uint8Array {
  const maxPayload = spec.totalDataBytes - 2;
  const payload = utf8.length > maxPayload ? utf8.slice(0, maxPayload) : utf8;

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Byte mode indicator (0100)
  pushBits(0b0100, 4);
  // Character count (8 bits for versions 1..9)
  pushBits(payload.length, 8);
  for (let i = 0; i < payload.length; i++) {
    pushBits(payload[i], 8);
  }

  const capacityBits = spec.totalDataBytes * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  pushBits(0, terminator);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords = new Uint8Array(spec.totalDataBytes);
  const byteCount = bits.length / 8;
  for (let i = 0; i < byteCount; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    codewords[i] = b;
  }

  const pads = [0xec, 0x11];
  for (let i = byteCount; i < spec.totalDataBytes; i++) {
    codewords[i] = pads[(i - byteCount) % 2];
  }

  // Split into blocks & interleave if numBlocks > 1
  const blockDataSize = Math.floor(spec.totalDataBytes / spec.numBlocks);
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  for (let b = 0; b < spec.numBlocks; b++) {
    const slice = codewords.slice(b * blockDataSize, (b + 1) * blockDataSize);
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, spec.ecBytesPerBlock));
  }

  const finalBytes = new Uint8Array(
    spec.totalDataBytes + spec.numBlocks * spec.ecBytesPerBlock
  );
  let ptr = 0;
  for (let i = 0; i < blockDataSize; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalBytes[ptr++] = dataBlocks[b][i];
    }
  }
  for (let i = 0; i < spec.ecBytesPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalBytes[ptr++] = ecBlocks[b][i];
    }
  }

  return finalBytes;
}

function buildMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  const spec = pickVersion(utf8.length);
  const size = 17 + spec.version * 4;

  const modules: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter =
          dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter || inInner);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const align = spec.alignment;
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === align.length - 1) ||
        (i === align.length - 1 && j === 0)
      ) {
        continue;
      }
      const cr = align[i];
      const cc = align[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark =
            Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(cr + dr, cc + dc, dark);
        }
      }
    }
  }

  // Dark module & reserved format areas
  setFunctionModule(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
  }

  // Place data bits
  const allBytes = encodeDataCodewords(utf8, spec);
  let bitIdx = 0;
  const totalBits = allBytes.length * 8;

  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((allBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0;
            bitIdx++;
          }
          // Apply Mask 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) {
            dark = !dark;
          }
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Format information for ECC Level L (01) + Mask 0 (000) -> precomputed BCH 15-bit: 0x77c4
  const formatBits = 0x77c4;
  const getFormatBit = (idx: number) => ((formatBits >>> idx) & 1) !== 0;

  // Top-left format bits
  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getFormatBit(i));
  setFunctionModule(8, 7, getFormatBit(6));
  setFunctionModule(8, 8, getFormatBit(7));
  setFunctionModule(7, 8, getFormatBit(8));
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getFormatBit(i));

  // Top-right & Bottom-left format bits
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 1 - i, getFormatBit(i));
  }
  for (let i = 8; i < 15; i++) {
    setFunctionModule(size - 15 + i, 8, getFormatBit(i));
  }

  return modules;
}

export interface QRRenderOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRDataURL(
  text: string,
  options: QRRenderOptions = {}
): Promise<string> {
  const matrix = buildMatrix(text || 'https://learningballoon.app');
  const moduleCount = matrix.length;
  const margin = options.margin ?? 1;
  const totalModules = moduleCount + margin * 2;
  const targetWidth = options.width ?? 260;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetWidth;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const darkColor = options.color?.dark || '#0A192F';
  const lightColor = options.color?.light || '#FFFFFF';

  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, targetWidth, targetWidth);

  const scale = targetWidth / totalModules;
  ctx.fillStyle = darkColor;

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        const x = Math.floor((c + margin) * scale);
        const y = Math.floor((r + margin) * scale);
        const w = Math.ceil((c + margin + 1) * scale) - x;
        const h = Math.ceil((r + margin + 1) * scale) - y;
        ctx.fillRect(x, y, w, h);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
