# Análisis Competitivo: Nedify vs Nuvio

## 📋 Sobre este documento

Este archivo contiene el análisis completo de **Nedify**, la competencia principal de Nuvio. Úsalo como referencia para entender qué funcionalidades implementar y, sobre todo, **qué mejorar en términos de UX/UI**.

---

## 🎯 Objetivo de Nuvio

Crear una plataforma de menú digital QR **mejor que Nedify**, con énfasis en:
- **UX/UI superior** (menos ruido visual, más intuitivo)
- **Mejor organización** de información
- **Flujos más simples** para tareas complejas

---

## 🔍 Funcionalidades de Nedify (por módulo)

### 1. MENÚ DIGITAL QR

#### Pantalla: Configuración del Menú QR
**Lo que hace:**
- Permite incrustar mapa de Google Maps
- Configurar redes sociales (Facebook, Instagram, Telegram, Email)
- Usuario Messenger para pedidos
- Generar y descargar código QR del menú

**Problemas de UX/UI:**
- Toda la información junta en una sola pantalla larga
- No hay jerarquía visual clara
- El código QR se genera al final, no está destacado

**Oportunidad de mejora:**
- Separar en secciones/tabs: "Información", "Redes Sociales", "QR Code"
- Vista previa del menú público en tiempo real
- QR descargable en múltiples formatos (PNG, SVG, PDF)

---

### 2. PRODUCTOS Y CATEGORÍAS

#### Pantalla Principal
**Lo que hace:**
- Vista de tarjetas de categorías (con imagen de fondo)
- Botones: Nueva Categoría, Producto Rápido, Aumento Masivo, Importar Excel, Opciones e Items, Editor Masivo
- Cada categoría muestra estado (Activa/Inactiva)
- Al hacer clic en categoría, muestra sus productos

**Problemas de UX/UI:**
- Demasiados botones de acción en la parte superior (6 botones)
- Las tarjetas de categoría son grandes pero no muestran info útil (cantidad de productos, última actualización)
- No hay búsqueda o filtros visibles

**Oportunidad de mejora:**
- Menú de acciones en dropdown o toolbar organizado
- Mostrar métricas en las tarjetas (ej: "24 productos, 5 activos")
- Barra de búsqueda y filtros siempre visibles
- Drag & drop para reordenar categorías

---

#### Modal: Nueva Categoría
**Lo que hace:**
- Nombre de categoría
- Subir/elegir imagen
- Nota (descripción)
- Días de la semana que se muestra
- Horario específico (desde-hasta)
- Fecha específica (solo se muestra ese día)

**Problemas de UX/UI:**
- TODO en un solo modal gigante
- Difícil de entender qué es obligatorio y qué es opcional
- La lógica de días/horarios/fecha está confusa

**Oportunidad de mejora:**
- Wizard de 3 pasos:
  1. Información básica (nombre, imagen, descripción)
  2. Disponibilidad (días, horarios) - con preview visual
  3. Confirmar y crear
- Separar opciones avanzadas en un accordion "Configuración avanzada"

---

#### Modal: Editar Categoría
**Lo que hace:**
- Similar a crear pero con botones adicionales:
  - Quitar Categoría (eliminar)
  - Copiar de Categoría (duplicar productos)
  - Ajustes Básicos (orden, estado)
  - Gestionar Secciones (sub-categorías)
  - Agregar Producto

**Problemas de UX/UI:**
- 5 botones de acción diferentes dentro del modal
- No es claro cuál es la acción primaria
- "Gestionar Secciones" abre OTRO modal dentro del modal

**Oportunidad de mejora:**
- Convertir en una página completa (no modal)
- Sidebar con tabs: "Información", "Productos", "Secciones", "Configuración"
- Acciones destructivas (eliminar) separadas y con confirmación clara

---

#### Funcionalidad: Secciones
**Lo que hace:**
- Permite crear subdivisiones dentro de una categoría
- Ejemplo: Categoría "BEBIDAS" → Secciones "Gaseosas", "Cervezas", "Vinos"
- Los productos se pueden asignar a secciones

