# 🤖 Guía: Cómo usar Claude Code con Nuvio

Esta guía te explica cómo usar **Claude Code** (el CLI) para trabajar en tu proyecto de forma más eficiente.

---

## 🎯 ¿Qué es Claude Code?

Claude Code es una herramienta de línea de comandos que te permite:
- Chatear con Claude desde la terminal
- Darle acceso directo a tu código
- Pedirle que escriba/edite archivos
- Ejecutar comandos que Claude sugiere
- Mantener contexto de toda tu codebase

**Ventaja vs Claude.ai:** No tenés que copiar/pegar código, Claude puede leer y editar archivos directamente.

---

## 🚀 Setup Inicial

### 1. Instalar Claude Code

Si todavía no lo tenés instalado:

```bash
# macOS/Linux
curl -fsSL https://claude.ai/install.sh | sh

# Windows
# Descargar desde: https://claude.ai/download
```

### 2. Iniciar Claude Code en tu proyecto

```bash
# Ir a la carpeta raíz del proyecto (donde están backend/ y nuvio-frontend/)
cd /ruta/a/app-nuvio

# Iniciar Claude Code
claude
```

Verás algo como:
```
   🤖 Claude Code
   Let's get started.

>
```

---

## 📖 Dar Contexto a Claude

### Opción 1: Análisis automático

Claude Code puede leer tu proyecto completo. Simplemente decile:

```
Analizá la estructura completa de mi proyecto. Leé:
- backend/prisma/schema.prisma
- backend/routes/*.js
- backend/controllers/*.js
- nuvio-frontend/app/**
- package.json de ambos proyectos

Decime qué entendés del proyecto y qué está funcionando.
```

### Opción 2: Darle el archivo de análisis

Primero, copiá los archivos que te generé:
- `README.md`
- `NEDIFY-ANALYSIS.md`

Poné ambos en la raíz de tu proyecto (`app-nuvio/`), y después decile a Claude:

```
Leé README.md y NEDIFY-ANALYSIS.md para entender:
1. Qué hace mi proyecto
2. Contra quién compito (Nedify)
3. Qué features faltan implementar
4. Qué problemas de UX/UI tiene Nedify que yo debo mejorar
```

### Opción 3: Contexto incremental

Si querés que Claude entienda algo específico:

```
# Para entender el modelo de datos
Leé backend/prisma/schema.prisma y explicame las relaciones entre User, Business, Category y Product

# Para entender las rutas
Leé todos los archivos en backend/routes/ y decime qué endpoints tengo disponibles

# Para entender el frontend
Listá todas las páginas en nuvio-frontend/app/ y decime qué hace cada una
```

---

## 💻 Comandos Útiles

### Pedirle que escriba código

```
Creame un componente React para mostrar una card de producto. 
Debe mostrar: imagen, nombre, precio, y botón "Agregar al carrito".
Usá Tailwind CSS y guardalo en nuvio-frontend/components/ui/ProductCard.tsx
```

Claude va a:
1. Generar el código
2. Mostrártelo
3. Preguntarte si querés que lo guarde

### Pedirle que edite código existente

```
Modificá nuvio-frontend/app/categories/page.tsx para:
1. Agregar un botón "Nueva Categoría"
2. Mostrar las categorías en una grid de 3 columnas
3. Agregar hover effects con Tailwind
```

### Pedirle que analice bugs

```
Estoy teniendo un error en backend/controllers/product.controller.js cuando intento crear un producto. 
El error es: [pega el error aquí]
Leé el archivo y decime qué está mal.
```

### Pedirle que mejore UX/UI

```
Mirá el componente nuvio-frontend/components/layout/Sidebar.tsx.
Comparalo con los problemas de UX que tiene Nedify (descriptos en NEDIFY-ANALYSIS.md).
Sugerí mejoras visuales con Tailwind para que sea más limpio.
```

---

## 🎯 Flujos de Trabajo Comunes

### 1. Implementar una feature nueva

**Ejemplo: Agregar sistema de secciones dentro de categorías**

```
Claude, quiero implementar el sistema de Secciones que tiene Nedify (está explicado en NEDIFY-ANALYSIS.md).

Necesito:
1. Actualizar schema.prisma para agregar modelo Section
2. Crear controlador para CRUD de secciones
3. Crear rutas en backend
4. Crear componente en frontend para gestionar secciones

Hacelo paso a paso, empezá por el schema.
```

Claude va a:
- Leer el análisis de Nedify
- Proponerte el schema
- Esperar tu confirmación
- Después seguir con el controlador, etc.

### 2. Refactorizar código

```
Refactorizá backend/controllers/category.controller.js:
- Separar la lógica de validación en funciones helper
- Agregar manejo de errores más descriptivo
- Agregar comentarios explicativos
```

### 3. Crear documentación

```
Basándote en backend/routes/product.routes.js, creame un archivo docs/API-PRODUCTS.md
que documente todos los endpoints de productos con:
- URL
- Método HTTP
- Body esperado
- Respuesta exitosa
- Posibles errores
```

### 4. Debugging

```
El menú público en /m/[slug] no está mostrando las imágenes de productos.
Revisá:
1. nuvio-frontend/app/m/[slug]/page.tsx
2. backend/controllers/business.controller.js (método getPublicMenu)
3. El schema de Product en prisma

Decime dónde está el problema.
```

---

## 🧠 Tips Avanzados

### 1. Mantener contexto entre sesiones

Claude Code recuerda la conversación actual, pero si cerrás la terminal, perdés el contexto.

**Solución:** Antes de cerrar, decile:

