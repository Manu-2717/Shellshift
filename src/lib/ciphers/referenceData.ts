/**
 * Static Cipher & Encoding Reference Handbook
 * Purely educational static data for manual investigation — NOT an automated decoder.
 */

export interface MorseEntry {
  char: string;
  morse: string;
}

export const MORSE_ALPHABET: MorseEntry[] = [
  { char: "A", morse: ".-" },
  { char: "B", morse: "-..." },
  { char: "C", morse: "-.-." },
  { char: "D", morse: "-.." },
  { char: "E", morse: "." },
  { char: "F", morse: "..-." },
  { char: "G", morse: "--." },
  { char: "H", morse: "...." },
  { char: "I", morse: ".." },
  { char: "J", morse: ".---" },
  { char: "K", morse: "-.-" },
  { char: "L", morse: ".-.." },
  { char: "M", morse: "--" },
  { char: "N", morse: "-." },
  { char: "O", morse: "---" },
  { char: "P", morse: ".--." },
  { char: "Q", morse: "--.-" },
  { char: "R", morse: ".-." },
  { char: "S", morse: "..." },
  { char: "T", morse: "-" },
  { char: "U", morse: "..-" },
  { char: "V", morse: "...-" },
  { char: "W", morse: ".--" },
  { char: "X", morse: "-..-" },
  { char: "Y", morse: "-.--" },
  { char: "Z", morse: "--.." },
];

export const MORSE_DIGITS: MorseEntry[] = [
  { char: "0", morse: "-----" },
  { char: "1", morse: ".----" },
  { char: "2", morse: "..---" },
  { char: "3", morse: "...--" },
  { char: "4", morse: "....-" },
  { char: "5", morse: "....." },
  { char: "6", morse: "-...." },
  { char: "7", morse: "--..." },
  { char: "8", morse: "---.." },
  { char: "9", morse: "----." },
];

export const ROT13_PAIRS = [
  ["A", "N"], ["B", "O"], ["C", "P"], ["D", "Q"],
  ["E", "R"], ["F", "S"], ["G", "T"], ["H", "U"],
  ["I", "V"], ["J", "W"], ["K", "X"], ["L", "Y"],
  ["M", "Z"],
];

export const ASCII_HEX_SAMPLES = [
  { char: "Space", hex: "0x20", dec: "32", bin: "00100000" },
  { char: "/", hex: "0x2F", dec: "47", bin: "00101111" },
  { char: "0 - 9", hex: "0x30 - 0x39", dec: "48 - 57", bin: "00110000 - 00111001" },
  { char: "A - Z", hex: "0x41 - 0x5A", dec: "65 - 90", bin: "01000001 - 01011010" },
  { char: "a - z", hex: "0x61 - 0x7A", dec: "97 - 122", bin: "01100001 - 01111010" },
  { char: "_ (underscore)", hex: "0x5F", dec: "95", bin: "01011111" },
  { char: "- (hyphen)", hex: "0x2D", dec: "45", bin: "00101101" },
  { char: ". (dot)", hex: "0x2E", dec: "46", bin: "00101110" },
];

export const URL_ENCODING_COMMON = [
  { char: "Space", encoded: "%20" },
  { char: "/", encoded: "%2F" },
  { char: ":", encoded: "%3A" },
  { char: ".", encoded: "%2E" },
  { char: "-", encoded: "%2D" },
  { char: "_", encoded: "%5F" },
  { char: "~", encoded: "%7E" },
  { char: "=", encoded: "%3D" },
];

export const BASE64_ALPHABET_SUMMARY = {
  indices: "0-25: 'A'-'Z' | 26-51: 'a'-'z' | 52-61: '0'-'9' | 62: '+' | 63: '/'",
  padding: "'=' denotes 6-bit padding for incomplete 24-bit quantum blocks",
  ratio: "4 Base64 characters represent 3 decoded bytes (24 bits)",
};
