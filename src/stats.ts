// src/stats.ts
export function average(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

export function min(values: number[]) {
  return Math.min(...values);
}

export function max(values: number[]) {
  return Math.max(...values);
}
