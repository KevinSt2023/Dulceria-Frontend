import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SeguimientoService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCola() {
    return this.http.get<any[]>(`${this.base}/seguimiento`);
  }

  // Reutiliza el endpoint existente — no duplicamos lógica
  cambiarEstado(pedidoId: number, estadoId: number) {
    return this.http.put(
      `${this.base}/pedidos/${pedidoId}/estado`,
      estadoId,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}