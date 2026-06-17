import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class RolesService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getRoles() {
    return this.http.get(`${environment.apiUrl}/roles`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createRoles(data: any) {
    return this.http.post(`${environment.apiUrl}/roles`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateRoles(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/roles/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteRoles(id: number) {
    return this.http.delete(`${environment.apiUrl}/roles/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
