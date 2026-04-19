// src/app/core/services/color.service.ts

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ColorService {

  private readonly SUCURSAL_COLORES = [
  'bg-sky-400 text-white',        // azul cielo
  'bg-blue-500 text-white',       // azul estándar
  'bg-cyan-500 text-white',       // cyan SophiTech
  'bg-indigo-500 text-white',     // índigo
  'bg-blue-600 text-white',       // azul medio oscuro
  'bg-sky-600 text-white',        // cielo oscuro
  'bg-cyan-600 text-white',       // cyan oscuro
  'bg-indigo-700 text-white',     // índigo profundo
];

  // Color determinista por sucursal_id — siempre el mismo
  getSucursalClasePorId(sucursalId: number): string {
    if (!sucursalId && sucursalId !== 0) return 'bg-gray-100 text-gray-500';
    return this.SUCURSAL_COLORES[sucursalId % this.SUCURSAL_COLORES.length];
  }

  // Mantener por nombre como fallback para componentes que no tienen el id
  getSucursalClase(nombre: string): string {
    if (!nombre) return 'bg-gray-100 text-gray-500';
    // Hash simple del nombre para consistencia
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % this.SUCURSAL_COLORES.length;
    return this.SUCURSAL_COLORES[idx];
  }

  getRolClase(rolId: number): string {
    const m: Record<number, string> = {
      0: 'bg-red-100 text-red-700',
      1: 'bg-indigo-100 text-indigo-700',
      2: 'bg-green-100 text-green-700',
      3: 'bg-purple-100 text-purple-700',
      4: 'bg-yellow-100 text-yellow-700',
      5: 'bg-orange-100 text-orange-700'
    };
    return m[rolId] ?? 'bg-gray-100 text-gray-600';
  }

  getEstadoClase(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE':      'bg-yellow-100 text-yellow-800',
      'CONFIRMADO':     'bg-blue-100 text-blue-800',
      'EN_PREPARACION': 'bg-purple-100 text-purple-800',
      'LISTO':          'bg-green-100 text-green-800',
      'ENTREGADO':      'bg-gray-200 text-gray-700',
      'CANCELADO':      'bg-red-100 text-red-700'
    };
    return m[estado] ?? 'bg-gray-100 text-gray-600';
  }

  getTipoPedidoClase(tipo: string): string {
    return tipo === 'DELIVERY'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-blue-100 text-blue-700';
  }
}