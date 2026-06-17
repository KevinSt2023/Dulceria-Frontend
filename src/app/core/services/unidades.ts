import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class UnidadesService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getUnidades() {
    return this.http.get(`${environment.apiUrl}/UnidadesMedida`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createunidades(data: any) {
    return this.http.post(`${environment.apiUrl}/UnidadesMedida`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateunidades(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/UnidadesMedida/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteunidades(id: number) {
    return this.http.delete(`${environment.apiUrl}/UnidadesMedida/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
