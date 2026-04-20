# Especificaciones Técnicas: CashFlow Imalá

**Versión:** 1.0
**Estado:** Documento de Requerimientos Final
**Tecnologías:** Next.js (PWA), Firebase (Auth & Firestore), Tailwind CSS.

---

## 1. Filosofía del Sistema
* **Control Manual Total:** El sistema no automatiza movimientos de dinero sin confirmación explícita.
* **Híbrido CRM/Cashflow:** Controla tanto las finanzas personales como el flujo de negocio de Imalá.
* **Mobile-First:** Optimizado para carga rápida en celulares, con estética minimalista y profesional.

---

## 2. Stack Tecnológico & Infraestructura
- **Framework:** Next.js 14+ (App Router).
- **Estilos:** Tailwind CSS (con soporte nativo para `dark mode`).
- **Base de Datos:** Firebase Firestore.
- **Autenticación:** Firebase Auth (Google Sign-In únicamente).
- **Hosting:** Firebase Hosting o Vercel (Configurado como PWA).

---

## 3. Arquitectura de Base de Datos (Firestore)

### Colección: `users`
- `uid`: string (ID de Google)
- `email`: string
- `displayName`: string
- `photoURL`: string
- `themePreference`: 'light' | 'dark' | 'system'
- `currencyBase`: 'ARS' | 'USD'

### Colección: `accounts`
- `id`: string
- `userId`: string (propietario)
- `name`: string (Ej: "Débito David", "Efectivo")
- `type`: 'bank' | 'cash' | 'credit_card' | 'investment'
- `balance`: number (actualizado tras transacciones)
- `currency`: 'ARS' | 'USD'

### Colección: `clients` (CRM Imalá)
- `id`: string
- `name`: string
- `razonSocial`: string
- `cuit`: string
- `billingType`: 'monthly_fee' | 'one_shot'
- `budget`: number
- `currency`: 'ARS' | 'USD'
- `billTo`: 'David' | 'Lucre'
- `defaultTargetAccount`: string (ID de cuenta)

### Colección: `transactions`
- `id`: string
- `userId`: string
- `clientId`: string (opcional, para ingresos)
- `type`: 'income' | 'expense' | 'transfer' | 'investment'
- `category`: string (Marketing, Alimentos, etc.)
- `amount`: number
- `currency`: 'ARS' | 'USD'
- `exchangeRate`: number (si hubo conversión)
- `status`: 'pending' | 'completed' (Clave para ingresos proyectados)
- `date`: timestamp
- `isRecurring`: boolean
- `paidBy`: 'David' | 'Lucre' | 'Shared'
- `accountId`: string

### Colección: `assets` (Inversiones/Patrimonio)
- `id`: string
- `name`: string (Ej: "Depto al pozo")
- `initialCapital`: number
- `currentValue`: number
- `currency`: 'ARS' | 'USD'

---

## 4. Lógica de Módulos Core

### 4.1. El Ciclo de Cobranza (Ingresos)
1. **Facturación:** Al marcar una factura como emitida, se crea una transacción con `status: 'pending'`.
2. **Dashboard:** Este monto suma a "Ingresos Proyectados", pero NO se refleja en el saldo de ninguna cuenta.
3. **Confirmación de Pago:** Al cambiar el switch a "Cobrado", el sistema abre un modal:
    - ¿Monto final recibido?
    - ¿Moneda? (Si es distinta al acuerdo, pide el Tipo de Cambio).
    - ¿A qué cuenta ingresó?
4. **Impacto:** El `status` pasa a `completed` y el saldo de la cuenta destino se actualiza.

### 4.2. Gastos Recurrentes
- Se muestran en una lista de "Pendientes de Confirmación" según la fecha.
- El usuario debe hacer click en "Registrar Pago" para que el dinero se descuente.

### 4.3. Modo Oscuro / Claro
- Utilizar `next-themes`.
- Al cambiar el tema, se debe disparar una actualización en el documento del usuario en Firestore para que sea persistente en todos los dispositivos.

---

## 5. Requerimientos de UI/UX (Diseño)
- **Dashboard:** Tarjetas tipo "Widgets" con:
    - Balance Real (Total en cuentas).
    - Ingresos Reales vs. Proyectados.
    - Egresos del mes.
- **Gráficos:** Gráfico de dona para categorías de gastos.
- **Registro Rápido:** Botón flotante (+) que despliega:
    - Campo de texto para "Registro con IA" (Procesamiento de lenguaje natural).
    - Botones de acceso rápido a categorías (Café, Nafta, Super).
- **Exportación:** Botón para generar y descargar un archivo `.csv` filtrado por rango de fechas.

---

## 6. Configuración PWA
- Configurar `manifest.json`.
- Iconos de alta resolución (especialmente para iOS).
- `theme_color` adaptativo según el modo oscuro/claro.
