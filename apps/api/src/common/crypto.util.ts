import * as crypto from "crypto";

const ENCRYPTION_KEY = process.env.OTP_SECRET || "peopleos-local-otp-secret-key-long-enough-32-chars!!!";
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  try {
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const textParts = text.split(":");
    const ivHex = textParts.shift();
    if (!ivHex) return "";
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return text;
  }
}

// Show only the last 4 digits, e.g. "************4321".
export function maskAccountNumber(encrypted: string | null | undefined): string {
  if (!encrypted) return "";
  const plain = decrypt(encrypted);
  if (!plain) return "";
  return plain.length <= 4 ? "****" : "*".repeat(plain.length - 4) + plain.slice(-4);
}

// Strip the raw ciphertext from a bank-detail record and attach a masked number.
export function sanitizeBankDetail<T extends { accountNumberEncrypted?: string | null }>(bank: T | null) {
  if (!bank) return bank;
  const { accountNumberEncrypted, ...rest } = bank;
  return { ...rest, accountNumberMasked: maskAccountNumber(accountNumberEncrypted) };
}
