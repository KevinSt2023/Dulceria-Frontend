import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfiguracionNegocioService {

  private base = `${environment.apiUrl}/configuracion-negocio`;

  constructor(private http: HttpClient) {}

  getConfig() {
    return this.http.get<any>(this.base);
  }

  getLogo() {
    return this.http.get<any>(`${this.base}/logo`);
  }

  updateConfig(data: any) {
    return this.http.put<any>(this.base, data);
  }
}