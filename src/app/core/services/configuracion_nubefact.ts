import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

export interface ConfiguracionNubefact {
  configuracion_nubefact_id: number;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion_fiscal: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  nubefact_url: string;
  modo: 'TEST' | 'PROD';
  enviar_automatico_sunat: boolean;
  enviar_automatico_cliente: boolean;
  logo_url?: string;
  color_primario?: string;
  pie_pagina?: string;
  activo: boolean;
  validado: boolean;
}

export interface GuardarConfiguracionNubefact {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion_fiscal: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  nubefact_url: string;
  nubefact_token: string;
  modo: 'TEST' | 'PROD';
  enviar_automatico_sunat: boolean;
  enviar_automatico_cliente: boolean;
  logo_url?: string;
  color_primario?: string;
  pie_pagina?: string;
}

export interface ProbarConexionNubefact {
  nubefact_url: string;
  nubefact_token: string;
}

export interface ResultadoProbarConexion {
  conectado: boolean;
  mensaje: string;
  http_status?: number;
  duracion_ms?: number;
}

export interface EmpresaEstadoFE {
  tenant_id: number;
  nombre: string;
  ruc: string;
  tenant_activo: boolean;
  facturacion_electronica_toggle: boolean;
  nubefact_configurado: boolean;
  nubefact_validado: boolean;
  nubefact_activo: boolean;
  nubefact_modo?: string;
  ultima_validacion?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionNubefactService extends BaseService {

  private base = `${environment.apiUrl}/configuracion-nubefact`;

  constructor(private http: HttpClient) { super(); }

  private opts(tenantId?: number) {
    let p = new HttpParams();
    if (tenantId && tenantId > 0) p = p.set('tenantId', tenantId.toString());
    return { params: p };
  }

  get(tenantId?: number) {
    return this.http.get<ConfiguracionNubefact | null>(this.base, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getEmpresas() {
    return this.http.get<EmpresaEstadoFE[]>(`${this.base}/empresas`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  guardar(data: GuardarConfiguracionNubefact, tenantId?: number) {
    return this.http.post<any>(this.base, data, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  probar(data: ProbarConexionNubefact, tenantId?: number) {
    return this.http.post<ResultadoProbarConexion>(`${this.base}/probar`, data, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  activar(tenantId?: number) {
    return this.http.put<any>(`${this.base}/activar`, {}, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }

  desactivar(tenantId?: number) {
    return this.http.put<any>(`${this.base}/desactivar`, {}, this.opts(tenantId)).pipe(
      catchError(err => this.handleError(err))
    );
  }
}