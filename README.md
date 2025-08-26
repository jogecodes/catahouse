# 🍷 CataHouse - Plataforma de Concursos de Cata

CataHouse es una aplicación web moderna para gestionar concursos de cata donde los usuarios pueden puntuar items en diferentes categorías usando un sistema de estrellas del 1 al 5.

## ✨ Características

- **Sistema de Usuarios**: Registro y login con JWT
- **Gestión de Items**: Añadir/eliminar items concursantes fácilmente
- **Categorías Modulares**: Sistema flexible de categorías de puntuación
- **Sistema de Puntuación**: 1-5 estrellas por categoría
- **Panel de Administración**: Gestión completa para administradores
- **Resultados en Tiempo Real**: Rankings y estadísticas detalladas
- **Diseño Responsivo**: Interfaz moderna y fácil de usar

## 🚀 Stack Tecnológico

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Build tool y servidor de desarrollo
- **React Router** - Navegación entre páginas
- **Axios** - Cliente HTTP para API
- **Lucide React** - Iconos modernos
- **CSS Variables** - Sistema de diseño consistente

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación stateless
- **bcryptjs** - Hash de contraseñas
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-origin resource sharing

## 📋 Requisitos Previos

- **Node.js** 16+ y npm
- **PostgreSQL** 12+
- **Git** para clonar el repositorio

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd CataHouse
```

### 2. Instalar Dependencias
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del frontend y backend
npm run install:all
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb catahouse

# Configurar variables de entorno
cd backend
cp env.example .env
# Editar .env con tus credenciales de base de datos
```

### 4. Ejecutar Migraciones
```bash
# Crear tablas de base de datos
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

### 5. Iniciar Aplicación
```bash
# Desarrollo (frontend + backend)
npm run dev

# Solo frontend
npm run dev:frontend

# Solo backend
npm run dev:backend
```

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Landing Page**: http://localhost:3000 (redirige a /app)

## 👤 Usuarios de Prueba

### Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Usuarios de Ejemplo
- **Usuario**: `catador1`, `catador2`, `expert`
- **Contraseña**: `password123`

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **`users`** - Usuarios del sistema
- **`items`** - Items del concurso
- **`categories`** - Categorías de puntuación
- **`ratings`** - Puntuaciones de usuarios

### Relaciones
- Un usuario puede puntuar múltiples items
- Cada item puede ser puntuado en múltiples categorías
- Sistema de restricciones para evitar puntuaciones duplicadas

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia frontend y backend
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend

# Base de datos
npm run db:migrate       # Ejecuta migraciones
npm run db:seed          # Pobla con datos de ejemplo

# Build y Deploy
npm run build            # Construye frontend
npm run build:deploy     # Build + deploy
npm run start            # Inicia backend en producción
```

## 🚀 Despliegue en IONOS

### 1. Preparar para Producción
```bash
# Construir frontend
npm run build

# Configurar variables de entorno de producción
# Editar backend/.env con credenciales de IONOS
```

### 2. Configuración de IONOS
- **Base de datos**: PostgreSQL
- **Hosting**: Web hosting con Node.js
- **Dominio**: Configurar DNS para tu dominio

### 3. Variables de Entorno de Producción
```env
NODE_ENV=production
DB_HOST=your-ionos-db-host
DB_NAME=your-ionos-db-name
DB_USER=your-ionos-db-user
DB_PASSWORD=your-ionos-db-password
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-domain.com
```

### 4. Subir Archivos
- Subir carpeta `backend/` al servidor
- Subir carpeta `frontend/dist/` al directorio web
- Configurar `index.html` en la raíz del hosting

## 🔒 Seguridad

- **JWT** para autenticación stateless
- **bcrypt** para hash de contraseñas
- **Helmet** para headers de seguridad HTTP
- **Rate limiting** para prevenir abuso
- **Validación** de entrada en todas las rutas
- **CORS** configurado para producción

## 📱 Características del Frontend

- **Diseño Responsivo** - Funciona en móvil y desktop
- **Navegación Intuitiva** - Fácil acceso a todas las funciones
- **Formularios Validados** - Validación en tiempo real
- **Estados de Carga** - Feedback visual para el usuario
- **Manejo de Errores** - Mensajes claros y útiles

## 🎯 Funcionalidades Principales

### Para Usuarios
- **Registro/Login** - Sistema de autenticación seguro
- **Dashboard** - Vista general de items disponibles
- **Enviar Cata** - Puntuación de items por categorías
- **Ver Resultados** - Rankings y estadísticas detalladas

### Para Administradores
- **Gestión de Items** - CRUD completo de items
- **Gestión de Categorías** - Añadir/eliminar categorías
- **Gestión de Usuarios** - Control de usuarios y permisos
- **Analíticas** - Estadísticas detalladas del sistema

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

## 🔮 Roadmap

- [ ] Sistema de concursos múltiples
- [ ] Notificaciones en tiempo real
- [ ] Exportación de datos a Excel/CSV
- [ ] API pública para desarrolladores
- [ ] Sistema de badges y logros
- [ ] Integración con redes sociales

---

**Desarrollado con ❤️ para la comunidad de catadores** 