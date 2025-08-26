# 🚀 Guía de Despliegue en IONOS

Esta guía te ayudará a desplegar CataHouse en IONOS paso a paso.

## 📋 Requisitos Previos

- Cuenta de IONOS con hosting web
- Base de datos PostgreSQL en IONOS
- Dominio configurado
- Acceso FTP/SFTP o panel de control

## 🗄️ Configuración de Base de Datos

### 1. Crear Base de Datos PostgreSQL
1. Accede al panel de control de IONOS
2. Ve a "Bases de datos" → "PostgreSQL"
3. Crea una nueva base de datos
4. Anota los datos de conexión:
   - Host
   - Puerto
   - Nombre de base de datos
   - Usuario
   - Contraseña

### 2. Configurar Variables de Entorno
Edita `backend/.env` con los datos de IONOS:

```env
NODE_ENV=production
DB_HOST=tu-host-ionos
DB_PORT=5432
DB_NAME=tu-nombre-db
DB_USER=tu-usuario-db
DB_PASSWORD=tu-password-db
JWT_SECRET=tu-jwt-secret-super-seguro
FRONTEND_URL=https://tu-dominio.com
PORT=5000
```

## 🏗️ Preparar Aplicación para Producción

### 1. Construir Frontend
```bash
npm run build
```

### 2. Verificar Archivos
Asegúrate de que tienes:
- `frontend/dist/` - Frontend construido
- `backend/` - Código del backend
- `index.html` - Landing page principal

## 📤 Subir Archivos a IONOS

### Opción 1: Panel de Control de IONOS
1. Accede al panel de control
2. Ve a "File Manager" o "Administrador de archivos"
3. Navega al directorio raíz de tu hosting
4. Sube los archivos:
   - `index.html` → raíz del hosting
   - `frontend/dist/*` → directorio web público
   - `backend/` → directorio del servidor

### Opción 2: FTP/SFTP
```bash
# Conectar por FTP
ftp tu-dominio.com

# Subir archivos
put index.html
cd public_html
mput frontend/dist/*
cd ..
mput backend/*
```

### Opción 3: Git (si IONOS lo soporta)
```bash
git remote add ionos tu-repo-ionos
git push ionos main
```

## ⚙️ Configuración del Servidor

### 1. Configurar Node.js
En el panel de control de IONOS:
1. Ve a "Hosting" → "Tu plan"
2. Busca "Node.js" o "Entorno de ejecución"
3. Activa Node.js
4. Configura la versión (recomendado: 16.x o superior)

### 2. Configurar Punto de Entrada
Crea un archivo `package.json` en la raíz del backend:

```json
{
  "name": "catahouse-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^6.0.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.9.0",
    "dotenv": "^16.0.3",
    "express-rate-limit": "^6.7.0",
    "express-validator": "^6.14.3"
  }
}
```

### 3. Instalar Dependencias
En el panel de control o por SSH:
```bash
cd backend
npm install --production
```

## 🌐 Configuración del Dominio

### 1. DNS
Configura en tu panel de DNS:
- **A Record**: `@` → IP de tu hosting
- **CNAME**: `www` → tu-dominio.com

### 2. SSL/HTTPS
1. Activa SSL en el panel de control
2. Configura redirección de HTTP a HTTPS
3. Verifica que el certificado esté activo

## 🔧 Configuración de la Aplicación

### 1. Ajustar Rutas del Frontend
En `frontend/src/App.jsx`, asegúrate de que las rutas funcionen:
```jsx
<BrowserRouter basename="/app">
  {/* ... rutas ... */}
</BrowserRouter>
```

### 2. Configurar API Base URL
En el frontend, ajusta la URL base de la API:
```javascript
// En frontend/src/contexts/AuthContext.jsx
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://tu-dominio.com/api' 
  : 'http://localhost:5000/api'
```

### 3. Configurar CORS en Backend
En `backend/server.js`, ajusta CORS:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://tu-dominio.com',
  credentials: true
}))
```

## 🚀 Iniciar Aplicación

### 1. Iniciar Backend
En el panel de control o por SSH:
```bash
cd backend
npm start
```

### 2. Verificar Funcionamiento
- Frontend: https://tu-dominio.com
- API: https://tu-dominio.com/api/health
- Landing: https://tu-dominio.com (redirige a /app)

## 📊 Monitoreo y Mantenimiento

### 1. Logs
Revisa los logs en el panel de control:
- Logs de error
- Logs de acceso
- Logs de la aplicación

### 2. Base de Datos
- Monitorea el uso de la base de datos
- Configura backups automáticos
- Optimiza consultas si es necesario

### 3. Rendimiento
- Usa CDN para imágenes estáticas
- Comprime respuestas del servidor
- Optimiza el tamaño del bundle

## 🔒 Seguridad en Producción

### 1. Variables de Entorno
- Nunca subas `.env` al repositorio
- Usa variables de entorno del hosting
- Cambia JWT_SECRET en producción

### 2. HTTPS
- Fuerza HTTPS en todas las rutas
- Configura HSTS headers
- Verifica certificado SSL

### 3. Rate Limiting
- Mantén rate limiting activo
- Ajusta límites según tu tráfico
- Monitorea intentos de abuso

## 🆘 Solución de Problemas

### Error: "Cannot find module"
```bash
cd backend
npm install
```

### Error: "Database connection failed"
- Verifica credenciales en `.env`
- Comprueba que la base de datos esté activa
- Verifica firewall y acceso de red

### Error: "Port already in use"
- Cambia el puerto en `.env`
- Verifica que no haya otros servicios usando el puerto

### Frontend no carga
- Verifica que `index.html` esté en la raíz
- Comprueba rutas en el build
- Verifica configuración de DNS

## 📞 Soporte de IONOS

Si tienes problemas específicos de IONOS:
1. Consulta la documentación oficial
2. Contacta con soporte técnico
3. Usa el chat en vivo del panel de control

## ✅ Checklist de Despliegue

- [ ] Base de datos PostgreSQL creada
- [ ] Variables de entorno configuradas
- [ ] Frontend construido (`npm run build`)
- [ ] Archivos subidos al hosting
- [ ] Dependencias instaladas en el servidor
- [ ] Node.js activado en el hosting
- [ ] SSL/HTTPS configurado
- [ ] DNS configurado correctamente
- [ ] Backend iniciado y funcionando
- [ ] API respondiendo correctamente
- [ ] Frontend accesible
- [ ] Usuarios de prueba funcionando

---

**¡Tu aplicación CataHouse debería estar funcionando en IONOS! 🎉** 