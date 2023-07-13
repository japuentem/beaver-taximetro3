import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MiscellaneousService {
  constructor() {}

  obtenerNumeroRandom(max: number, min: number): number {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
  }

  setDebug(debugMode: boolean): boolean {
    return !debugMode;
  }

  simularMovimiento(
    currentLatitude: number,
    currentLongitude: number,
    lastLatitude: number,
    lastLongitude: number
  ): {
    lastLatitude: number;
    lastLongitude: number;
    currentLatitude: number;
    currentLongitude: number;
  } {
    const distanciaMinima = 1; // Distancia mínima en metros
    const distanciaMaxima = 6; // Distancia máxima en metros
    const distancia =
      Math.random() * (distanciaMaxima - distanciaMinima) + distanciaMinima;

    const angulo = Math.random() * 2 * Math.PI;

    const latOffset = distancia * Math.cos(angulo) * 0.000008983;
    const lonOffset = distancia * Math.sin(angulo) * 0.000008983;

    currentLatitude += latOffset;
    currentLongitude += lonOffset;

    if (lastLatitude === 0 && lastLongitude === 0) {
      lastLatitude = currentLatitude;
      lastLongitude = currentLongitude;
    }

    return { lastLatitude, lastLongitude, currentLatitude, currentLongitude };
  }
}
