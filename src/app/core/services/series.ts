import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

export interface SerieComprobante {
  serie_id: number;
  tenant_id: number;
  sucursal_id: number;
  sucursal_nombre: string;
  tipo_comprobante_id: number;
  tipo_comprobante: string;
  codigo_sunat: string;
  serie: string;
  correlativo_actual: number;
  activo: boolean;
}

export interface GuardarSerie {
  sucursal_id: number;
  tipo_comprobante_id: number;
  serie: string;
  correlativo_actual: number;
  activo: boolean;
}

export interface SucursalSimple {
  sucursal_id: number;
  nombre: string;
}

export interface TipoComprobanteSimple {
  tipo_comprobante_id: number;
  nombre: string;
  codigo_sunat: string;
}

@Injectable({ providedIn: 'root' })
export class SeriesService extends BaseService {

  private base = `${environment.apiUrl}/series`;

  constructor(private http: HttpClient) { super(); }

  private opts(tenantId?: number) {
    let p = new HttpParams();
    if (tenantId && tenantId > 0) p = p.set('tenantId', tenantId.toString());
    return { params: p };
  }

  getAll(tenantId?: number) {
    return this.http.get<SerieComprobante[]>(this.base, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getById(id: number, tenantId?: number) {
    return this.http.get<SerieComprobante>(`${this.base}/${id}`, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  crear(data: GuardarSerie, tenantId?: number) {
    return this.http.post<any>(this.base, data, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  actualizar(id: number, data: GuardarSerie, tenantId?: number) {
    return this.http.put<any>(`${this.base}/${id}`, data, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  eliminar(id: number, tenantId?: number) {
    return this.http.delete<any>(`${this.base}/${id}`, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  toggle(id: number, tenantId?: number) {
    return this.http.put<any>(`${this.base}/${id}/toggle`, {}, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getSucursales(tenantId?: number) {
    return this.http.get<SucursalSimple[]>(`${this.base}/sucursales`, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getTiposComprobante() {
    return this.http.get<TipoComprobanteSimple[]>(`${this.base}/tipos-comprobante`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}