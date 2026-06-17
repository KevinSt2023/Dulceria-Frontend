import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class PedidosService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getPedidos() {
    return this.http.get(`${environment.apiUrl}/pedidos`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getPedido(id: number) {
    return this.http.get(`${environment.apiUrl}/pedidos/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createPedido(data: any) {
    return this.http.post(`${environment.apiUrl}/pedidos`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  cambiarEstado(id: number, estado_id: number) {
    return this.http.put(`${environment.apiUrl}/pedidos/${id}/estado`, estado_id).pipe(
      catchError(err => this.handleError(err))
    );
  }

  cancelarPedido(id: number) {
    return this.http.put(`${environment.apiUrl}/pedidos/${id}/cancelar`, {}).pipe(
      catchError(err => this.handleError(err))
    );
  }

  entregar(id: number, monto: number, metodo: string, tipoPago: string = 'CONTADO', referencia: string = '') {
    return this.http.put(`${environment.apiUrl}/pedidos/${id}/entregar`, {
      monto_cobrado:    monto,
      metodo_pago:      metodo,
      tipo_pago:        tipoPago,
      referencia_pago:  referencia
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  abonar(id: number, monto: number, metodo: string, observacion?: string) {
    return this.http.post(`${environment.apiUrl}/pedidos/${id}/abonar`, {
      monto,
      metodo_pago: metodo,
      observacion
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getAbonos(id: number) {
    return this.http.get(`${environment.apiUrl}/pedidos/${id}/abonos`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getSucursalesPickup() {
    return this.http.get<any[]>(`${environment.apiUrl}/sucursales?todas=true`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getCreditosPendientes() {
    return this.http.get(`${environment.apiUrl}/pedidos/creditos-pendientes`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
