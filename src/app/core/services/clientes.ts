import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientesService {

  constructor(private http: HttpClient) { }

  getClientes() {
    return this.http.get(`${environment.apiUrl}/cliente`);
  }

  createClientes(data: any) {
    return this.http.post(`${environment.apiUrl}/cliente`, data);
  }

  updateClientes(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/cliente/${id}`, data);
  }

  getClienteDNI(documento: string) {
    return this.http.get(`${environment.apiUrl}/cliente/buscar?documento=${documento}`);
  }
}