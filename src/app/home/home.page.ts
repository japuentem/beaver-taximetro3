import { Component } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { DateTimeService } from '../services/date-time-service.service';
import { TarifaService } from '../services/tarifa-service.service';
import { GPSLocationService } from '../services/gps-location-service.service';
import { TaximetroService } from '../services/taximetro-service.service';
import { MiscellaneousService } from '../services/miscellaneous-service.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  nuevaFecha: string = '';
  currentDate: Date;
  currentTime: Date;
  timeInterval: any;

  viajeIniciado: boolean = false;
  viajeTerminado: boolean = false;
  taxiSelected: string | null = null;
  tarifa: number = 0;
  aumento: number = 0;
  costo_viaje: number = 0;
  distanciaRecorridaTotal: number = 0;
  distanciaRecorridaSegundo: number = 0;
  inicioLatitude: number = 0;
  inicioLongitude: number = 0;
  currentLatitude: number = 0;
  currentLongitude: number = 0;
  lastLatitude: number = 0;
  lastLongitude: number = 0;
  lastUpdateTime: number = 0;
  intervaloCostoTiempo: any;
  intervaloBlink: any;
  velocidad: number = 0;
  velocidadSpeedometer: number = 0;
  lastDistance: number = 0;
  plataform: any;
  watchId: string = '';

  isDay: boolean = false;
  ubicacionActivada: boolean = false;

  cobroPorTiempo: boolean = false;
  cobroPorDistancia: boolean = false;

  radioButtonsDisabled: boolean = true;

  debugMode: boolean = true;

  vecesTiempo: number = 0;
  vecesDistancia: number = 0;
  total = 0;
  acumuladoTiempo = 0;
  acumuladoDistancia = 0;

  constructor(
    private dateTimeService: DateTimeService,
    private tarifaService: TarifaService,
    private gpsLocationService: GPSLocationService,
    private taximetroService: TaximetroService,
    private miscellaneousService: MiscellaneousService,
    private alertController: AlertController
  ) {
    this.currentDate = new Date();
    this.currentTime = new Date();
    this.nuevaFecha = this.dateTimeService.convertirFecha(this.currentDate);
    this.checkUbicacionActivada();
  }

  async ngOnInit() {
    this.startDateTimer();
    this.checkUbicacionActivada();
  }

  startDateTimer() {
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  validarTarifa(opcion: number) {
    const { tarifa, aumento } = this.tarifaService.validarTarifa(
      opcion,
      this.currentTime,
      this.taxiSelected
    );
    this.tarifa = tarifa;
    this.aumento = aumento;
  }

  iniciarViaje() {
    this.viajeIniciado = true;
    this.viajeTerminado = false;

    this.taximetroService.iniciarViaje();
    this.tarifaInicial();
    this.iniciarTimerCostoTiempo();
    this.iniciarTimerCostoDistancia();
  }

  tarifaInicial() {
    this.validarTarifa(2);
    this.costo_viaje = this.tarifa;
  }

  calcularVelocidad() {
    this.velocidad = (this.lastDistance * 0.001) / 0.00028;
  }

  iniciarTimerCostoTiempo() {
    this.intervaloCostoTiempo = setInterval(() => {
      this.actualizarCostoPorTiempo();
    }, 45000);
  }

  iniciarTimerCostoDistancia() {
    this.obtenerCurrentPosition();
  }

  obtenerTiempo(): number {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - this.lastUpdateTime;

    return elapsedTime;
  }

  calcularDistanciaRecorrida(): number {
    this.obtenerCurrentPosition();

    const distance = this.gpsLocationService.calcularDistancia(
      this.lastLatitude,
      this.lastLongitude,
      this.currentLatitude,
      this.currentLongitude
    );

    if (this.lastLatitude !== 0 && this.lastLongitude !== 0) {
      this.lastDistance = distance;
    }
    this.calcularVelocidad();

    return this.taximetroService.calcularDistanciaRecorrida();
  }

  terminarViaje() {
    if (this.vecesTiempo > 0) {
      this.total = this.aumento * this.vecesTiempo;
    }
    if (this.vecesDistancia > 0) {
      this.total = this.aumento * this.vecesDistancia;
    }
    this.calcularDetalleViaje();

    this.taximetroService.terminarViaje();
    clearInterval(this.intervaloCostoTiempo);
    clearInterval(this.intervaloBlink);
    this.viajeIniciado = false;
    this.viajeTerminado = true;
  }

  reiniciarTaximetro() {
    this.viajeIniciado = false;
    this.viajeTerminado = false;
    this.costo_viaje = 0;
    this.lastLatitude = 0;
    this.lastLongitude = 0;
    this.currentLatitude = 0;
    this.currentLongitude = 0;
    this.lastDistance = 0;
    this.cobroPorTiempo = false;
    this.cobroPorDistancia = false;
    this.distanciaRecorridaSegundo = 0;
    this.distanciaRecorridaTotal = 0;
    clearInterval(this.intervaloCostoTiempo);
    clearInterval(this.intervaloBlink);
    this.taxiSelected = null;

    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = '';
    }
  }

  actualizarCostoPorTiempo() {
    this.validarTarifa(1);
    this.costo_viaje += this.aumento;
    this.vecesTiempo++;

    this.cobroPorTiempo = true;
    this.cobroPorDistancia = false;
    // this.aumento = 0;
    // this.distanciaRecorridaSegundo = 0;
    this.reiniciarTimers();
  }

  actualizarCostoPorDistancia() {
    this.calcularDistanciaRecorrida();
    this.distanciaRecorridaSegundo += this.lastDistance;
    this.distanciaRecorridaTotal += this.lastDistance;

    if (this.distanciaRecorridaSegundo >= 242) {
      this.validarTarifa(1);
      this.costo_viaje += this.aumento;
      this.vecesDistancia++;

      this.cobroPorTiempo = false;
      this.cobroPorDistancia = true;
      this.aumento = 0;
      this.distanciaRecorridaSegundo = 0;
      this.reiniciarTimers();
    }
  }

  reiniciarTimers() {
    clearInterval(this.intervaloCostoTiempo);
    this.iniciarTimerCostoTiempo();
  }

  checkUbicacionActivada() {
    this.gpsLocationService.checkUbicacionActivada().then(
      (ubicacionActivada: boolean) => {
        this.ubicacionActivada = ubicacionActivada;
      },
      (error) => {
        console.log('No se pudo obtener la ubicación');
      }
    );
  }

  obtenerCurrentPosition() {
    this.gpsLocationService
      .startPositionUpdates()
      .subscribe((positionData: any) => {
        this.lastLatitude = positionData.lastLatitude;
        this.lastLongitude = positionData.lastLongitude;
        this.currentLatitude = positionData.currentLatitude;
        this.currentLongitude = positionData.currentLongitude;

        if (this.lastLatitude === 0 && this.lastLongitude === 0) {
          this.lastLatitude = this.currentLatitude;
          this.lastLongitude = this.currentLongitude;
        }
      });
  }

  setDebug() {
    this.debugMode = this.miscellaneousService.setDebug(this.debugMode);
  }

  onRadioSelect() {
    if (this.taxiSelected && this.viajeIniciado) {
      this.radioButtonsDisabled = true;
    }
  }

  obtenerNumeroTarifa(): number {
    return this.tarifaService.obtenerNumeroTarifa(this.taxiSelected);
  }

  tipoTarifa(): boolean {
    const currentHour = this.currentTime.getHours();
    return currentHour >= 5 && currentHour < 22 ? (this.isDay = true) : false;
  }

  async calcularDetalleViaje() {
    if (this.vecesTiempo > 0) {
      this.acumuladoTiempo = this.aumento * this.vecesTiempo;
    }
    if (this.vecesDistancia > 0) {
      this.acumuladoDistancia = this.aumento * this.vecesDistancia;
    }
    this.total = this.tarifa + this.acumuladoTiempo + this.acumuladoDistancia;
  }
}
