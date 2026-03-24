import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriasService {

  constructor(private http: HttpClient) {}

  getCategorias() {
    return this.http.get(`${environment.apiUrl}/categorias`);
  }

  createCategoria(data: any) {
  return this.http.post(`${environment.apiUrl}/categorias`, data);
  }

  updateCategoria(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/categorias/${id}`, data);
  }

  deleteCategoria(id: number) {
  return this.http.delete(`${environment.apiUrl}/categorias/${id}`);
  }

  activarCategoria(id: number) {
  return this.http.put(`${environment.apiUrl}/categorias/activar/${id}`, {});
}
}