# DulcesERP — CLAUDE.md

> Archivo de contexto para Claude Code y Antigravity.
> Coloca este archivo en la raíz de CADA proyecto (Frontend y Backend).
> Actualízalo cuando agregues módulos o cambies convenciones.

---

## 1. Descripción del proyecto

**DulcesERP** es un sistema ERP completo para dulcerías y confiterías en Perú.
Gestiona ventas (POS + comprobantes SUNAT), inventario, pedidos, productos,
sucursales y configuración del negocio.

**Objetivo de negocio:** reemplazar procesos manuales en papel por un sistema
digital confiable, rápido y adaptado a la normativa tributaria peruana (SUNAT).

---

## 2. Arquitectura general

```
DulcesERP/
├── DulcesERP_Frontend/     ← Angular 17+ (este repo)
│   └── src/app/
│       ├── core/           ← guards, interceptors, servicios globales
│       └── features/       ← módulos de negocio (uno por feature)
│           ├── almacenes/
│           ├── auth/
│           ├── catalogos/
│           ├── categorias/
│           ├── clientes/
│           ├── comprobantes/
│           ├── configuracion-negocio/
│           ├── configuracion-pago/
│           ├── dashboard/
│           ├── distribucion/
│           ├── home/
│           ├── inventario/
│           ├── pedidos/
│           ├── pos/
│           ├── producto-sucursal/
│           ├── productos/
│           ├── roles/
│           ├── seguimiento/
│           ├── sucursales/
│           ├── superadmin/
│           └── tipos_productos/
│
└── DulcesERP_Backend/      ← .NET 8 Clean Architecture
    ├── DulcesERP.API/          ← Controllers, DTOs, Program.cs
    ├── DulcesERP.Application/  ← Services, interfaces
    ├── DulcesERP.Domain/       ← Entidades, enums, value objects
    └── DulcesERP.Infrastructure/ ← DbContext, repositorios, EF Core
```

**Principio clave:** nunca saltarse capas. Los Controllers llaman a Services
(Application), los Services usan el Domain, la Infrastructure implementa
repositorios definidos en Application.

---

## 3. Stack tecnológico

### Frontend
| Tech | Versión | Notas |
|------|---------|-------|
| Angular | 17+ | Standalone components obligatorio |
| TypeScript | 5+ | Strict mode activado |
| Tailwind CSS | 3.x | Utility-first, sin CSS custom salvo excepciones |
| RxJS | 7+ | Observables para HTTP, evitar Promise salvo casos puntuales |
| Angular Router | — | Lazy loading en todos los módulos de features |

### Backend
| Tech | Versión | Notas |
|------|---------|-------|
| .NET | 8 | Web API minimal |
| C# | 12 | Nullable reference types activado |
| Entity Framework Core | 8 | Code-first, migrations versionadas |
| SQL Server | 2019+ | Base de datos principal |
| AutoMapper | — | Para mapeo Entity ↔ DTO |

---

## 4. Convenciones de código

### General
- **Código siempre en inglés** (nombres de variables, métodos, clases, archivos).
- **Comentarios de dominio en español** cuando el concepto es específico del
  negocio peruano (ej: `// Serie del comprobante según SUNAT`).
- **Nunca** instalar dependencias npm o NuGet sin mencionarlo explícitamente
  en la respuesta antes de hacerlo.

### Angular / TypeScript
```typescript
// Componentes: siempre standalone
@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-componente.component.html',
})
export class MiComponenteComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Servicios HTTP: siempre tipados, siempre catchError
getComprobantes(): Observable<ComprobanteDTO[]> {
  return this.http.get<ComprobanteDTO[]>(`${this.apiUrl}/comprobantes`).pipe(
    catchError(this.handleError)
  );
}

// Interfaces: prefijo I solo para interfaces de repositorio/servicio
interface ComprobanteDTO {
  id: number;
  serie: string;           // ej: "B001"
  numero: string;          // ej: "00000001"
  tipoComprobante: string; // "01" factura, "03" boleta
  rucEmisor: string;
  totalImporte: number;    // en PEN
  igv: number;             // 18% en Perú
}
```

