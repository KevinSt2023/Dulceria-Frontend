import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class TiposProductosService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getTipos() {
    return this.http.get(`${environment.apiUrl}/TiposProducto`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createTipos(data: any) {
    return this.http.post(`${environment.apiUrl}/TiposProducto`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateTipos(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/TiposProducto/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteTipos(id: number) {
    return this.http.delete(`${environment.apiUrl}/TiposProducto/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
