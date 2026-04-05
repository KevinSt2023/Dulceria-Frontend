import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  constructor(private http: HttpClient) { }

  getInventario() {
    return this.http.get(`${environment.apiUrl}/inventario`);
  }

  createMovimiento(data: any) {
    return this.http.post(`${environment.apiUrl}/inventario`, data);
  }

  updateConfig(data: any) {
    return this.http.put(`${environment.apiUrl}/inventario/configuracion`, data);
  }

  getKardex(producto_id: number, almacen_id?: number) {
    let url = `${environment.apiUrl}/inventario/kardex?producto_id=${producto_id}`;
    if (almacen_id) {
      url += `&almacen_id=${almacen_id}`;
    }
    return this.http.get(url);
  }
  getKardexFiltrado(producto_id: number, almacen_id: number, inicio?: string, fin?: string) {
  let url = `${environment.apiUrl}/inventario/kardex?producto_id=${producto_id}&almacen_id=${almacen_id}`;

  if (inicio) url += `&inicio=${inicio}T00:00:00`;
  if (fin) url += `&fin=${fin}T23:59:59`;

  return this.http.get(url);
  }

}