**Problemas de UX/UI:**
- No queda claro cuándo usar secciones vs crear otra categoría
- La UI no muestra las secciones de forma prominente

**Oportunidad de mejora:**
- Explicación clara de cuándo usar secciones
- Vista de árbol: Categoría → Secciones → Productos
- Drag & drop para mover productos entre secciones

---

#### Funcionalidad: Editor Masivo
**Lo que hace:**
- Tabla con TODAS las columnas editables:
  - Producto, Precio Unit, Costo, Estado, Descuento Stock, Stock, Descripción, Cod. Barras, Categoría, Sección, Items, Modalidad
- Permite editar múltiples productos a la vez
- Los cambios se guardan automáticamente

**Problemas de UX/UI (CRÍTICO - el peor de Nedify):**
- **10+ columnas visibles simultáneamente** → imposible de leer
- Campos de input muy pequeños
- Dropdowns con texto naranja "Sin Asignar / Sin GI" genera ruido visual
- No hay forma de ocultar columnas que no necesitas
- Scroll horizontal necesario para ver todo
- Difícil encontrar un producto específico sin búsqueda

**Oportunidad de mejora (PRIORIDAD ALTA):**
- **Vista híbrida:** Tabla simplificada (5 columnas max) + Panel lateral para editar
- **Columnas configurables:** El usuario elige qué columnas ver
- **Vista de tarjetas** como alternativa a la tabla
- **Edición inline** solo en campos comunes (precio, stock, estado)
- **Bulk actions:** Seleccionar múltiples → Cambiar categoría/estado/precio en batch
- **Búsqueda y filtros potentes:** Por categoría, estado, rango de precios
- **Validación visual:** Productos sin precio/sin imagen destacados

---

#### Funcionalidad: Importar Excel
**Lo que hace:**
- Descargar plantilla de ejemplo
- Subir Excel con 5 columnas:
  1. Nombre de Categoría (Obligatorio)
  2. Nombre de Sección (Opcional)
  3. Nombre del Producto (Obligatorio)
  4. Precio del Producto (Opcional)
  5. Descripción del Producto (Opcional)
- Actualiza precios si el producto ya existe
- Crea categorías/secciones/productos nuevos si no existen

**Problemas de UX/UI:**
- Instrucciones largas y poco visuales
- No hay validación previa del archivo
- No muestra preview de lo que se va a importar

**Oportunidad de mejora:**
- Wizard de 3 pasos:
  1. Subir archivo → Validación automática
  2. Preview: "Se crearán X categorías, Y productos, se actualizarán Z precios"
  3. Confirmar importación
- Manejo de errores claro (ej: "Fila 15: precio inválido")
- Permitir CSV además de Excel

---

#### Funcionalidad: Producto Rápido
**Lo que hace:**
- Crear producto con solo nombre y precio
- Se asigna automáticamente a una categoría por defecto

**Problemas de UX/UI:**
- No queda claro a qué categoría se asigna
- Después tenés que editarlo para agregar imagen/descripción

**Oportunidad de mejora:**
- Input flotante tipo "Quick Add" desde cualquier vista
- Autocompletar categoría según contexto (si estás en "Bebidas", se asigna ahí)

---

#### Funcionalidad: Aumento Masivo
**Lo que hace:**
- Aplicar un % de aumento a todos los productos
- Filtrar por categorías específicas
- Redondear precios (ej: $594 → $600)

**Problemas de UX/UI:**
- Modal simple pero funcional
- No hay preview del resultado antes de aplicar

**Oportunidad de mejora:**
- Preview de cambios: "24 productos aumentarán de $X a $Y"
- Historial de aumentos aplicados
- Opción de deshacer

---

#### Funcionalidad: Opciones e Items
**Lo que hace:**
- Crear opciones adicionales para productos
- Ejemplo: "Pizza Muzzarella" → Items: "Queso", "Salsa", "Tamaño"
- Se cobra por separado

