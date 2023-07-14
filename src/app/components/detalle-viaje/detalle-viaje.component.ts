import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-detalle-viaje',
  template: `
    <div class="detalle-viaje">
      <p class="titulo">Ticket</p>
      <hr />
      <p class="item">
        Cobro inicial (banderazo): <span>$ {{ tarifa }}</span>
      </p>
      <p class="item">
        Acumulado por tiempo: <span>$ {{ acumuladoTiempo }}</span>
      </p>
      <p class="item">
        Acumulado por distancia: <span>$ {{ acumuladoDistancia }}</span>
      </p>
      <hr />
      <p class="total">
        Total: <span>{{ total }}</span>
      </p>
    </div>
  `,
  styles: [
    `
      .detalle-viaje {
        text-align: center;
        background-color: white;
      }

      .titulo {
        font-size: 20px;
        font-weight: bold;
      }

      .item {
        margin: 10px;
      }

      .total {
        margin-top: 20px;
        font-size: 18px;
        font-weight: bold;
      }
    `,
  ],
})
export class DetalleViajeComponent {
  @Input() tarifa: string = '';
  @Input() acumuladoTiempo: string = '';
  @Input() acumuladoDistancia: string = '';
  @Input() total: string = '';
}
