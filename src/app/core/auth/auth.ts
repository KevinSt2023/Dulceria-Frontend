import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TokenClaims {
  usuario_id:  number;
  tenant_id:   number;
  sucursal_id: number;
  rol_id:      number;
  email:       string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = environment.apiUrl;

  private readonly ROLES: Record<number, string> = {
    0: 'SuperAdmin',
    1: 'Administrador',
    2: 'Vendedor',
    3: 'Produccion',
    4: 'Cajero',
    5: 'Distribuidor'
  };

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.API}/auth/login`, { email, password })
      .pipe(tap(res => localStorage.setItem('token', res.token)));
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  private decodeToken(): TokenClaims | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        usuario_id:  Number(decoded['usuario_id']),
        tenant_id:   Number(decoded['tenant_id']),
        sucursal_id: Number(decoded['sucursal_id']),
        rol_id:      Number(decoded['rol_id']),
        email:       decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
                     ?? decoded['email'] ?? ''
      };
    } catch {
      return null;
    }
  }

  getToken():      string | null      { return localStorage.getItem('token'); }
  isLoggedIn():    boolean            { return !!this.getToken(); }
  getClaims():     TokenClaims | null { return this.decodeToken(); }
  getSucursalId(): number             { return this.decodeToken()?.sucursal_id ?? 0; }
  getTenantId():   number             { return this.decodeToken()?.tenant_id   ?? 0; }

  // ── getRolId devuelve -1 si no hay token para no colisionar con ningún rol real ──
  getRolId(): number {
    const claims = this.decodeToken();
    if (!claims) return -1;
    return claims.rol_id;
  }

  getRolNombre(): string { return this.ROLES[this.getRolId()] ?? 'Desconocido'; }

  // ── Helpers de rol ──
  isSuperAdmin():   boolean { return this.getRolId() === 0; }
  isAdmin():        boolean { return this.getRolId() === 1; }
  isVendedor():     boolean { return this.getRolId() === 2; }
  isProduccion():   boolean { return this.getRolId() === 3; }
  isCajero():       boolean { return this.getRolId() === 4; }
  isDistribuidor(): boolean { return this.getRolId() === 5; }

  // ── Shortcut: SuperAdmin o Admin de sucursal ──
  isAdminOrSuper(): boolean { return this.isSuperAdmin() || this.isAdmin(); }
}