**Problemas de UX/UI:**
- Modal simple con un solo input
- No es claro cómo se usan los items después

**Oportunidad de mejora:**
- Vista de gestión de items más completa
- Preview de cómo se ve en el menú público

---

### 3. CREADOR DE LINKS (tipo Linktree)

#### Pantalla: Mi Perfil
**Lo que hace:**
- Configurar:
  - Imagen de perfil
  - Imagen de fondo
  - Nombre del negocio
  - Dirección/Ubicación
  - Link de acceso personalizado
  - Descripción/Introducción
  - WhatsApp del negocio
  - Colores: Fondo, Botones, Textos
- Preview del resultado

**Problemas de UX/UI:**
- TODO en una sola pantalla amarilla sin jerarquía
- Los inputs de color están arriba (deberían estar abajo o en sidebar)
- No hay live preview (tenés que crear botones primero)

**Oportunidad de mejora:**
- Split screen: Edición izquierda, Preview derecha (live)
- Sección de diseño colapsable
- Templates prediseñados para arrancar rápido

---

#### Pantalla: Acortador de Links
**Lo que hace:**
- Crear links cortos tipo miurl.click/nombre
- Usa dominio propio de Nedify
- Se pueden usar en cualquier botón del perfil

**Problemas de UX/UI:**
- Explicación larga
- Solo muestra ejemplo estático
- No hay lista de links ya creados

**Oportunidad de mejora:**
- Dashboard de links: Ver todos los links creados, clicks, fecha de creación
- Editar/eliminar links
- QR code individual por cada link

---

#### Pantalla: Crear Primer Botón
**Lo que hace:**
- Crear botones que redirigen a:
  - WhatsApp directo
  - Catálogo de WhatsApp
  - Link personalizado

**Problemas de UX/UI:**
- No queda claro cómo reordenar botones
- No hay límite visible de cuántos botones podés crear

**Oportunidad de mejora:**
- Drag & drop para reordenar
- Preview en tiempo real
- Templates de botones (ej: "Botón de Instagram", "Botón de TikTok")
- Iconos personalizables

---

### 4. CONFIGURACIÓN GENERAL

**Lo que hace:**
- ID asignado al negocio
- Nombre, Dirección, WhatsApp, Email
- Habilitar/deshabilitar módulos:
  - Negocio Digital
  - Web Digital
  - Menú Digital QR
  - Reseñas Web
- Seleccionar moneda de referencia (20+ opciones)

**Problemas de UX/UI:**
- Mucho espacio en blanco
- No hay explicación de qué hace cada módulo
- Selector de moneda tiene 20+ opciones sin agrupar

**Oportunidad de mejora:**
- Cards con descripción de cada módulo
- Agrupar monedas por región (América Latina, Europa, etc.)
- Tooltips explicativos

---

### 5. CAMBIAR CLAVE

**Lo que hace:**
- Cambiar contraseña (actual, nueva, confirmar)

**Problemas de UX/UI:**
- Funcional pero básico

**Oportunidad de mejora:**
- Medidor de fortaleza de contraseña
- Opción de 2FA

---

### 6. AYUDA/SOPORTE

**Lo que hace:**
- Redirige a WhatsApp del soporte de Nedify

**Problemas de UX/UI:**
- No hay base de conocimientos
- No hay FAQs
- Solo WhatsApp

**Oportunidad de mejora:**
- Centro de ayuda con artículos
- Videos tutoriales
- Chat en vivo además de WhatsApp

---

## 📊 Resumen: Lo que Nuvio debe mejorar

### 🔴 Prioridad ALTA (diferenciadores clave)

1. **Editor Masivo rediseñado completamente**
   - Vista híbrida: tabla simple + panel de edición
   - Columnas configurables
   - Bulk actions inteligentes

2. **Flujos simplificados para crear/editar categorías**
   - Wizard multi-paso en vez de modal gigante
   - Live preview siempre visible

