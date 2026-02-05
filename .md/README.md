# 🍽️ Nuvio - Plataforma de Menú Digital

> Una plataforma moderna de menú digital QR con mejor UX/UI que la competencia.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-brightgreen)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

---

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#-sobre-el-proyecto)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Comandos Útiles](#-comandos-útiles)
- [Arquitectura](#-arquitectura)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)

---

## 🎯 Sobre el Proyecto

**Nuvio** es una plataforma para crear menús digitales con código QR, diseñada para restaurantes, bares y negocios gastronómicos. El objetivo es **superar a Nedify** (competencia principal) con:

- ✨ **Mejor UX/UI**: Interfaces más limpias y fáciles de usar
- 🚀 **Mejor performance**: Next.js 16 con App Router
- 🔒 **Más seguro**: TypeScript + validación con Zod
- 📱 **Mobile-first**: Diseño responsive desde el inicio

### ¿Por qué Nuvio?

Nedify tiene funcionalidades completas pero adolece de problemas de UX:
- Editor masivo con 10+ columnas → abrumador
- Modales con demasiada información junta
- Falta de preview en tiempo real
- Flujos complicados para tareas simples

**Nuvio resuelve esto** con interfaces más simples, wizards paso a paso, y preview en vivo.

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Base de datos**: PostgreSQL 16
- **ORM**: Prisma 7.2
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod
- **Storage**: Supabase (imágenes)
- **Utilidades**: 
  - `qrcode` - Generación de códigos QR
  - `multer` - Upload de archivos

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Lenguaje**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Notificaciones**: 
  - React Toastify
  - SweetAlert2

---

## 📁 Estructura del Proyecto

```
nuvio/
├── backend/                    # API REST con Express
│   ├── controllers/            # Lógica de negocio
│   │   ├── auth.controller.js
│   │   ├── business.controller.js
│   │   ├── category.controller.js
│   │   ├── product.controller.js
│   │   └── admin.controller.js
│   ├── routes/                 # Definición de rutas
│   │   ├── auth.routes.js
│   │   ├── business.routes.js
│   │   ├── category.routes.js
│   │   ├── product.routes.js
│   │   ├── menu.routes.js
│   │   └── upload.routes.js
│   ├── middlewares/            # Middleware personalizado
│   │   ├── auth.middleware.js      # Verificación JWT
│   │   ├── role.middleware.js      # Control de roles
│   │   └── validate.middleware.js  # Validación con Zod
│   ├── schemas/                # Schemas de validación Zod
│   ├── prisma/                 # Prisma ORM
│   │   └── schema.prisma       # Modelo de datos
│   ├── uploads/                # Archivos temporales
│   ├── server.js               # Punto de entrada
│   └── prismaClient.js         # Cliente Prisma singleton
│
├── nuvio-frontend/            # App Next.js
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── page.tsx            # Home page
│   │   ├── layout.tsx          # Layout principal
│   │   ├── login/              # Página de login
│   │   ├── dashboard/          # Dashboard protegido
│   │   ├── categories/         # Gestión de categorías
│   │   ├── menu/               # Vista de menú
│   │   ├── m/[slug]/           # Menú público por slug
│   │   └── apis/               # API Routes (opcional)
│   ├── components/             # Componentes reutilizables
│   │   ├── layout/             # Header, Sidebar, Footer
│   │   ├── share/              # Botones de compartir
│   │   └── ui/                 # Botones, inputs, modales
│   ├── lib/                    # Utilidades y helpers
│   │   ├── api.ts              # Cliente HTTP (fetch wrapper)
│   │   ├── auth.ts             # Helpers de autenticación
│   │   ├── upload.ts           # Upload a Supabase
│   │   └── notify.ts           # Notificaciones toast
│   └── public/                 # Archivos estáticos
│
├── NEDIFY-ANALYSIS.md         # Análisis de la competencia
└── README.md                  # Este archivo
```

---

## 🚀 Instalación

### Prerequisitos

- Node.js 20+ ([descargar](https://nodejs.org/))
- PostgreSQL 16+ ([descargar](https://www.postgresql.org/download/))
- Git ([descargar](https://git-scm.com/))
- Cuenta en Supabase (gratis) ([crear cuenta](https://supabase.com/))

### 1. Clonar el repositorio

```bash
git clone https://github.com/Tachero99/app-nuvio.git
cd app-nuvio
```

### 2. Instalar dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../nuvio-frontend
npm install
```

### 3. Configurar base de datos

```bash
cd backend

# Crear base de datos PostgreSQL
createdb nuvio_dev

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
# DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nuvio_dev"

# Ejecutar migraciones
npx prisma migrate dev

# (Opcional) Seed con datos de prueba
npx prisma db seed
```

### 4. Configurar Supabase (storage de imágenes)

1. Crear proyecto en [Supabase](https://app.supabase.com/)
2. Ir a **Storage** → Crear bucket `nuvio-images` (público)
3. Copiar las credenciales:
   - Project URL
   - anon/public key
4. Agregar a `.env` del backend:

```bash
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_KEY=tu_anon_key
```

### 5. Iniciar servidores

#### Backend (puerto 3001)
```bash
cd backend
npm run dev
```

#### Frontend (puerto 3000)
```bash
cd nuvio-frontend
npm run dev
```

Ahora podés acceder a:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

```bash
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nuvio_dev"

# JWT
JWT_SECRET="tu_secreto_super_seguro_aqui_cambiar_en_produccion"
JWT_EXPIRES_IN="7d"

# Supabase (storage)
SUPABASE_URL="https://tuproyecto.supabase.co"
SUPABASE_KEY="tu_anon_key_aqui"

# URLs
FRONTEND_PUBLIC_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"

# Entorno
NODE_ENV="development"
```

### Frontend (`nuvio-frontend/.env.local`)

```bash
# API Backend
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# Supabase (opcional si se sube desde frontend)
NEXT_PUBLIC_SUPABASE_URL="https://tuproyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key_aqui"
```

---

## 🎮 Comandos Útiles

### Backend

```bash
# Desarrollo
npm run dev                    # Iniciar servidor con nodemon

# Base de datos
npx prisma migrate dev         # Crear y aplicar migración
npx prisma migrate dev --name nombre_migracion
npx prisma db seed             # Poblar DB con datos de prueba
npx prisma studio              # UI para ver/editar datos
npx prisma generate            # Regenerar cliente Prisma

# Testing
npm test                       # Ejecutar tests (pendiente)
```

### Frontend

```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo (puerto 3000)
npm run build                  # Build para producción
npm start                      # Iniciar build de producción
npm run lint                   # Linter ESLint
```

---

## 🏗️ Arquitectura

### Modelo de Datos (Prisma)

```prisma
User (usuario admin/dueño)
  ↓ 1:1
Business (negocio)
  ↓ 1:N
Category (categorías del menú)
  ↓ 1:N
Product (productos)
```

#### Relaciones clave:

- **User → Business**: Un usuario puede tener UN negocio (relación 1:1)
- **Business → Categories**: Un negocio tiene MUCHAS categorías
- **Category → Products**: Una categoría tiene MUCHOS productos
- **Business → Products**: Relación directa para productos sin categoría
- **Business → Orders**: Sistema de pedidos (future)

### Flujo de Autenticación

1. Usuario hace POST `/api/auth/login` con email/password
2. Backend verifica credenciales con bcrypt
3. Backend genera JWT con payload: `{ id, email, role }`
4. Frontend guarda token en localStorage
5. Frontend incluye token en header: `Authorization: Bearer ${token}`
6. Middleware `requireAuth` valida token en cada request protegido

### Flujo de Upload de Imágenes

1. Usuario selecciona imagen en frontend
2. Frontend hace POST `/api/upload` con FormData
3. Backend recibe archivo con `multer`
4. Backend sube a Supabase Storage
5. Backend retorna URL pública de la imagen
6. Frontend guarda URL en el producto/categoría

---

## 🗺️ Roadmap

### ✅ Fase 1: MVP Básico (COMPLETADO)
- [x] Autenticación JWT
- [x] CRUD de Business
- [x] CRUD de Categorías
- [x] CRUD de Productos
- [x] Upload de imágenes a Supabase
- [x] Menú público por slug `/m/[slug]`

### 🚧 Fase 2: Paridad con Nedify (EN PROGRESO)
- [ ] Editor masivo de productos (REDISEÑADO)
- [ ] Importar productos desde Excel
- [ ] Sistema de secciones dentro de categorías
- [ ] Generación y descarga de QR code
- [ ] Configuración de días/horarios por categoría
- [ ] Aumento masivo de precios
- [ ] Producto rápido (quick add)

### 🔮 Fase 3: Diferenciadores (FUTURO)
- [ ] Dashboard con analytics
  - Productos más vistos
  - Categorías populares
  - Horarios de mayor tráfico
- [ ] Live preview del menú mientras editás
- [ ] Templates de diseño prediseñados
- [ ] Creador de links tipo Linktree
- [ ] Sistema de pedidos online
- [ ] Múltiples sucursales por negocio
- [ ] Multi-idioma (ES/EN/PT)

### 🎨 Fase 4: UX Avanzado (INVESTIGACIÓN)
- [ ] Drag & drop para reordenar
- [ ] Modo oscuro
- [ ] Accesibilidad (WCAG 2.1)
- [ ] PWA (instalable en móvil)
- [ ] Notificaciones push

---

## 📚 Documentación Adicional

- [NEDIFY-ANALYSIS.md](./NEDIFY-ANALYSIS.md) - Análisis completo de la competencia
- [Prisma Schema](./backend/prisma/schema.prisma) - Modelo de datos
- [API Endpoints](./docs/API.md) - Documentación de API (TODO)

---

## 🤝 Contribuir

Este es un proyecto personal de aprendizaje, pero se aceptan sugerencias y feedback.

### Reportar un bug

1. Abrir un issue en GitHub describiendo:
   - Qué esperabas que pasara
   - Qué pasó en realidad
   - Pasos para reproducir
   - Screenshots si aplica

### Sugerir una feature

1. Revisar primero [NEDIFY-ANALYSIS.md](./NEDIFY-ANALYSIS.md)
2. Abrir un issue con label `enhancement`
3. Describir:
   - El problema que resuelve
   - Cómo lo haría Nedify (si aplica)
   - Cómo lo podemos hacer mejor

---

## 📄 Licencia

Proyecto personal sin licencia definida aún.

---

## 👨‍💻 Autor

**Tachero** - Estudiante de programación, aprendiendo React/Next.js

- GitHub: [@Tachero99](https://github.com/Tachero99)

---

## 🙏 Agradecimientos

- Profesor que sugirió mejorar el UX/UI del editor masivo
- Nedify por ser un caso de estudio de qué NO hacer en UX
- Comunidad de Next.js y Prisma por la excelente documentación

---

## 📝 Notas del Desarrollador

Este proyecto nació en diciembre 2024 como forma de:
1. Aprender Next.js 16 y App Router
2. Practicar Prisma ORM
3. Construir algo real y usable
4. Mejorar un producto existente (Nedify)

**Stack elegido:** React/Next.js porque en el último cuatrimestre de la facultad aprendí React y "vi lo lindo que queda el UX/UI".

**Inspiración:** Nedify tiene todas las funcionalidades necesarias, pero su UX/UI deja mucho que desear. La oportunidad está en hacer lo mismo pero mejor.

**Estado actual:** MVP básico funcionando. Falta implementar features avanzadas como editor masivo, importar Excel, y sistema de QR codes.

---

**⭐ Si te gusta el proyecto, dejá una estrella en GitHub!**
