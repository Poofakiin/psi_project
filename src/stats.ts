/**
 * Módulo de funciones estadísticas básicas.
 *
 * Estas funciones se utilizan para calcular
 * métricas sobre los resultados del PSI
 * sin afectar la privacidad de los datos.
 */

/**
 * Calcula el promedio aritmético de un arreglo de números.
 *
 * @param values Lista de valores numéricos
 * @returns Promedio de los valores
 */
export function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calcula la suma total de un arreglo de números.
 *
 * @param values Lista de valores numéricos
 * @returns Suma total
 */
export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Obtiene el valor mínimo de un arreglo de números.
 *
 * @param values Lista de valores numéricos
 * @returns Valor mínimo
 */
export function min(values: number[]): number {
  return Math.min(...values);
}

/**
 * Obtiene el valor máximo de un arreglo de números.
 *
 * @param values Lista de valores numéricos
 * @returns Valor máximo
 */
export function max(values: number[]): number {
  return Math.max(...values);
}
