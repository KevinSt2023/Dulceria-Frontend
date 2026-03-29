import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlmacenesService {

  constructor(private http: HttpClient) {}

  getAlmacenes() {
    return this.http.get(`${environment.apiUrl}/almacenes`);
  }

  createAlmacenes(data: any) {
  return this.http.post(`${environment.apiUrl}/almacenes`, data);
  }

  updateAlmacenes(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/almacenes/${id}`, data);
  }  
}