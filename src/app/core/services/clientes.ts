import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class ClientesService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getClientes() {
    return this.http.get(`${environment.apiUrl}/cliente`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createClientes(data: any) {
    return this.http.post(`${environment.apiUrl}/cliente`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateClientes(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/cliente/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getClienteDNI(documento: string) {
    return this.http.get(`${environment.apiUrl}/cliente/buscar?documento=${documento}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  consultarDNI(dni: string) {
    return this.http.get<any>(
      `${environment.apiUrl}/cliente/consultar-dni/${dni}`
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }

  consultarRUC(ruc: string) {
    return this.http.get<any>(
      `${environment.apiUrl}/cliente/consultar-ruc/${ruc}`
    ).pipe(
      catchError(err => this.handleError(err))
    );
  }

  crearClienteRapido(data: any) {
    return this.http.post<any>(`${environment.apiUrl}/cliente`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
