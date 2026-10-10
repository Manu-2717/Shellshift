// Supported cipher and encoding types with accurate technical descriptions
export type CipherType =
  | "morse"
  | "binary"
  | "hex"
  | "base64"
  | "rot13"
  | "caesar"
  | "ascii_decimal"
  | "url_percent";

export interface CipherMetadata {
  type: CipherType;
  name: string;
  category: "Encoding" | "Cipher" | "Representation";
  description: string;
}

export const CIPHER_METADATA: Record<CipherType, CipherMetadata> = {
  morse: {
    type: "morse",
    name: "Morse Code",
    category: "Encoding",
    description: "Auditory/telecom character encoding using standardized sequences of dots and dashes.",
  },
  binary: {
    type: "binary",
    name: "Binary UTF-8",
    category: "Representation",
    description: "Base-2 numeric byte representation of UTF-8 encoded characters.",
  },
  hex: {
    type: "hex",
    name: "Hexadecimal UTF-8",
    category: "Representation",
    description: "Base-16 radix byte representation of UTF-8 encoded characters.",
  },
  base64: {
    type: "base64",
    name: "Base64 Encoding",
    category: "Encoding",
    description: "Binary-to-text radix-64 encoding scheme designed for ASCII transmission.",
  },
  rot13: {
    type: "rot13",
    name: "ROT13 Substitution",
    category: "Cipher",
    description: "Symmetric Caesar substitution cipher with a fixed rotational offset of 13.",
  },
  caesar: {
    type: "caesar",
    name: "Caesar Shift",
    category: "Cipher",
    description: "Monoalphabetic substitution cipher shifting alphabet positions by a configurable key.",
  },
  ascii_decimal: {
    type: "ascii_decimal",
    name: "ASCII Decimal Codes",
    category: "Representation",
    description: "Base-10 integer byte values corresponding to standard ASCII/UTF-8 character codes.",
  },
  url_percent: {
    type: "url_percent",
    name: "URL Percent-Encoding",
    category: "Encoding",
    description: "URI percent-encoding standard (%XX) for reserved and non-ASCII character sequences.",
  },
};

const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...",
  "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.", "-": "-....-", "_": "..--.-", "\"": ".-..-.",
  "$": "...-..-", "@": ".--.-.", " ": "/",
};

const REVERSE_MORSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [char, morse]) => {
    acc[morse] = char;
    return acc;
  },
  {} as Record<string, string>
);

export function encodeMorse(text: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((char) => MORSE_MAP[char] || char)
    .join(" ");
}

export function decodeMorse(morse: string): string {
  return morse
    .trim()
    .split(/\s+/)
    .map((token) => {
      if (token === "/") return " ";
      return REVERSE_MORSE_MAP[token] || token;
    })
    .join("");
}

export function encodeBinary(text: string): string {
  const bytes = Buffer.from(text, "utf-8");
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, "0"))
    .join(" ");
}

export function decodeBinary(binaryStr: string): string {
  const tokens = binaryStr.trim().split(/\s+/).filter(Boolean);
  const bytes = tokens.map((t) => parseInt(t, 2));
  return Buffer.from(bytes).toString("utf-8");
}

export function encodeHex(text: string): string {
  return Buffer.from(text, "utf-8").toString("hex");
}

export function decodeHex(hexStr: string): string {
  const clean = hexStr.replace(/\s+/g, "");
  return Buffer.from(clean, "hex").toString("utf-8");
}

export function encodeBase64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

export function decodeBase64(base64Str: string): string {
  return Buffer.from(base64Str.trim(), "base64").toString("utf-8");
}

export function encodeCaesar(text: string, shift: number = 13): string {
  const normShift = ((shift % 26) + 26) % 26;
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      // Uppercase A-Z (65-90)
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + normShift) % 26) + 65);
      }
      // Lowercase a-z (97-122)
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + normShift) % 26) + 97);
      }
      return char;
    })
    .join("");
}

export function decodeCaesar(text: string, shift: number = 13): string {
  return encodeCaesar(text, 26 - (((shift % 26) + 26) % 26));
}

export function encodeRot13(text: string): string {
  return encodeCaesar(text, 13);
}

export function decodeRot13(text: string): string {
  return encodeCaesar(text, 13);
}

export function encodeAsciiDecimal(text: string): string {
  return Buffer.from(text, "utf-8")
    .map((b) => b)
    .join(" ");
}

export function decodeAsciiDecimal(decStr: string): string {
  const tokens = decStr.trim().split(/\s+/).filter(Boolean);
  const bytes = tokens.map((t) => parseInt(t, 10));
  return Buffer.from(bytes).toString("utf-8");
}

export function encodeUrlPercent(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrlPercent(encodedStr: string): string {
  try {
    return decodeURIComponent(encodedStr);
  } catch {
    return encodedStr;
  }
}

/**
 * Universal decoder for puzzle scratchpad
 */
export function decodeCipher(type: CipherType, encoded: string, shift: number = 13): string {
  try {
    switch (type) {
      case "morse":
        return decodeMorse(encoded);
      case "binary":
        return decodeBinary(encoded);
      case "hex":
        return decodeHex(encoded);
      case "base64":
        return decodeBase64(encoded);
      case "rot13":
        return decodeRot13(encoded);
      case "caesar":
        return decodeCaesar(encoded, shift);
      case "ascii_decimal":
        return decodeAsciiDecimal(encoded);
      case "url_percent":
        return decodeUrlPercent(encoded);
      default:
        return encoded;
    }
  } catch (err) {
    return `[Decode error: ${(err as Error).message}]`;
  }
}