### C# / .NET
```csharp
// Controllers: delgados, sin lógica de negocio
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateComprobanteDTO dto)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var resultado = await _comprobanteService.CreateAsync(dto);
    return Ok(resultado);
}

// Services en Application: toda la lógica aquí
public async Task<ComprobanteDTO> CreateAsync(CreateComprobanteDTO dto)
{
    // validar, mapear, persistir, retornar
}

// Entidades en Domain: sin referencias a EF ni a DTOs
public class Comprobante
{
    public int Id { get; private set; }
    public string Serie { get; private set; } = string.Empty;
    public string Numero { get; private set; } = string.Empty;
    // constructor con validaciones de dominio
}

// DTOs en API/DTOs: separados por módulo, nunca reutilizar entre features
public record CreateComprobanteDTO(
    string Serie,
    string Numero,
    string TipoComprobante,
    decimal TotalImporte
);
```

---

## 5. Módulos de negocio — contexto detallado

### 5.1 Comprobantes (módulo crítico)
Genera boletas (tipo 03) y facturas (tipo 01) según normativa SUNAT.

**Campos clave:**
- `serie`: formato B001 (boleta) o F001 (factura)
- `numero`: correlativo de 8 dígitos con padding ceros (`00000001`)
- `ruc_emisor`: RUC del negocio (11 dígitos)
- `ruc_receptor` o `dni_receptor`: según tipo de comprobante
- `igv`: siempre 18% del subtotal
- `pie_comprobante`: texto personalizable (ej: "Gracias por su compra")
- `estado`: EMITIDO | ANULADO | PENDIENTE

**Reglas de negocio:**
- Una factura REQUIERE RUC del receptor (no acepta DNI).
- Una boleta acepta DNI o sin documento (consumidor final).
- El número correlativo no puede repetirse por serie.
- Un comprobante ANULADO no puede modificarse.

**Integración SUNAT:** los campos `tipo_comprobante`, `serie` y `numero`
deben seguir exactamente el formato del Reglamento de Comprobantes de Pago.

---

### 5.2 POS (Punto de Venta)
Pantalla principal de venta rápida para caja física.

**Flujo:**
1. Cajero selecciona productos (búsqueda por nombre o código).
2. Agrega al carrito con cantidad y precio unitario.
3. Selecciona tipo de comprobante (boleta/factura).
4. Ingresa datos del cliente (DNI/RUC).
5. Selecciona método de pago (efectivo, tarjeta, transferencia).
6. Confirma venta → genera comprobante + descuenta inventario.

**Consideraciones UI:**
- Diseñado para uso táctil (tableta en mostrador).
- Teclado numérico virtual para cantidades.
- Debe funcionar con conexión inestable (caché local temporal).

---

### 5.3 Pedidos
Gestión de pedidos a proveedores y pedidos internos entre sucursales.

**Estados:** BORRADOR → PENDIENTE → APROBADO → EN_PROCESO → COMPLETADO | CANCELADO

**Campos importantes:**
- `tipo_pedido`: PROVEEDOR | INTERNO
- `sucursal_origen` y `sucursal_destino` (para pedidos internos)
- `fecha_entrega_esperada`: fecha estimada de recepción
- `items`: lista de productos con cantidad y precio acordado

---

### 5.4 Inventario
Control de stock por producto y por sucursal.

**Reglas:**
- El stock se actualiza automáticamente al confirmar una venta (POS).
- El stock se actualiza al completar un pedido.
- Nunca permitir stock negativo (validar antes de confirmar venta).
- Alertas de stock mínimo configurables por producto.

**Movimientos:** ENTRADA | SALIDA | AJUSTE | TRANSFERENCIA

---

### 5.5 Configuracion-negocio
Datos maestros del negocio que aparecen en los comprobantes.

**Campos:**
- `razon_social`, `nombre_comercial`
- `ruc` (11 dígitos, validar con algoritmo módulo 11)
- `direccion`, `telefono`, `email`
- `moneda` (default: "PEN"), `simbolo` (default: "S/")
- `logo_base64`: imagen en base64, max 500KB, PNG o JPG
- `pie_comprobante`: texto libre
- `facturacion_electronica`: boolean

---

### 5.6 Auth
Autenticación y autorización basada en roles.

