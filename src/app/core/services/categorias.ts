import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class CategoriasService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getCategorias() {
    return this.http.get(`${environment.apiUrl}/categorias`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createCategoria(data: any) {
    return this.http.post(`${environment.apiUrl}/categorias`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateCategoria(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/categorias/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteCategoria(id: number) {
    return this.http.delete(`${environment.apiUrl}/categorias/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  activarCategoria(id: number) {
    return this.http.put(`${environment.apiUrl}/categorias/activar/${id}`, {}).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
