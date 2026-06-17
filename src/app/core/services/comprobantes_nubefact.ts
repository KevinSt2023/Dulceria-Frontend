import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

export interface EnvioNubefactResultado {
  exitoso: boolean;
  estado: string;
  comprobante_id: number;
  mensaje?: string;
  codigo_error?: string;
  enlace_pdf?: string;
  enlace_xml?: string;
  enlace_cdr?: string;
  qr_codigo?: string;
  intentos: number;
}

@Injectable({ providedIn: 'root' })
export class ComprobantesNubefactService extends BaseService {

  private base = `${environment.apiUrl}/comprobantes-nubefact`;

  constructor(private http: HttpClient) { super(); }

  enviar(comprobanteId: number) {
    return this.http.post<EnvioNubefactResultado>(`${this.base}/${comprobanteId}/enviar`, {}).pipe(
      catchError(err => this.handleError(err))
    );
  }

  reenviar(comprobanteId: number) {
    return this.http.post<EnvioNubefactResultado>(`${this.base}/${comprobanteId}/reenviar`, {}).pipe(
      catchError(err => this.handleError(err))
    );
  }

  consultar(comprobanteId: number) {
    return this.http.get<EnvioNubefactResultado>(`${this.base}/${comprobanteId}/consultar`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  anular(comprobanteId: number, motivo: string) {
    return this.http.post<EnvioNubefactResultado>(`${this.base}/${comprobanteId}/anular`, { motivo }).pipe(
      catchError(err => this.handleError(err))
    );
  }
}