import { YOCTO_PER_NEAR, POOL_ID } from "../config";

export function nearToYocto(near: number | string): string {
  const n = typeof near === "string" ? normalizeDecimal(near) : near;
  if (!Number.isFinite(n) || n <= 0) throw new Error(`invalid NEAR amount: ${near}`);
  const [whole, frac = ""] = String(n).split(".");
  const fracPadded = frac.padEnd(24, "0").slice(0, 24);
  const value = BigInt(whole) * YOCTO_PER_NEAR + BigInt(fracPadded || "0");
  return value.toString();
}

export function yoctoToNear(yocto: string): number {
  const v = BigInt(yocto || "0");
  const whole = v / YOCTO_PER_NEAR;
  const frac = v % YOCTO_PER_NEAR;
  const fracStr = frac.toString().padStart(24, "0").replace(/0+$/, "");
  return fracStr ? Number(`${whole}.${fracStr}`) : Number(whole);
}

export function formatNear(yocto: string): string {
  return yoctoToNear(yocto).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  });
}

export function normalizeDecimal(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return NaN;
  const normalized = trimmed.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;
  return Number(normalized);
}

export function formatDuration(hours: number): string {
  if (hours <= 0) return "now";
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours % 24);
  if (days > 0 && remHours > 0) return `~${days}d ${remHours}h`;
  if (days > 0) return `~${days}d`;
  return `~${remHours}h`;
}

export const POOL = POOL_ID;
