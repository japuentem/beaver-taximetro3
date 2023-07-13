import { Component } from '@angular/core';
import {
  Geolocation,
  PositionOptions,
  Position,
  WatchPositionCallback,
} from '@capacitor/geolocation';
// import { StatusBar } from '@capacitor/status-bar';
import { DateTimeService } from '../services/date-time-service.service';
import { TarifaService } from '../services/tarifa-service.service';
import { GPSLocationService } from '../services/gps-location-service.service';
import { TaximetroService } from '../services/taximetro-service.service';
import { MiscellaneousService } from '../services/miscellaneous-service.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  // ******************************************* DATETIME
  nuevaFecha: string = '';
  currentDate: Date;
  currentTime: Date;
  timeInterval: any;

  // ******************************************* BUTTONS
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
  intervaloCostoDistancia: any;
  intervaloBlink: any;
  velocidad: number = 0;
  velocidadSpeedometer: number = 0;
  lastDistance: number = 0;
  plataform: any;
  watchId: string = '';

  // ******************************************* GPS Y TIPO TARIFA
  isDay: boolean = false;
  ubicacionActivada: boolean = false;

  // ******************************************* COBRO POR DISTANCIA O TIEMPO
  cobroPorTiempo: boolean = false;
  cobroPorDistancia: boolean = false;

  // ******************************************* RADIO BUTTON
  radioButtonsDisabled: boolean = true;
  // ******************************************* EXTRA
  caracterBlink: boolean = false;
  debugMode: boolean = true;
  vecesPosicion: number = 0;
  vecesDistancia: number = 0;

  constructor(
    private dateTimeService: DateTimeService,
    private tarifaService: TarifaService,
    private gpsLocationService: GPSLocationService,
    private taximetroService: TaximetroService,
    private miscellaneousService: MiscellaneousService
  ) {
    this.currentDate = new Date();
    this.currentTime = new Date();
    this.nuevaFecha = this.dateTimeService.convertirFecha(this.currentDate);
    this.checkUbicacionActivada();
  }
  async ngOnInit() {
    // Show the splash for three seconds and then automatically hide it:
    // await SplashScreen.show({
    //   showDuration: 5000,
    //   autoHide: true,
    // });
    // await StatusBar.hide();
    this.startDateTimer();
    this.checkUbicacionActivada();
  }
  // ******************************************* DATETIME
  startDateTimer() {
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  // ******************************************* BOTONES
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
    // this.startSpeedometer();
  }
  tarifaInicial() {
    this.validarTarifa(2);
    this.costo_viaje = this.tarifa;
  }
  calcularVelocidad() {
    // const velocidad = this.obtenerNumeroRandom(30, 5);
    // this.velocidad = (velocidad * 0.001) / 0.00028;
    this.velocidad = (this.lastDistance * 0.001) / 0.00028;
  }
  iniciarTimerCostoTiempo() {
    this.intervaloCostoTiempo = setInterval(() => {
      this.actualizarCostoPorTiempo();
    }, 45000);
  }
  iniciarTimerCostoDistancia() {
    this.obtenerCurrentPosition();
    this.intervaloCostoDistancia = setInterval(() => {
      this.actualizarCostoPorDistancia();
    }, 1000); // segundero
  }
  ejecutaBlink(tiempo: number) {
    this.intervaloBlink = setInterval(() => {
      if (this.caracterBlink) {
        this.caracterBlink = false;
      } else {
        this.caracterBlink = true;
      }
    }, tiempo);
  }
  obtenerTiempo(): number {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - this.lastUpdateTime;

    return elapsedTime;
  }
  calcularDistanciaRecorrida(): number {
    this.obtenerCurrentPosition();

    this.vecesDistancia++;
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
    this.taximetroService.terminarViaje();
    clearInterval(this.intervaloCostoTiempo);
    clearInterval(this.intervaloCostoDistancia);
    clearInterval(this.intervaloBlink);
    this.viajeIniciado = false;
    this.viajeTerminado = true;
    this.caracterBlink = false;

    this.vecesDistancia = 0;
    this.vecesPosicion = 0;
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
    clearInterval(this.intervaloCostoDistancia);
    clearInterval(this.intervaloBlink);
    this.taxiSelected = null;

    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = '';
    }
  }

  actualizarCostoPorTiempo() {
    // debugger;
    this.validarTarifa(1);
    this.costo_viaje += this.aumento;
    this.cobroPorTiempo = true;
    this.cobroPorDistancia = false;
    this.aumento = 0;
    this.distanciaRecorridaSegundo = 0;
    this.reiniciarTimersCosto();
  }
  actualizarCostoPorDistancia() {
    // const numeroRandom = this.obtenerNumeroRandom(0, 6);
    // this.lastDistance = numeroRandom;
    // const currentHour = this.currentTime.getHours();

    // this.simularMovimiento();
    this.calcularDistanciaRecorrida();
    this.distanciaRecorridaSegundo += this.lastDistance;
    this.distanciaRecorridaTotal += this.lastDistance;

    if (this.distanciaRecorridaSegundo >= 242) {
      this.validarTarifa(1);
      this.costo_viaje += this.aumento;

      this.cobroPorTiempo = false;
      this.cobroPorDistancia = true;
      this.aumento = 0;
      this.distanciaRecorridaSegundo = 0;
      this.reiniciarTimersCosto();
    }
  }

  // ******************************************* GPS Y TIPO TARIFA
  tipoTarifa(): boolean {
    const currentHour = this.currentTime.getHours();
    return currentHour >= 5 && currentHour < 22 ? (this.isDay = true) : false;
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

  // **************************************** RADIO CONTAINER
  onRadioSelect() {
    if (this.taxiSelected && this.viajeIniciado) {
      this.radioButtonsDisabled = true;
    }
  }

  // **************************************** EXTRAS
  obtenerCurrentPosition() {
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
          // console.log('Primera vez obtener posicion');
          this.lastLatitude = this.currentLatitude;
          this.lastLongitude = this.currentLongitude;
        }
      },
      (error) => {
        console.error('Error getting location', error);
      }
    );
  }

  /*   obtenerCurrentPosition() {
    this.vecesPosicion++;
    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 5000,
    };

    Geolocation.getCurrentPosition(options).then(
      (position: Position) => {
        const newLatitude = position.coords.latitude;
        const newLongitude = position.coords.longitude;

        this.lastLatitude = this.currentLatitude;
        this.lastLongitude = this.currentLongitude;
        this.currentLatitude = newLatitude;
        this.currentLongitude = newLongitude;

        if (this.lastLatitude === 0 && this.lastLongitude === 0) {
          this.lastLatitude = this.currentLatitude;
          this.lastLongitude = this.currentLongitude;
        }
      },
      (error) => {
        console.log('No se pudo obtener la ubicación');
      }
    );
  }
 */
  calcularDistancia(
    lastLat: number,
    lastLon: number,
    currLat: number,
    currLon: number
  ): number {
    if (lastLat !== 0 && lastLon! !== 0) {
      const R = 6371; // Radio de la Tierra en kilómetros
      const dLat = this.gpsLocationService.degToRad(currLat - lastLat);
      const dLon = this.gpsLocationService.degToRad(currLon - lastLon);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.gpsLocationService.degToRad(lastLat)) *
          Math.cos(this.gpsLocationService.degToRad(currLat)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distancia = R * c * 1000; // Distancia en metros

      return distancia;
    } else {
      return 0;
    }
  }
  /*
  async startSpeedometer() {
    try {
      const position: Position = await Geolocation.getCurrentPosition();
      const watchOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
      };
      const watchCallback: WatchPositionCallback = (
        position: Position | null,
        err?: any
      ) => {
        if (position && position.coords) {
          const { speed } = position.coords;
          this.velocidadSpeedometer = speed ? Math.round(speed * 3.6) : 0;
        }
      };
      this.watchId = await Geolocation.watchPosition(
        watchOptions,
        watchCallback
      );
    } catch (error) {
      console.error('Error getting location', error);
    }
  }
 */

  reiniciarTimersCosto() {
    clearInterval(this.intervaloCostoTiempo);
    clearInterval(this.intervaloCostoDistancia);
    this.iniciarTimerCostoTiempo();
    this.iniciarTimerCostoDistancia();
    this.vecesDistancia = 0;
    this.vecesPosicion = 0;
  }

  // Nueva función para simular el movimiento

  simularMovimiento(): void {
    const positionData = this.miscellaneousService.simularMovimiento(
      this.currentLatitude,
      this.currentLongitude,
      this.lastLatitude,
      this.lastLongitude
    );

    this.lastLatitude = positionData.lastLatitude;
    this.lastLongitude = positionData.lastLongitude;
    this.currentLatitude = positionData.currentLatitude;
    this.currentLongitude = positionData.currentLongitude;
  }
  setDebug() {
    this.debugMode = this.miscellaneousService.setDebug(this.debugMode);
  }

  obtenerNumeroTarifa(): number {
    return this.tarifaService.obtenerNumeroTarifa(this.taxiSelected);
  }

  async ngOnDestroy() {
    clearInterval(this.timeInterval);
    clearInterval(this.intervaloCostoTiempo);
    clearInterval(this.intervaloCostoDistancia);
    clearInterval(this.intervaloBlink);
    // await StatusBar.show();
  }

  getSpeedometerRotation(): string {
    const maxSpeed = 100; // Velocidad máxima en km/hr
    const rotation = (this.velocidadSpeedometer / maxSpeed) * 180 - 90;
    return `rotate(${rotation}deg)`;
  }
  }
