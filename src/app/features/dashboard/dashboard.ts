import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductosService } from '../../core/services/productos';
import { UsuariosService } from '../../core/services/usuarios';
import { CategoriasService } from '../../core/services/categorias';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2 class="text-xl font-bold mb-6">📊 Dashboard</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div class="bg-white p-6 rounded-xl shadow">
        <p class="text-gray-500 text-sm">Productos</p>
        <h2 class="text-2xl font-bold">{{ totalProductos }}</h2>
      </div>

      <div class="bg-white p-6 rounded-xl shadow">
        <p class="text-gray-500 text-sm">Usuarios</p>
        <h2 class="text-2xl font-bold">{{ totalUsuarios }}</h2>
      </div>

      <div class="bg-white p-6 rounded-xl shadow">
        <p class="text-gray-500 text-sm">Categorías</p>
        <h2 class="text-2xl font-bold">{{ totalCategorias }}</h2>
      </div>

    </div>

    <div class="mt-8 flex gap-4">
      <a routerLink="/app/productos" class="bg-blue-500 text-white px-4 py-2 rounded">
        ➕ Producto
      </a>

      <a routerLink="/app/usuarios" class="bg-green-500 text-white px-4 py-2 rounded">
        ➕ Usuario
      </a>
    </div>
  `
})
export class DashboardComponent implements OnInit {

  totalProductos = 0;
  totalUsuarios = 0;
  totalCategorias = 0;

  constructor(
    private productosService: ProductosService,
    private usuariosService: UsuariosService,
    private categoriasService: CategoriasService,
    private cd: ChangeDetectorRef // ✅ AQUÍ ESTÁ LA CLAVE
  ) {}

  ngOnInit(): void {
    this.cargarTotales();
  }

  cargarTotales() {
    forkJoin({
      productos: this.productosService.getProductos(),
      usuarios: this.usuariosService.getUsuarios(),
      categorias: this.categoriasService.getCategorias()
    }).subscribe(res => {
      this.totalProductos = (res.productos as any[]).length;
      this.totalUsuarios = (res.usuarios as any[]).length;
      this.totalCategorias = (res.categorias as any[]).length;

      this.cd.detectChanges(); // ✅ ahora sí existe
    });
  }
}
