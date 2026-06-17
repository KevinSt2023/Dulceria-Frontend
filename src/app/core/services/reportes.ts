import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

export interface FiltrosReporte {
  fecha_desde?: string;
  fecha_hasta?: string;
  sucursal_id?: number;
  cliente_id?: number;
  producto_id?: number;
  categoria_id?: number;
  usuario_id?: number;
  tipo_comprobante?: string;
  estado_sunat?: string;
  metodo_pago?: string;
  agrupar_por?: 'dia' | 'semana' | 'mes' | 'anio';
  incluir_todos_clientes?: boolean;
}

export interface FiltrosHistorialCreditos {
  fecha_desde?: string;
  fecha_hasta?: string;
  sucursal_id?: number;
  cliente_id?: number;
  estado?: string;     // 'PAGADO' | 'PARCIAL' | 'PENDIENTE' | ''
}

@Injectable({ providedIn: 'root' })
export class ReportesService extends BaseService {

  private base = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) { super(); }

  // ── DATOS ──
  getDashboard() {
    return this.http.get<any>(`${this.base}/dashboard`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  historialCreditos(filtros: FiltrosHistorialCreditos) {
  return this.http.post<any>(`${this.base}/historial-creditos`, filtros).pipe(
    catchError(err => this.handleError(err))
  );
}

  ventasPorPeriodo(filtros: FiltrosReporte) {
    return this.http.post<any>(`${this.base}/ventas-periodo`, filtros).pipe(
      catchError(err => this.handleError(err))
    );
  }

  productosVendidos(filtros: FiltrosReporte) {
    return this.http.post<any>(`${this.base}/productos-vendidos`, filtros).pipe(
      catchError(err => this.handleError(err))
    );
  }

  ventasPorCliente(filtros: FiltrosReporte) {
    return this.http.post<any>(`${this.base}/ventas-cliente`, filtros).pipe(
      catchError(err => this.handleError(err))
    );
  }

  reporteCaja(filtros: FiltrosReporte) {
    return this.http.post<any>(`${this.base}/caja`, filtros).pipe(
      catchError(err => this.handleError(err))
    );
  }

  reporteCreditos(filtros: FiltrosReporte) {
    return this.http.post<any>(`${this.base}/creditos`, filtros).pipe(
      catchError(err => this.handleError(err))
    );
  }

  reporteInventario(filtros: FiltrosReporte) {
    return this.http.post<any>(`${this.base}/inventario`, filtros).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // ── EXPORTACIÓN ──
  exportarExcel(tipo: string, filtros: FiltrosReporte) {
    return this.http.post(`${this.base}/${tipo}/excel`, filtros, { responseType: 'blob' });
  }

  exportarPDF(tipo: string, filtros: FiltrosReporte) {
    return this.http.post(`${this.base}/${tipo}/pdf`, filtros, { responseType: 'blob' });
  }

  descargarArchivo(blob: Blob, nombre: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}