import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class PlanesService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getPlanes() {
    return this.http.get(`${environment.apiUrl}/planes`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getTenants() {
    return this.http.get(`${environment.apiUrl}/planes/tenants`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getMiPlan() {
    return this.http.get(`${environment.apiUrl}/planes/mi-plan`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  cambiarPlan(tenantId: number, data: any) {
    return this.http.put(`${environment.apiUrl}/planes/tenants/${tenantId}/plan`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
