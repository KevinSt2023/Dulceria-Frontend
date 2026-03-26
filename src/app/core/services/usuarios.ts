import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuariosService {

  constructor(private http: HttpClient) {}

  getUsuarios() {
    return this.http.get(`${environment.apiUrl}/usuarios`);
  }

  createUsuarios(data: any) {
  return this.http.post(`${environment.apiUrl}/usuarios`, data);
  }

  updateUsuarios(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/usuarios/${id}`, data);
  }

  deleteUsuarios(id: number) {
  return this.http.delete(`${environment.apiUrl}/usuarios/${id}`);
  }

  //activarCategoria(id: number) {
  //return this.http.put(`${environment.apiUrl}/categorias/activar/${id}`, {});
  //}
}