import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class ConfiguracionNegocioService extends BaseService {

  private base = `${environment.apiUrl}/configuracion-negocio`;

  constructor(private http: HttpClient) { super(); }

  getConfig() {
    return this.http.get<any>(this.base).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getLogo() {
    return this.http.get<any>(`${this.base}/logo`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateConfig(data: any) {
    return this.http.put<any>(this.base, data).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