```
Resumí todo lo que hicimos en esta sesión (features implementadas, archivos modificados, bugs resueltos).
Guardá ese resumen en CHANGELOG.md
```

### 2. Comparar con Nedify

Cuando implementes algo, siempre preguntá:

```
Comparalo con cómo lo hace Nedify (descripción en NEDIFY-ANALYSIS.md).
¿Es más simple nuestro approach? ¿El UX es mejor?
```

### 3. Generar tests

```
Para backend/controllers/product.controller.js, generame tests unitarios con Jest.
Cubrí los casos:
- Crear producto exitoso
- Crear producto sin autenticación (debe fallar)
- Crear producto con precio negativo (debe fallar)
```

### 4. Optimizaciones

```
Analizá nuvio-frontend/lib/api.ts y sugerí mejoras de performance:
- Agregar caché
- Manejar requests concurrentes
- Cancelar requests si el componente se desmonta
```

---

## 🚫 Qué NO hacer con Claude Code

❌ **No le pidas que ejecute comandos destructivos sin revisar**
```
# Mal:
"Eliminá todos los productos de la base de datos"

# Bien:
"Mostrame el comando SQL para eliminar productos, pero NO lo ejecutes"
```

❌ **No le des acceso a archivos sensibles**
```
# No compartas:
- Archivos .env (tienen secrets)
- Credenciales de Supabase
- JWTs reales
```

❌ **No asumas que todo el código que genera funciona**
```
# Siempre:
1. Revisá el código que genera
2. Probalo localmente
3. Si algo no funciona, decile "esto no funcionó: [error]"
```

---

## 🎓 Ejemplos Prácticos

### Ejemplo 1: Implementar Editor Masivo (feature prioritaria)

```
Claude, vamos a implementar el Editor Masivo de productos, pero con mejor UX que Nedify.

Contexto (leé NEDIFY-ANALYSIS.md sección "Editor Masivo"):
- Nedify muestra 10+ columnas en una tabla → es abrumador
- No tiene búsqueda ni filtros
- No podés ocultar columnas

Nuestro approach:
1. Tabla con solo 5 columnas: Nombre, Categoría, Precio, Stock, Estado
2. Al hacer click en una fila, abrir panel lateral con TODOS los detalles editables
3. Agregar búsqueda y filtros arriba de la tabla
4. Bulk actions: seleccionar múltiples productos y cambiar categoría/estado/precio

Empezá por el componente de frontend: nuvio-frontend/app/products/editor/page.tsx
```

### Ejemplo 2: Importar desde Excel

```
Necesito implementar la funcionalidad de importar productos desde Excel (como Nedify).

Requerimientos (según NEDIFY-ANALYSIS.md):
- Subir archivo Excel con columnas: Categoría, Sección, Producto, Precio, Descripción
- Validar archivo antes de importar
- Mostrar preview de qué se va a crear/actualizar
- Si un producto existe, actualizar precio

PERO mejorando el UX:
- Wizard de 3 pasos: Upload → Preview → Confirmar
- Mostrar errores claros (ej: "Fila 15: precio inválido")
- Permitir CSV además de Excel

Backend: usá la librería 'xlsx' para parsear el archivo
Frontend: componente en nuvio-frontend/app/products/import/page.tsx
```

### Ejemplo 3: Sistema de QR Code

```
Implementemos la generación y descarga de QR code del menú.

Nedify genera un QR que apunta a /m/[slug].
Nosotros vamos a hacer lo mismo pero mejor:

Backend:
1. Endpoint GET /api/business/me/qr que:
   - Genera QR apuntando a FRONTEND_URL/m/[slug]
   - Devuelve imagen en base64 O archivo PNG

Frontend:
2. Componente QRCodeGenerator en nuvio-frontend/components/share/QRCodeGenerator.tsx
   - Botón "Generar QR"
   - Preview del QR
   - Opciones de descarga: PNG, SVG, PDF
   - Tamaños: Pequeño (200x200), Mediano (400x400), Grande (800x800)

Empezá por el backend usando la librería 'qrcode' que ya está instalada.
```

---

## 🔄 Workflow Recomendado

### Para cada nueva feature:

1. **Entender qué hace Nedify**
   ```
   Claude, explicame cómo funciona [feature] en Nedify según NEDIFY-ANALYSIS.md
   ```

2. **Definir cómo lo haremos mejor**
   ```
   Diseñá un approach más simple y con mejor UX para implementar [feature]
   ```

3. **Implementar backend primero**
   ```
   Empezá por el schema de Prisma, después controlador, después ruta
   ```

4. **Implementar frontend**
   ```
   Ahora creá el componente de frontend que consume esa API
   ```

5. **Revisar y mejorar**
   ```
   Revisá el código que generamos. ¿Hay algo que podamos simplificar o mejorar visualmente?
   ```

---

## 📞 Cuando Estés Trabado

Si no sabés cómo continuar, decile a Claude:

```
Estoy trabado en [describe el problema].

Lo que intenté:
- [paso 1]
- [paso 2]

Error que recibo:
[copia el error]

Ayudame a debuggear esto paso a paso.
```

O simplemente:

```
Estoy perdido. Resumime dónde estamos parados y qué deberíamos hacer a continuación.
```

---

## 🎉 Resultado Final

Con Claude Code, deberías poder:
- ✅ Implementar features completas en 1-2 horas (vs días manualmente)
- ✅ Mantener código limpio y documentado
- ✅ Aprender mejores prácticas mientras Claude te explica
- ✅ Iterar rápido en UX/UI

**Regla de oro:** Claude Code es un copiloto, no un piloto automático. Siempre revisá, entendé y mejorá el código que genera.

---

¡Buena suerte con el proyecto! 🚀
