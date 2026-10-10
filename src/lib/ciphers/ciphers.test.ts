import { describe, expect, it } from "vitest";
import {
  decodeAsciiDecimal,
  decodeBase64,
  decodeBinary,
  decodeCaesar,
  decodeHex,
  decodeMorse,
  decodeRot13,
  decodeUrlPercent,
  encodeAsciiDecimal,
  encodeBase64,
  encodeBinary,
  encodeCaesar,
  encodeHex,
  encodeMorse,
  encodeRot13,
  encodeUrlPercent,
} from "./ciphers";

describe("Cipher Puzzle Algorithms", () => {
  it("encodes and decodes Morse code accurately", () => {
    const original = "SHELL SHIFT 2026";
    const encoded = encodeMorse(original);
    const decoded = decodeMorse(encoded);
    expect(decoded).toBe(original);
  });

  it("encodes and decodes Binary UTF-8 correctly", () => {
    const original = "TARGET REACHED";
    const encoded = encodeBinary(original);
    const decoded = decodeBinary(encoded);
    expect(decoded).toBe(original);
  });

  it("encodes and decodes Hexadecimal UTF-8 correctly", () => {
    const original = "ROOT_ACCESS_GRANTED";
    const encoded = encodeHex(original);
    const decoded = decodeHex(encoded);
    expect(decoded).toBe(original);
  });

  it("encodes and decodes Base64 reliably", () => {
    const original = "FLAG{MATRIX_CORRUPTED}";
    const encoded = encodeBase64(original);
    const decoded = decodeBase64(encoded);
    expect(decoded).toBe(original);
  });

  it("encodes and decodes ROT13 and Caesar shifts", () => {
    const original = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
    const rot13 = encodeRot13(original);
    expect(decodeRot13(rot13)).toBe(original);

    const shift7 = encodeCaesar(original, 7);
    expect(decodeCaesar(shift7, 7)).toBe(original);
  });

  it("encodes and decodes ASCII Decimal codes", () => {
    const original = "SYSADMIN TOKEN";
    const encoded = encodeAsciiDecimal(original);
    const decoded = decodeAsciiDecimal(encoded);
    expect(decoded).toBe(original);
  });

  it("encodes and decodes URL Percent encoding", () => {
    const original = "token=xyz&user=operator/alpha";
    const encoded = encodeUrlPercent(original);
    const decoded = decodeUrlPercent(encoded);
    expect(decoded).toBe(original);
  });
});
