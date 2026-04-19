import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfiguracionPagoService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getConfig() {
    return this.http.get<any[]>(`${this.base}/configuracionpago`);
  }

  getQR(tipo: string) {
    return this.http.get<any>(`${this.base}/configuracionpago/${tipo}/qr`);
  }

  updateConfig(tipo: string, data: any) {
    return this.http.put(`${this.base}/configuracionpago/${tipo}`, data);
  }
}