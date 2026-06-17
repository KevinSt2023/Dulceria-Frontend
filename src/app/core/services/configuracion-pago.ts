import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class ConfiguracionPagoService extends BaseService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) { super(); }

  getConfig() {
    return this.http.get<any[]>(`${this.base}/configuracionpago`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getQR(tipo: string) {
    return this.http.get<any>(`${this.base}/configuracionpago/${tipo}/qr`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateConfig(tipo: string, data: any) {
    return this.http.put(`${this.base}/configuracionpago/${tipo}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
