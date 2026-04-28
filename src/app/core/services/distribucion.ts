import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DistribucionService {

  constructor(private http: HttpClient) {}

  getPedidosListos() {
    return this.http.get(`${environment.apiUrl}/distribucion`);
  }

  getHistorial(fecha?: string) {
    const params = fecha ? `?fecha=${fecha}` : '';
    return this.http.get(`${environment.apiUrl}/distribucion/historial${params}`);
  }

  marcarDespachado(pedidoId: number) {
    return this.http.put(
      `${environment.apiUrl}/pedidos/${pedidoId}/estado`, 7
    );
  }

  confirmarCobroYEntrega(
    pedidoId: number,
    monto: number,
    metodo: string,
    tipoPago: string = 'CONTADO'
  ) {
    return this.http.put(
      `${environment.apiUrl}/pedidos/${pedidoId}/entregar`,
      { monto_cobrado: monto, metodo_pago: metodo, tipo_pago: tipoPago }
    );
  }

  abonar(pedidoId: number, monto: number, metodo: string, observacion?: string) {
    return this.http.post(
      `${environment.apiUrl}/pedidos/${pedidoId}/abonar`,
      { monto, metodo_pago: metodo, observacion }
    );
  }

  getAbonos(pedidoId: number) {
    return this.http.get(`${environment.apiUrl}/pedidos/${pedidoId}/abonos`);
  }
}