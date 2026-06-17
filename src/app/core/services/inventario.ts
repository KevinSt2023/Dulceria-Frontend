import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class InventarioService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getInventario() {
    return this.http.get(`${environment.apiUrl}/inventario`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createMovimiento(data: any) {
    return this.http.post(`${environment.apiUrl}/inventario`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateConfig(data: any) {
    return this.http.put(`${environment.apiUrl}/inventario/configuracion`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getKardex(producto_id: number, almacen_id?: number) {
    let url = `${environment.apiUrl}/inventario/kardex?producto_id=${producto_id}`;
    if (almacen_id) {
      url += `&almacen_id=${almacen_id}`;
    }
    return this.http.get(url).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getKardexFiltrado(producto_id: number, almacen_id: number, inicio?: string, fin?: string) {
    let url = `${environment.apiUrl}/inventario/kardex?producto_id=${producto_id}&almacen_id=${almacen_id}`;
    if (inicio) url += `&inicio=${inicio}T00:00:00`;
    if (fin) url += `&fin=${fin}T23:59:59`;
    return this.http.get(url).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
