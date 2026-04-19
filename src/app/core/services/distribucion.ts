import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DistribucionService {

  constructor(private http: HttpClient) {}

  getPedidosListos() {
    return this.http.get(`${environment.apiUrl}/seguimiento`);
  }

  marcarEntregado(pedidoId: number) {
  return this.http.put(
    `${environment.apiUrl}/pedidos/${pedidoId}/estado`, 5  // ENTREGADO = 5 ✓
  );  
  }

  confirmarCobroYEntrega(pedidoId: number, monto: number, metodo: string) {
  return this.http.put(
    `${environment.apiUrl}/pedidos/${pedidoId}/entregar`,
    { monto_cobrado: monto, metodo_pago: metodo }
  );
  }
}