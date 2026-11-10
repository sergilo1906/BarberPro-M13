import { expect } from "@playwright/test";

type MedidaPresentacion = Record<string, string | number>;

// Margen de rasterizado: 0,03 % de píxeles, con threshold perceptivo 0.1.
// Se observaron hasta 251 píxeles distintos en bordes de letras, incluso con
// fuentes y geometría iguales. Textos y estilos se siguen exigiendo exactos.
export const OPCIONES_IMAGEN = { maxDiffPixelRatio: 0.0003, threshold: 0.1 };

export function compararPresentacion(nuevas: MedidaPresentacion[], originales: MedidaPresentacion[], margenGeometrico = 1 / 16): void {
  expect(nuevas).toHaveLength(originales.length);
  for (let indice = 0; indice < nuevas.length; indice++) {
    const { x, y, ancho, alto, ...estiloNuevo } = nuevas[indice];
    const { x: origenX, y: origenY, ancho: anchoOriginal, alto: altoOriginal, ...estiloOriginal } = originales[indice];
    expect(estiloNuevo).toEqual(estiloOriginal);
    const geometriaNueva = [x, y, ancho, alto], geometriaOriginal = [origenX, origenY, anchoOriginal, altoOriginal];
    for (let campo = 0; campo < geometriaNueva.length; campo++) {
      if (geometriaNueva[campo] === undefined && geometriaOriginal[campo] === undefined) continue;
      expect(typeof geometriaNueva[campo]).toBe("number");
      expect(typeof geometriaOriginal[campo]).toBe("number");
      // El reparto intrínseco varía 1/64 CSS px en Chromium/Windows.
      expect(Math.abs(Number(geometriaNueva[campo]) - Number(geometriaOriginal[campo]))).toBeLessThanOrEqual(margenGeometrico);
    }
  }
}
