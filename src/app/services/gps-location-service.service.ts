import { Injectable } from '@angular/core';
import {
  Geolocation,
  Position,
  PositionOptions,
  WatchPositionCallback,
} from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root',
})
export class GPSLocationService {
  currentLatitude: number = 0;
  currentLongitude: number = 0;

  constructor() {}

  checkUbicacionActivada(): Promise<boolean> {
    return Geolocation.getCurrentPosition().then(
      (position: Position): boolean => {
        return true;
      },
      (error) => {
        return false;
      }
    );
  }

  obtenerCurrentPosition(): Promise<{
    lastLatitude: number;
    lastLongitude: number;
    currentLatitude: number;
    currentLongitude: number;
  }> {
    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 5000,
      };
      const watchCallback: WatchPositionCallback = (
        position: Position | null,
        error?: any
      ) => {
        if (position && position.coords) {
          const newLatitude = position.coords.latitude;
          const newLongitude = position.coords.longitude;

          resolve({
            lastLatitude: this.currentLatitude,
            lastLongitude: this.currentLongitude,
            currentLatitude: newLatitude,
            currentLongitude: newLongitude,
          });
        } else {
          reject(error);
        }
      };
      Geolocation.watchPosition(options, watchCallback);
    });
  }

  calcularDistancia(
    lastLat: number,
    lastLon: number,
    currLat: number,
    currLon: number
  ): number {
    if (lastLat !== 0 && lastLon !== 0) {
      const R = 6371; // Radio de la Tierra en kilómetros
      const dLat = this.degToRad(currLat - lastLat);
      const dLon = this.degToRad(currLon - lastLon);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.degToRad(lastLat)) *
          Math.cos(this.degToRad(currLat)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distancia = R * c * 1000; // Distancia en metros

      return distancia;
    } else {
      return 0;
    }
  }

  degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
