import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TokenClaims {
  usuario_id:      number;
  tenant_id:       number;
  sucursal_id:     number;
  sucursal_nombre: string;  // ← nuevo
  rol_id:          number;
  rol_nombre:      string;  // ← nuevo
  email:           string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(
      `${this.API}/auth/login`, { email, password }
    ).pipe(tap(res => localStorage.setItem('token', res.token)));
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  private decodeToken(): TokenClaims | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return {
        usuario_id:      Number(decoded['usuario_id']),
        tenant_id:       Number(decoded['tenant_id']),
        sucursal_id:     Number(decoded['sucursal_id']),
        sucursal_nombre: decoded['sucursal_nombre'] ?? '',  // ← nuevo
        rol_id:          Number(decoded['rol_id']),
        rol_nombre:      decoded['rol_nombre'] ?? '',       // ← nuevo
        email:           decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
                         ?? decoded['email'] ?? ''
      };
    } catch {
      return null;
    }
  }

  getToken():           string | null      { return localStorage.getItem('token'); }
  isLoggedIn():         boolean            { return !!this.getToken(); }
  getClaims():          TokenClaims | null { return this.decodeToken(); }
  getSucursalId():      number             { return this.decodeToken()?.sucursal_id     ?? 0;  }
  getSucursalNombre():  string             { return this.decodeToken()?.sucursal_nombre ?? ''; } // ← nuevo
  getTenantId():        number             { return this.decodeToken()?.tenant_id       ?? 0;  }

  getRolId(): number {
    const claims = this.decodeToken();
    if (!claims) return -1;
    return claims.rol_id;
  }

  // Ahora viene del JWT — no del diccionario hardcodeado
  getRolNombre(): string {
    return this.decodeToken()?.rol_nombre ?? 'Desconocido';
  }

  // ── Helpers de rol ──
  isSuperAdmin():   boolean { return this.getRolId() === 0; }
  isAdmin():        boolean { return this.getRolId() === 1; }
  isVendedor():     boolean { return this.getRolId() === 2; }
  isProduccion():   boolean { return this.getRolId() === 3; }
  isCajero():       boolean { return this.getRolId() === 4; }
  isDistribuidor(): boolean { return this.getRolId() === 5; }
  isAdminOrSuper(): boolean { return this.isSuperAdmin() || this.isAdmin(); }
}