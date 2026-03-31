# Tu Profesional — CLAUDE.md

> Instrucciones de proyecto para Claude. Este archivo es leído automáticamente
> en cada sesión de Claude Code. Actualizarlo cuando cambie el estado del proyecto.

---

## Qué es este proyecto

Marketplace React Native que conecta usuarios con profesionales de salud mental
en Argentina. Dos experiencias distintas: usuario final (busca psicólogos) y
profesional (gestiona su perfil, paga suscripción).

**Estado actual**: Fase de planificación frontend. Ningún componente implementado.
**Próximo paso**: Sprint 0 — implementar `src/shared/theme/`.

---

## Stack

```
Frontend:   React Native + Expo Dev Client + Expo Router + TypeScript
Backend:    Supabase (Auth, PostgreSQL, Storage)
Geo:        PostGIS en Supabase
Pagos:      Mercado Pago Preapproval (suscripciones del profesional)
Serverless: Supabase Edge Functions
```

---

## Estructura del proyecto

```
src/
├── shared/
│   ├── theme/          ← tokens de design system
│   ├── components/     ← UI compartida entre features
│   └── utils/          ← avatarColor, strings (copy), format
└── features/
    ├── auth/
    ├── professionals/
    ├── search/
    ├── profile/
    └── professional-setup/
app/                    ← solo rutas Expo Router, sin lógica
```

---

## Reglas de arquitectura

1. **Service → Hook → Screen**: service es función pura (sin React), hook
   orquesta estado, screen es silly view (solo renderiza).

2. **PostGIS siempre en servidor**: geolocalización nunca se filtra en cliente.

3. **Edge Functions para secrets**: webhooks de MP, activación de suscripciones,
   emails transaccionales.

4. **Path alias `@/`**: `import { colors } from '@/shared/theme'` — nunca
   imports relativos con `../../`.

5. **OTP = 6 dígitos**: Supabase Auth. El mock de Stitch mostraba 4 — incorrecto.

---

## Design System — tokens decididos

Los tokens están documentados en detalle en la skill `tu-profesional-rn`.
Resumen rápido:

- **Fondo de pantallas**: `#F7F5F2` (sand-50, warm neutral)
- **CTA primario**: `#2E6CC8` (blue-500)
- **Acento**: `#2CA89E` (jade-500 — disponibilidad, confirmación)
- **Texto principal**: `#27231C` (sand-900)
- **Fuentes**: Bricolage Grotesque (headings) + DM Sans (body)
- **Botones**: siempre pill (`borderRadius: 9999`)
- **Cards**: `borderRadius: 16`

---

## Dos clientes — distinción crítica

|          | Usuario final         | Profesional      |
| -------- | --------------------- | ---------------- |
| Paga     | No                    | Sí (USD 10/mes)  |
| UI       | Emocional, cálida     | Funcional, densa |
| KPI      | Tiempo hasta contacto | Churn mensual    |
| Contacto | WhatsApp deeplink     | —                |

---

## Estado del código

### ✅ Decidido y documentado (no implementado)

- Design system tokens completos
- Inventario de componentes con props
- Arquitectura feature-based
- Copy en español rioplatense (`strings.ts`)
- Convenciones de naming

### 🔄 En progreso

- Nada todavía

### ❌ Pendiente

- Sprint 0: `src/shared/theme/` (todos los archivos de tokens)
- Sprint 1: Componentes primitivos (Avatar, Badge, Button, Input, OTP, FilterChip, IconButton)
- Sprint 2: Componentes de layout (AppHeader, ScreenTitle, StickyBottomBar, etc.)
- Sprint 3: Componentes de dominio (ProfessionalCard, SkeletonCard, etc.)
- Sprint 4: Screens (auth, user, professional)

---

## Comandos útiles

```bash
# Desarrollo
npx expo start --dev-client

# Generar tipos de Supabase (cuando haya schema)
supabase gen types typescript --local > src/shared/types/database.ts

# Build con EAS
eas build --platform ios --profile development
eas build --platform android --profile development
```

---

## Invariantes de code review

Estos 10 puntos se verifican en cada PR:

1. Todo color referencia `colors.*` — nunca hex hardcodeado
2. Todo spacing usa `spacing[N]` o `grid(N)` — nunca literal
3. Todo borderRadius usa `componentRadius.*` — nunca literal
4. Sombras siempre con `getShadow()` — nunca `shadowColor` hardcodeado
5. Copy siempre en `strings.*` con `interpolate()` — nunca literal en JSX
6. Todo elemento tappable tiene `minHeight: 44` (Apple HIG)
7. Listas asíncronas muestran `Skeleton` mientras `isLoading`
8. `Avatar` siempre recibe `imageUrl` cuando está disponible
9. `OTPInput` siempre 6 dígitos
10. `Button` siempre `borderRadius: radius.full` (pill)

---

## Cómo actualizar este archivo

- Cuando se implementa un componente: marcar en "Estado del código"
- Cuando cambia una decisión de arquitectura: actualizar la sección relevante
- Cuando se agrega una dependencia nueva: agregar en Stack
- **No** agregar código aquí — este archivo es descripción, no implementación

Última actualización: Pre-implementación, Sprint 0 pendiente.
