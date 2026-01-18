# 🔒 HTTPS Auto-Redirect Setup

## ✅ **Configuración Completada**

He recreado todo el sistema de redirección HTTPS automática:

### **Archivos Creados/Modificados:**

1. **`.htaccess`** - Redirección automática del servidor
2. **`index.html`** - Meta tags de seguridad + JavaScript de redirección
3. **`frontend/deploy.js`** - Incluye `.htaccess` en el despliegue
4. **`frontend/check-https.js`** - Script de verificación
5. **`frontend/package.json`** - Comando de verificación

## 🚀 **Cómo Usar:**

### **Despliegue con HTTPS:**
```bash
cd frontend
npm run build:deploy
```

### **Verificar HTTPS:**
```bash
cd frontend
npm run check-https
```

## 🔧 **Qué Hace Cada Parte:**

### **1. .htaccess (Servidor)**
- **Redirección 301**: HTTP → HTTPS automática
- **HSTS**: Fuerza HTTPS por 1 año
- **Headers de seguridad**: CSP, X-Frame-Options, etc.
- **Optimización**: Cache y compresión

### **2. index.html (Cliente)**
- **Meta tags**: Content-Security-Policy y HSTS
- **JavaScript**: Redirección adicional en el navegador
- **Excepción localhost**: Permite desarrollo local

### **3. Scripts de Verificación**
- **check-https.js**: Verifica redirección y headers
- **deploy.js**: Incluye `.htaccess` automáticamente

## 🎯 **Resultado Esperado:**

Una vez desplegado:
- `http://yourmovietasteprobablysucks.com` → redirige a HTTPS
- `https://yourmovietasteprobablysucks.com` → funciona directamente
- Headers de seguridad activos
- HSTS activo (navegadores recuerdan HTTPS)

## ⚠️ **Importante:**

**Necesitas activar SSL en IONOS primero:**
1. Panel de control IONOS
2. SSL/TLS → Let's Encrypt
3. Activar para tu dominio
4. Esperar 5-15 minutos

## 🧪 **Pruebas:**

```bash
# Verificar redirección
curl -I http://yourmovietasteprobablysucks.com

# Verificar HTTPS
curl -I https://yourmovietasteprobablysucks.com

# Verificar headers
npm run check-https
```

¡Todo listo para forzar HTTPS automáticamente! 🎉 