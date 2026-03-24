import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  
  constructor(private http: HttpClient) {}

  getProductos() {
    return this.http.get(`${environment.apiUrl}/productos`);
  }

  createProducto(data: any) {
  return this.http.post(`${environment.apiUrl}/productos`, data);
  }

  updateProducto(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/productos/${id}`, data);
  }

  deleteProducto(id: number) {
  return this.http.delete(`${environment.apiUrl}/productos/${id}`);
  }
}