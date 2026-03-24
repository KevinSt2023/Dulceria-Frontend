import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class TiposProductosService {

  constructor(private http: HttpClient) {}

  getTipos() {
    return this.http.get(`${environment.apiUrl}/TiposProducto`);
  }

  createTipos(data: any) {
  return this.http.post(`${environment.apiUrl}/TiposProducto`, data);
  }

  updateTipos(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/TiposProducto/${id}`, data);
  }

  deleteTipos(id: number) {
  return this.http.delete(`${environment.apiUrl}/TiposProducto/${id}`);
  }
}