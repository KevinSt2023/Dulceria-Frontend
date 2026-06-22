import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';
 
@Injectable({ providedIn: 'root' })
export class SeguimientoService extends BaseService {
 
  private base = environment.apiUrl;
 
  constructor(private http: HttpClient) { super(); }
 
  getCola() {
    return this.http.get<any[]>(`${this.base}/seguimiento`).pipe(
      catchError(err => this.handleError(err))
    );
  }
 
  cambiarEstado(pedidoId: number, estadoId: number) {
    return this.http.put(
      `${this.base}/pedidos/${pedidoId}/estado`,
      estadoId,
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }
 
  /** Marca un item del pedido como NO PRODUCIDO con motivo */
  marcarNoProducido(detalleId: number, motivo: string) {
    return this.http.patch(
      `${this.base}/seguimiento/detalle/${detalleId}/no-producido`,
      { motivo }
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }
 
  /** Revierte la marca "no producido" (por si fue error) */
  revertirNoProducido(detalleId: number) {
    return this.http.patch(
      `${this.base}/seguimiento/detalle/${detalleId}/revertir-no-producido`,
      {}
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }
}