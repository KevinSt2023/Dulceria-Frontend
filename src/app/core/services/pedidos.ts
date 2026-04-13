import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PedidosService {

  constructor(private http: HttpClient) {}

  getPedidos() {
    return this.http.get(`${environment.apiUrl}/pedidos`);
  }

  getPedido(id: number) {
    return this.http.get(`${environment.apiUrl}/pedidos/${id}`);
  }

  createPedido(data: any) {
    return this.http.post(`${environment.apiUrl}/pedidos`, data);
  }

  cambiarEstado(id: number, estado_id: number) {
    return this.http.put(`${environment.apiUrl}/pedidos/${id}/estado`, estado_id);
  }

  cancelarPedido(id: number) {
    return this.http.put(`${environment.apiUrl}/pedidos/${id}/cancelar`, {});
  }
}
