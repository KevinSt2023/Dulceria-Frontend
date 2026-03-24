import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Dashboard</h2>
    <p>Bienvenido al sistema DulcesERP 🍰</p>

    <div style="margin-top:20px;">
      <div style="padding:20px; border:1px solid #ccc; margin-bottom:10px;">
        📦 Inventario
      </div>

      <div style="padding:20px; border:1px solid #ccc;">
        ⚙️ Configuración
      </div>
    </div>
  `
})
export class HomeComponent {}