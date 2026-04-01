import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventarioService {

  constructor(private http: HttpClient) {}

  getInventario() {
    return this.http.get(`${environment.apiUrl}/inventario`);
  }

  createMovimiento(data: any) {
    return this.http.post(`${environment.apiUrl}/inventario`, data);
  }

  updateConfig(data: any) {
  return this.http.put(`${environment.apiUrl}/inventario/configuracion`, data);
  }
}