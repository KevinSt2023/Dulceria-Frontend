import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class UbigeoService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getDepartamentos() {
    return this.http.get<any[]>(`${environment.apiUrl}/ubigeo/departamentos`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getProvincias(departamentoId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/ubigeo/provincias/${departamentoId}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getDistritos(provinciaId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/ubigeo/distritos/${provinciaId}`).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
