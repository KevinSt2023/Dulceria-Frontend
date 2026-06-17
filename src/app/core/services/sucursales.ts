import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class SucursalesService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getSucursales() {
    return this.http.get(`${environment.apiUrl}/Sucursales`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createSucursales(data: any) {
    return this.http.post(`${environment.apiUrl}/Sucursales`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateSucursales(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/Sucursales/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteSucursales(id: number) {
    return this.http.delete(`${environment.apiUrl}/Sucursales/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getSucursalesPickup() {
    // ?todas=true le dice al backend que devuelva todas sin filtrar por sucursal
    return this.http.get<any[]>(`${environment.apiUrl}/sucursales?todas=true`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
