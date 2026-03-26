import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  constructor(private http: HttpClient) {}

  getRoles() {
    return this.http.get(`${environment.apiUrl}/roles`);
  }

  createRoles(data: any) {
  return this.http.post(`${environment.apiUrl}/roles`, data);
  }

  updateRoles(id: number, data: any) {
  return this.http.put(`${environment.apiUrl}/roles/${id}`, data);
  }

  deleteRoles(id: number) {
  return this.http.delete(`${environment.apiUrl}/roles/${id}`);
  }
}