**Roles:** SUPERADMIN | ADMIN | CAJERO | ALMACENERO | VENDEDOR

**Tokens:** JWT con refresh token. El interceptor de Angular adjunta
el Bearer token automáticamente a todas las peticiones al API.

**Guards:** `AuthGuard` para rutas protegidas, `RoleGuard` para rutas
que requieren rol específico.

---

### 5.7 Productos
Catálogo de productos del negocio.

**Campos clave:**
- `codigo`: código único (puede ser código de barras)
- `nombre`, `descripcion`
- `categoria_id`, `tipo_producto_id`
- `precio_venta`: en PEN
- `precio_compra`: en PEN
- `unidad_medida`: KG | GR | UN | LT | ML | CAJA | PAQUETE
- `imagen_url`
- `activo`: boolean

---

### 5.8 Sucursales
Gestión de múltiples locales del negocio.

**Cada sucursal tiene:**
- Stock propio (tabla `producto_sucursal`)
- Caja propia (para el POS)
- Personal asignado

---

## 6. Variables de entorno

### Frontend (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',  // cambiar en producción
  appName: 'DulcesERP',
  version: '1.0.0',
  moneda: 'PEN',
  simboloMoneda: 'S/',
  igv: 0.18,
};
```

### Backend (`appsettings.json` — nunca hardcodear en código)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=DulcesERP;..."
  },
  "Jwt": {
    "Key": "...",
    "Issuer": "DulcesERP",
    "Audience": "DulcesERP"
  }
}
```

---

## 7. Patrones de comunicación Angular ↔ API

### Estructura de carpetas por feature (Angular)
```
features/comprobantes/
├── comprobantes.component.ts
├── comprobantes.component.html
├── comprobantes.routes.ts
├── models/
│   └── comprobante.model.ts     ← interfaces TypeScript
├── services/
│   └── comprobantes.service.ts  ← HttpClient calls
└── components/
    ├── lista-comprobantes/
    └── detalle-comprobante/
```

### Estructura de carpetas por feature (Backend)
```
API/Controllers/
└── ComprobantesController.cs

API/DTOs/Comprobantes/
├── CreateComprobanteDTO.cs
├── UpdateComprobanteDTO.cs
└── ComprobanteResponseDTO.cs

Application/Services/
└── ComprobanteService.cs

Application/Interfaces/
└── IComprobanteService.cs

Domain/Entities/
└── Comprobante.cs
```

---

## 8. Convenciones de commits

```
feat(comprobantes): agregar generación de boleta electrónica
fix(pos): corregir cálculo de IGV cuando precio incluye impuesto
refactor(inventario): extraer lógica de stock mínimo a service
chore(deps): actualizar Angular a 17.3
docs(auth): documentar flujo de refresh token
```

---

## 9. Checklist antes de dar una tarea por completada

### Frontend
- [ ] El componente es standalone y usa imports correctos
- [ ] El servicio tiene tipado fuerte y catchError en todos los HTTP calls
- [ ] La ruta usa lazy loading
- [ ] Los formularios reactivos tienen validaciones en el template
- [ ] No hay `console.log` de debug en el código final
- [ ] El componente se destruye limpiamente (unsubscribe con takeUntil)

### Backend
- [ ] El controller solo llama al service, sin lógica propia
- [ ] El endpoint tiene su DTO separado (no usa la entidad directamente)
- [ ] El método es `async Task<IActionResult>`
- [ ] Hay validación de ModelState o FluentValidation
- [ ] Los cambios en BD usan `SaveChangesAsync()`
- [ ] No hay strings de conexión ni secrets en el código

---

## 10. Lo que NUNCA hacer en este proyecto

- Usar `any` en TypeScript (usa tipos explícitos o `unknown`)
- Poner lógica de negocio en los Controllers de C#
- Modificar directamente la tabla de migraciones EF Core
- Hardcodear URLs del API en los componentes (usar `environment.apiUrl`)
- Reutilizar un DTO de un módulo en otro módulo diferente
- Hacer llamadas HTTP directamente desde un componente (siempre via service)
- Permitir stock negativo sin validación explícita
- Emitir un comprobante sin validar el RUC/DNI según tipo