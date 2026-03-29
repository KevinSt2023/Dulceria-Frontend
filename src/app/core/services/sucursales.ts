import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {

  constructor(private http: HttpClient) {}

  getSucursales() {
    return this.http.get(`${environment.apiUrl}/Sucursales`);
  }

  createSucursales(data: any) {
  return this.http.post(`${environment.apiUrl}/Sucursales`, data);
  }

  updateSucursales(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/Sucursales/${id}`, data);
  }

  deleteSucursales(id: number) {
  return this.http.delete(`${environment.apiUrl}/Sucursales/${id}`);
  }
}