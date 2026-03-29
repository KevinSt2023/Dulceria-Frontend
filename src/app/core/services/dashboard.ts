import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private http: HttpClient) {}

  getDashboard() {
    return this.http.get(`${environment.apiUrl}/dashboard`);
  }

  createDashboard(data: any) {
  return this.http.post(`${environment.apiUrl}/dashboard`, data);
  }

  updateDashboard(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/dashboard/${id}`, data);
  }

  deleteDashboard(id: number) {
  return this.http.delete(`${environment.apiUrl}/dashboard/${id}`);
  }  
}