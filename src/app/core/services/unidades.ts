import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class UnidadesService {

  constructor(private http: HttpClient) {}

  getUnidades() {
    return this.http.get(`${environment.apiUrl}/UnidadesMedida`);
  }

  createunidades(data: any) {
  return this.http.post(`${environment.apiUrl}/UnidadesMedida`, data);
  }

  updateunidades(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/UnidadesMedida/${id}`, data);
  }

  deleteunidades(id: number) {
  return this.http.delete(`${environment.apiUrl}/UnidadesMedida/${id}`);
  }
}