# PHP Backend Functions

## 📊 **Funciones Disponibles**

### 1. **check-user.php** - Verificar Usuario
**Endpoint:** `check-user.php?username=USERNAME`

**Respuesta:**
```json
{
  "exists": true,
  "url": "https://letterboxd.com/username/"
}
```

### 2. **get-movies.php** - Obtener Películas (Ordenadas por Rating)
**Endpoint:** `get-movies.php?username=USERNAME&simple=1`

**Respuesta Completa:**
```json
{
  "count": 150,
  "execution_time_ms": 2500.75,
  "movies": [
    {
      "title": "Movie Title",
      "url": "https://letterboxd.com/film/movie/",
      "rating": "★★★★★"
    }
  ]
}
```

**Respuesta Simple (simple=1):**
```json
{
  "count": 150,
  "execution_time_ms": 2500.75,
  "movies": [
    {
      "name": "Movie Title",
      "rating": 5.0
    }
  ]
}
```

**Nota:** Las películas vienen ordenadas por rating (de mayor a menor) desde la página de ratings de Letterboxd. Todas las películas en esta página están calificadas, por lo que no se filtran por rating.

### 3. **get-movies-with-progress.php** - Obtener Películas con Progreso 📊
**Endpoint:** `get-movies-with-progress.php?username=USERNAME&simple=1`

**Respuesta Completa:**
```json
{
  "count": 150,
  "execution_time_ms": 2500.75,
  "total_movies": 150,
  "pages_scraped": 3,
  "total_pages": 3,
  "progress_percentage": 100.0,
  "movies": [
    {
      "title": "Movie Title",
      "url": "https://letterboxd.com/film/movie/",
      "rating": "★★★★★"
    }
  ]
}
```

**Respuesta Simple (simple=1):**
```json
{
  "count": 150,
  "execution_time_ms": 2500.75,
  "total_movies": 150,
  "pages_scraped": 3,
  "total_pages": 3,
  "progress_percentage": 100.0,
  "movies": [
    {
      "name": "Movie Title",
      "rating": 5.0
    }
  ]
}
```

**Nota:** Esta versión incluye información de progreso basada en el conteo total de películas y 72 películas por página.

### 4. **count-movies.php** - Contar Películas ⚡
**Endpoint:** `count-movies.php?username=USERNAME`

**Respuesta:**
```json
{
  "username": "username",
  "total_movies": 150,
  "count": 150,
  "execution_time_ms": 150.25,
  "success": true,
  "source": "ratings_histogram"
}
```
**Endpoint:** `get-movie-count.php?username=USERNAME`

**Respuesta:**
```json
{
  "username": "username",
  "success": true,
  "stats": {
    "total_movies": 150,
    "average_rating": 3.7,
    "rated_movies": 150,
    "rating_distribution": {
      "5_stars": 20,
      "4_stars": 45,
      "3_stars": 50,
      "2_stars": 25,
      "1_star": 8,
      "half_star": 2
    }
  },
  "movies": [...],
  "execution_time_ms": 2500.75
}
```

## 🚀 **Cómo Usar**

### **Ejemplo de Uso en JavaScript:**

```javascript
// Verificar si existe un usuario
fetch('/php-backend/check-user.php?username=tarantino')
  .then(response => response.json())
  .then(data => {
    if (data.exists) {
      console.log('Usuario existe!');
    }
  });

// Contar películas de un usuario
fetch('/php-backend/count-movies.php?username=tarantino')
  .then(response => response.json())
  .then(data => {
    console.log(`${data.username} ha visto ${data.total_movies} películas`);
    console.log(`Tiempo de ejecución: ${data.execution_time_ms}ms`);
    console.log(`Fuente: ${data.source}`);
  });
```

## 📈 **Diferencias Entre Funciones**

| Función | Propósito | Velocidad | Datos |
|---------|-----------|-----------|-------|
| `count-movies.php` | Solo contar | ⚡ Rápida | Básico |
| `get-movies.php` | Lista de películas ordenadas | 🐌 Lenta | Completo |
| `get-movies-with-progress.php` | Lista con progreso | 🐌 Lenta | Completo + Progreso |

## 🔧 **Parámetros**

### **Parámetros Comunes:**
- `username`: Nombre de usuario de Letterboxd (requerido)

### **Parámetros Específicos:**
- `simple=1`: Para `get-movies.php` - devuelve formato simplificado

## ⚠️ **Notas Importantes**

- **Rate Limiting**: Letterboxd puede limitar requests muy frecuentes
- **Tiempo de Respuesta**: Las funciones que obtienen datos completos pueden tardar varios segundos
- **Sanitización**: Los usernames se sanitizan automáticamente
- **CORS**: Todas las funciones permiten CORS para desarrollo local

## 🧪 **Testing**

```bash
# Probar funciones localmente
curl "http://localhost:8000/count-movies.php?username=tarantino"
curl "http://localhost:8000/get-movie-count.php?username=tarantino"
``` 