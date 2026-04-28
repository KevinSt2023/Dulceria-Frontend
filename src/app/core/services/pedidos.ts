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

  entregar(id: number, monto: number, metodo: string, tipoPago: string = 'CONTADO') {
    return this.http.put(`${environment.apiUrl}/pedidos/${id}/entregar`, {
      monto_cobrado: monto,
      metodo_pago:   metodo,
      tipo_pago:     tipoPago
    });
  }

  abonar(id: number, monto: number, metodo: string, observacion?: string) {
    return this.http.post(`${environment.apiUrl}/pedidos/${id}/abonar`, {
      monto,
      metodo_pago: metodo,
      observacion
    });
  }

  getAbonos(id: number) {
    return this.http.get(`${environment.apiUrl}/pedidos/${id}/abonos`);
  }

  getSucursalesPickup() {
    return this.http.get<any[]>(`${environment.apiUrl}/sucursales?todas=true`);
  }

  getCreditosPendientes() {
  return this.http.get(`${environment.apiUrl}/pedidos/creditos-pendientes`);
}
}