3. **Dashboard con métricas**
   - Productos más vendidos
   - Categorías con más vistas
   - Analytics del menú público

### 🟡 Prioridad MEDIA

4. **Gestión de secciones más clara**
   - Vista de árbol
   - Drag & drop

5. **Importar Excel mejorado**
   - Validación previa
   - Preview de cambios
   - Manejo de errores claro

6. **Creador de Links con live preview**
   - Split screen
   - Templates prediseñados

### 🟢 Prioridad BAJA (nice to have)

7. **Centro de ayuda completo**
8. **2FA para seguridad**
9. **Múltiples formatos de exportación de QR**

---

## 🛠️ Stack Técnico de Nuvio (ya implementado)

### Backend
- **Framework:** Express.js + Node.js
- **Base de datos:** PostgreSQL + Prisma ORM
- **Autenticación:** JWT + bcrypt
- **Storage:** Supabase (imágenes)
- **Validación:** Zod schemas
- **QR Generation:** qrcode library

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Notificaciones:** React Toastify + SweetAlert2
- **Routing:** File-based routing de Next.js

---

## ✅ Funcionalidades YA implementadas en Nuvio

- ✅ Autenticación con JWT
- ✅ CRUD de categorías
- ✅ CRUD de productos
- ✅ Relación Business → Categories → Products
- ✅ Upload de imágenes a Supabase
- ✅ Sistema de roles (SUPERADMIN, CLIENT_OWNER)
- ✅ Menú público por slug `/m/[slug]`
- ✅ Sistema de órdenes (Order, OrderItem)
- ✅ Validación con Zod en backend
- ✅ Middleware de autenticación

---

## 🚧 Funcionalidades PENDIENTES (vs Nedify)

### Críticas (sin estas no competimos)
- ❌ Editor masivo de productos
- ❌ Importar productos desde Excel
- ❌ Generación y descarga de QR code
- ❌ Sistema de secciones dentro de categorías
- ❌ Configuración de días/horarios por categoría
- ❌ Aumento masivo de precios

### Importantes (dan valor extra)
- ❌ Creador de links tipo Linktree
- ❌ Acortador de URLs
- ❌ Productos destacados/promociones
- ❌ Sistema de "Items" (extras/opciones de producto)
- ❌ Integración con Google Maps
- ❌ Preview del menú público en tiempo real

### Nice to have (diferenciadores)
- ❌ Dashboard con analytics
- ❌ Historial de cambios en productos
- ❌ Templates de diseño para menú
- ❌ Multi-idioma
- ❌ Exportar catálogo a PDF
- ❌ Sistema de reseñas

---

## 🎨 Principios de UX/UI para Nuvio

### 1. Menos es más
- Máximo 3-4 botones de acción por pantalla
- Agrupar opciones secundarias en menús/dropdowns

### 2. Jerarquía visual clara
- Información primaria destacada
- Opciones avanzadas colapsables o en secciones separadas

### 3. Feedback inmediato
- Loading states claros
- Confirmaciones visuales de acciones
- Preview en tiempo real cuando sea posible

### 4. Mobile-first
- Todas las vistas deben funcionar en móvil
- Touch-friendly (botones grandes, espaciado generoso)

### 5. Guiar al usuario
- Tooltips y ayuda contextual
- Empty states informativos (ej: "No tenés productos, creá el primero aquí")
- Onboarding para nuevos usuarios

---

## 📝 Notas finales

Este documento debe ser el punto de referencia para todas las decisiones de producto. Cada feature nueva debe:

1. Resolver un problema real de Nedify
2. Hacerlo de forma más simple
3. Tener mejor UX/UI

**Pregunta clave antes de implementar algo:**
> "¿Esto es más simple y claro que en Nedify?"

Si la respuesta es no, rediseñar antes de codear.

---

## 🔗 Links útiles

- Repo Nuvio: https://github.com/Tachero99/app-nuvio
- Nedify (competencia): https://nedify.com
- Prisma Docs: https://www.prisma.io/docs
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
