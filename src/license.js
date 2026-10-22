// Deliberately public demo secret. This is a payment-flow stub, not secure enforcement.
export const DEMO_SECRET =
  "f6063766ee96a55bae61fbf6b546b73a0f92e0ae412ff781b9b97217352d95c1";
const payload = "draftroom.pro.demo.v1";
async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(DEMO_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function generateLicense() {
  const sig = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(payload),
  );
  return `DR1.${Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
export async function verifyLicense(key) {
  try {
    if (!/^DR1\.[a-f0-9]{64}$/.test(key)) return false;
    return await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      Uint8Array.from(key.slice(4).match(/../g), (x) => parseInt(x, 16)),
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function canStart(pro, lastDate, today = localDate()) {
  return pro || lastDate !== today;
}
export function allowedConfig(pro, config) {
  return (
    Number.isInteger(config.teams) &&
    config.teams >= 4 &&
    config.teams <= 16 &&
    (pro || config.teams === 8) &&
    Number.isInteger(config.rounds) &&
    config.rounds >= 1 &&
    config.rounds <= 20 &&
    [15, 30, 45, 60].includes(config.clock) &&
    (!config.keeper || pro)
  );
}
