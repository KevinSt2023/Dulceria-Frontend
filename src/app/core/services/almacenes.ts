import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class AlmacenesService extends BaseService {

  constructor(private http: HttpClient) { super(); }

  getAlmacenes() {
    return this.http.get(`${environment.apiUrl}/almacenes`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  createAlmacenes(data: any) {
    return this.http.post(`${environment.apiUrl}/almacenes`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateAlmacenes(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/almacenes/${id}`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
