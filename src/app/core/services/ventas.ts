import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VentasService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPedidosPendientes() {
    return this.http.get<any[]>(`${this.base}/ventas/pedidos-pendientes`);
  }

  getMetodosPago() {
    return this.http.get<any[]>(`${this.base}/ventas/metodos-pago`);
  }

  getTiposComprobante() {
    return this.http.get<any[]>(`${this.base}/ventas/tipos-comprobante`);
  }

  getVentas(desde?: string, hasta?: string) {
    let params = '';
    if (desde) params += `?desde=${desde}`;
    if (hasta) params += `${params ? '&' : '?'}hasta=${hasta}`;
    return this.http.get<any[]>(`${this.base}/ventas${params}`);
  }

  getResumenDia() {
    return this.http.get<any>(`${this.base}/ventas/resumen-dia`);
  }

  crearVenta(data: any) {
    return this.http.post<any>(`${this.base}/ventas`, data);
  }

  getComprobantes(params?: {
  desde?: string;
  hasta?: string;
  tipo?: string;
  buscar?: string;
}) {
  let query = '';
  if (params?.desde)  query += `?desde=${params.desde}`;
  if (params?.hasta)  query += `${query ? '&' : '?'}hasta=${params.hasta}`;
  if (params?.tipo)   query += `${query ? '&' : '?'}tipo_comprobante=${params.tipo}`;
  if (params?.buscar) query += `${query ? '&' : '?'}buscar=${params.buscar}`;

  return this.http.get<any[]>(
    `${this.base}/ventas/comprobantes${query}`
  );
}
}