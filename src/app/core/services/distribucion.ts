import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class DistribucionService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getPedidosListos() {
    return this.http.get(`${environment.apiUrl}/distribucion`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getHistorial(fecha?: string) {
    const params = fecha ? `?fecha=${fecha}` : '';
    return this.http.get(`${environment.apiUrl}/distribucion/historial${params}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  marcarDespachado(pedidoId: number) {
    return this.http.put(
      `${environment.apiUrl}/pedidos/${pedidoId}/estado`, 7  // ← fix
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }

  confirmarCobroYEntrega(
    pedidoId: number,
    monto: number,
    metodo: string,
    tipoPago: string = 'CONTADO',
    referencia: string = ''
  ) {
    return this.http.put(
      `${environment.apiUrl}/pedidos/${pedidoId}/entregar`,  // ← fix
      { monto_cobrado: monto, metodo_pago: metodo, tipo_pago: tipoPago, referencia_pago: referencia }
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }

  abonar(pedidoId: number, monto: number, metodo: string, observacion?: string) {
    return this.http.post(
      `${environment.apiUrl}/pedidos/${pedidoId}/abonar`,  // ← fix
      { monto, metodo_pago: metodo, observacion }
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getAbonos(pedidoId: number) {
    return this.http.get(`${environment.apiUrl}/pedidos/${pedidoId}/abonos`).pipe(  // ← fix
      catchError(err => this.handleError(err))
    );
  }
}