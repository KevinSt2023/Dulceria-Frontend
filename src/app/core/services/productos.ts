import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class ProductosService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getProductos() {
    return this.http.get(`${environment.apiUrl}/productos`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createProducto(data: any) {
    return this.http.post(`${environment.apiUrl}/productos`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateProducto(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/productos/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteProducto(id: number) {
    return this.http.delete(`${environment.apiUrl}/productos/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  buscarProducto(q: string) {
    return this.http.get<any[]>(
      `${environment.apiUrl}/productos/buscar?q=${encodeURIComponent(q)}`
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getProductosDisponibles() {
    return this.http.get<any[]>(
      `${environment.apiUrl}/productos/disponibles`
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
