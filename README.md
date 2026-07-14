# JL-IMPORT

Tienda en línea de productos importados, construida con HTML, CSS y JavaScript puro (ES Modules), con Firebase como backend (Authentication, Firestore y Storage). Pensada para desplegarse gratis en GitHub Pages.

## 🚀 Tecnologías

- ✅ HTML5
- ✅ CSS3
- ✅ JavaScript (ES Modules)
- ✅ Firebase Authentication
- ✅ Firestore
- ✅ Firebase Storage (para imágenes)
- ✅ GitHub Pages

## 📁 Estructura del proyecto

```
JL-IMPORT/
│
├── index.html          → Inicio: banners, categorías, marcas, buscador, filtros, destacados, ofertas
├── producto.html        → Ficha de producto con variantes
├── carrito.html          → Carrito de compras
├── login.html            → Inicio de sesión
├── registro.html         → Registro de clientes
├── perfil.html            → Perfil, historial de pedidos y favoritos
├── dashboard.html        → Panel de administración
├── pedidos.html           → Gestión de pedidos (admin)
│
├── css/
│   ├── style.css          → Estilos generales de la tienda
│   ├── admin.css           → Estilos del panel de administración
│   └── responsive.css       → Adaptación a tablet y móvil
│
├── js/
│   ├── firebase.js         → Configuración central de Firebase
│   ├── app.js                → Lógica de inicio (categorías, marcas, filtros)
│   ├── dashboard.js           → CRUD de productos, categorías, marcas, clientes, estadísticas
│   ├── producto.js             → Ficha de producto y variantes
│   ├── carrito.js               → Carrito y checkout por WhatsApp
│   ├── login.js                   → Autenticación
│   ├── registro.js                 → Registro de cuentas
│   ├── perfil.js                    → Perfil del cliente
│   ├── usuario.js                    → Sesión global, header dinámico, utilidades
│   ├── adminGuard.js                  → Protección de rutas de administrador
│   └── pedidos.js                      → Panel de gestión de pedidos
│
├── img/                    → Imágenes estáticas del sitio
└── README.md
```

## ✨ Funcionalidades

### Tienda
- Inicio moderno con banner y sección "ruta de importación".
- Categorías y marcas dinámicas.
- Buscador y filtros (categoría, marca, orden por precio/nombre).
- Productos destacados y ofertas.

### Productos
- Variantes ilimitadas (color, talla, memoria, u otro atributo libre).
- Varias imágenes por variante.
- Stock independiente por variante.
- Galería de imágenes y especificaciones técnicas.

### Clientes
- Registro e inicio de sesión con Firebase Authentication.
- Perfil editable (nombre, teléfono).
- Historial de pedidos.
- Lista de favoritos.

### Carrito
- Guarda la variante elegida de cada producto.
- Cambiar cantidad y eliminar productos.
- Total calculado automáticamente.
- Persistencia en `localStorage`.

### Pedidos
- Se registran en Firestore al finalizar la compra.
- Confirmación automática vía WhatsApp.
- Estados: pendiente, procesando, enviado, entregado, cancelado.
- Panel de administración para actualizar estados.

### Administrador
- Dashboard con pestañas: Productos, Categorías, Marcas, Clientes, Estadísticas, Configuración.
- CRUD completo de productos (con editor de variantes e imágenes).
- CRUD de categorías y marcas.
- Listado de clientes registrados.
- Estadísticas generales (productos, pedidos, ventas, clientes).
- Acceso restringido: solo usuarios con `rol: "admin"` en Firestore.

## ⚙️ Configuración

### 1. Crear un proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto.
2. Activa **Authentication** → método de correo/contraseña.
3. Activa **Firestore Database**.
4. Activa **Storage**.
5. Copia las credenciales del proyecto (Configuración → Tus apps → SDK config) y pégalas en `js/firebase.js`, dentro del objeto `firebaseConfig`.

### 2. Colecciones de Firestore

| Colección    | Descripción                                                        |
|--------------|---------------------------------------------------------------------|
| `productos`  | Nombre, precio, categoría, marca, variantes, especificaciones, etc. |
| `categorias` | Nombre e imagen.                                                    |
| `marcas`     | Nombre.                                                              |
| `usuarios`   | Datos del cliente y campo `rol` (`cliente` o `admin`).               |
| `pedidos`    | Items, total, estado, cliente, fecha.                                |

### 3. Crear el primer administrador

Regístrate normalmente desde `registro.html` y luego, en Firestore, edita manualmente ese documento en `usuarios/{uid}` cambiando el campo `rol` a `"admin"`.

### 4. Datos de contacto de la tienda

Configurados en `js/firebase.js` (objeto `TIENDA`):

- **WhatsApp:** +51 922 564 745
- **Correo:** jlimport17@gmail.com
- **País:** Perú

### 5. Publicar en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. Selecciona la rama `main` y la carpeta raíz (`/`).
4. Guarda; tu tienda quedará disponible en `https://tu-usuario.github.io/JL-IMPORT/`.

## 📌 Notas

- El proyecto usa el SDK modular de Firebase v10 vía CDN, por lo que no requiere `npm install` ni bundlers.
- Configura las **reglas de seguridad** de Firestore y Storage antes de pasar a producción, restringiendo la escritura de `productos`, `categorias`, `marcas` y `pedidos` solo a usuarios con `rol: "admin"`.
