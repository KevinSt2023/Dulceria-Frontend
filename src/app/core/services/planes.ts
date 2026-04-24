import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlanesService {

  constructor(private http: HttpClient) {}

  getPlanes() {
    return this.http.get(`${environment.apiUrl}/planes`);
  }

  getTenants() {
    return this.http.get(`${environment.apiUrl}/planes/tenants`);
  }

  getMiPlan() {
    return this.http.get(`${environment.apiUrl}/planes/mi-plan`);
  }

  cambiarPlan(tenantId: number, data: any) {
    return this.http.put(`${environment.apiUrl}/planes/tenants/${tenantId}/plan`, data);
  }
}