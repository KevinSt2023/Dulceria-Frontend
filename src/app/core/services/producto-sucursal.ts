// src/app/core/services/producto-sucursal.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class ProductoSucursalService extends BaseService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) { super(); }

  getConfig(sucursalId?: number) {
    const params = sucursalId ? `?sucursal_id=${sucursalId}` : '';
    return this.http.get<any[]>(`${this.base}/productosucursal${params}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateConfig(productoId: number, data: { activo: boolean; permite_pedido_sin_stock: boolean }) {
    return this.http.put(`${this.base}/productosucursal/${productoId}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
