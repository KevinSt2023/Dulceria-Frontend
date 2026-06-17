import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of} from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class SuperAdminService extends BaseService {

  private base = `${environment.apiUrl}/superadmin`;

  constructor(private http: HttpClient) { super(); }

  getEmpresas() {
    return this.http.get<any[]>(`${this.base}/empresas`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getEmpresa(tenantId: number) {
    return this.http.get<any>(`${this.base}/empresas/${tenantId}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  crearEmpresa(data: any) {
    return this.http.post<any>(`${this.base}/empresas`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  actualizarEmpresa(tenantId: number, data: any) {
    return this.http.put<any>(`${this.base}/empresas/${tenantId}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  actualizarConfig(tenantId: number, data: any) {
    return this.http.put<any>(`${this.base}/empresas/${tenantId}/config`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  toggleEmpresa(tenantId: number) {
    return this.http.put<any>(`${this.base}/empresas/${tenantId}/toggle`, {}).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getPlanes() {
    return this.http.get<any[]>(`${this.base}/planes`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getLogoEmpresa(tenantId: number) {
  return this.http.get<any>(`${this.base}/empresas/${tenantId}/logo`).pipe(
    catchError(err => {
      // No es error fatal — la empresa simplemente no tiene logo
      if (err.status === 404) return of(null);
      return this.handleError(err);
    })
  );
}
}