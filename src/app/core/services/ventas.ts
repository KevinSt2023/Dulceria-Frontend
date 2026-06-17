import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class VentasService extends BaseService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) { super(); }

  getPedidosPendientes() {
    return this.http.get<any[]>(`${this.base}/ventas/pedidos-pendientes`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getMetodosPago() {
    return this.http.get<any[]>(`${this.base}/ventas/metodos-pago`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getTiposComprobante() {
    return this.http.get<any[]>(`${this.base}/ventas/tipos-comprobante`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getVentas(desde?: string, hasta?: string) {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<any[]>(`${this.base}/ventas`, { params }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getResumenDia() {
    return this.http.get<any>(`${this.base}/ventas/resumen-dia`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  crearVenta(data: any) {
    return this.http.post<any>(`${this.base}/ventas`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getComprobantes(params?: {
    desde?:  string;
    hasta?:  string;
    tipo?:   string;
    buscar?: string;
    pagina?: number;
  }) {
    let httpParams = new HttpParams();
    if (params?.desde)  httpParams = httpParams.set('desde', params.desde);
    if (params?.hasta)  httpParams = httpParams.set('hasta', params.hasta);
    if (params?.tipo)   httpParams = httpParams.set('tipo_comprobante', params.tipo);
    if (params?.buscar) httpParams = httpParams.set('buscar', params.buscar);
    
    const pag = params?.pagina ?? 1;
    httpParams = httpParams.set('pagina', pag.toString()).set('porPagina', '10');

    return this.http.get<any>(`${this.base}/ventas/comprobantes`, { params: httpParams }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  abonarVenta(ventaId: number, data: { monto: number; metodo_pago: string; observacion?: string }) {
    return this.http.post<any>(`${this.base}/ventas/${ventaId}/abonar`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getAbonos(ventaId: number) {
    return this.http.get<any>(`${this.base}/pedido/${ventaId}/abonos`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
