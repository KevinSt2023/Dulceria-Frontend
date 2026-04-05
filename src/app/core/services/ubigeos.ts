import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UbigeoService {
  constructor(private http: HttpClient) {}

  getDepartamentos() {
    return this.http.get<any[]>(`${environment.apiUrl}/ubigeo/departamentos`);
  }

  getProvincias(departamentoId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/ubigeo/provincias/${departamentoId}`);
  }

  getDistritos(provinciaId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/ubigeo/distritos/${provinciaId}`);
  }
}