// src/app/core/services/producto-sucursal.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductoSucursalService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getConfig(sucursalId?: number) {
    const params = sucursalId ? `?sucursal_id=${sucursalId}` : '';
    return this.http.get<any[]>(`${this.base}/productosucursal${params}`);
  }

  updateConfig(productoId: number, data: { activo: boolean; permite_pedido_sin_stock: boolean }) {
    return this.http.put(`${this.base}/productosucursal/${productoId}`, data);
  }
}