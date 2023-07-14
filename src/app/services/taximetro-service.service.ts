import { Injectable } from '@angular/core';
import { GPSLocationService } from './gps-location-service.service';
import { TarifaService } from './tarifa-service.service';

@Injectable({
  providedIn: 'root',
})
export class TaximetroService {
  private lastLatitude: number = 0;
  private lastLongitude: number = 0;
  private currentLatitude: number = 0;
  private currentLongitude: number = 0;
  private lastDistance: number = 0;
  private tarifa: number = 8.74;
  private acumuladoPorTiempo: number = 15.4;
  private acumuladoPorDistancia: number = 17.2;

  constructor(
    private gpsLocationService: GPSLocationService,
    private tarifaService: TarifaService
  ) {}

  iniciarViaje(): void {
    this.lastLatitude = 0;
    this.lastLongitude = 0;
    this.currentLatitude = 0;
    this.currentLongitude = 0;
    this.lastDistance = 0;

    this.gpsLocationService.obtenerCurrentPosition().then(
      (positionData: {
        lastLatitude: number;
        lastLongitude: number;
        currentLatitude: number;
        currentLongitude: number;
      }) => {
        this.lastLatitude = positionData.lastLatitude;
        this.lastLongitude = positionData.lastLongitude;
        this.currentLatitude = positionData.currentLatitude;
        this.currentLongitude = positionData.currentLongitude;

        if (this.lastLatitude === 0 && this.lastLongitude === 0) {
          console.log('Primera vez obtener posicion');
          this.lastLatitude = this.currentLatitude;
          this.lastLongitude = this.currentLongitude;
        }
      },
      (error) => {
        console.error('Error getting location', error);
      }
    );
  }

  terminarViaje(): void {
    this.lastLatitude = 0;
    this.lastLongitude = 0;
    this.currentLatitude = 0;
    this.currentLongitude = 0;
    this.lastDistance = 0;
  }

  calcularDistanciaRecorrida(): number {
    const distance = this.gpsLocationService.calcularDistancia(
      this.lastLatitude,
      this.lastLongitude,
      this.currentLatitude,
      this.currentLongitude
    );

    if (this.lastLatitude !== 0 && this.lastLongitude !== 0) {
      this.lastDistance = distance;
    }

    return Number(this.lastDistance.toFixed(2));
  }

  calcularTotalAcumuladoTiempo() {
    this.tarifa = this.tarifaService.tarifa;
    this.acumuladoPorTiempo = this.tarifaService.aumento;
    console.log('Total acumulado por tiempo:', this.tarifa);
    console.log('Total acumulado por tiempo:', this.acumuladoPorTiempo);
  }

  calcularTotalAcumuladoDistancia() {
    console.log('Total acumulado por distancia:', this.acumuladoPorDistancia);
  }

  calcularTotal() {
    const total =
      this.tarifa + this.acumuladoPorTiempo + this.acumuladoPorDistancia;
  }
}
