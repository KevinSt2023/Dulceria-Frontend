import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class UsuariosService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getUsuarios() {
    return this.http.get(`${environment.apiUrl}/usuarios`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createUsuarios(data: any) {
    return this.http.post(`${environment.apiUrl}/usuarios`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateUsuarios(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/usuarios/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteUsuarios(id: number) {
    return this.http.delete(`${environment.apiUrl}/usuarios/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
