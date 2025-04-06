# URL Shortener

Un servicio para acortar URLs con back-end Express y base de datos Supabase.

## Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd url_shortner

# Instalar dependencias
npm install

# Crear archivo .env basado en el ejemplo
cp .env.example .env
# Editar .env con tus configuraciones
```

## Configuración de Supabase (Nuevo proyecto)

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto:

   - Elige un nombre para el proyecto
   - Establece una contraseña segura para la base de datos
   - Selecciona una región cercana a tus usuarios
   - Espera a que se cree el proyecto (1-2 minutos)

3. Configura el archivo `.env`:

   - Busca `SUPABASE_URL` y `SUPABASE_KEY` en Project Settings > API
   - Para `SUPABASE_URL`: Usa "Project URL"
   - Para `SUPABASE_KEY`: Usa la clave "service_role key" (¡NUNCA expongas esta clave en el frontend!)

4. Crea la tabla en Supabase:
   - Ve a SQL Editor
   - Ejecuta los siguientes comandos SQL:

```sql
-- Crear tabla urls
CREATE TABLE urls (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  creation_date TEXT NOT NULL,
  times_clicked INTEGER NOT NULL DEFAULT 0,
  short_url TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir operaciones
CREATE POLICY "Allow service_role access" ON urls
  FOR ALL
  TO service_role
  USING (true);
```

## Ejecución

```bash
# Para desarrollo
npm run dev

# Para producción
npm start
```

## API Endpoints

- `POST /shortner`: Crea una URL acortada

  - Body: `{ "url": "https://example.com" }`
  - Respuesta: `{ "fullShortUrl": "http://localhost:3000/abc123" }`

- `GET /:shortUrl`: Redirecciona a la URL original

- `GET /stats/:shortUrl`: Obtiene estadísticas de la URL
  - Respuesta: `{ "original_url": "https://example.com", "times_clicked": 5 }`

## Configuración en Render o tu proveedor de hosting

1. Crea un nuevo servicio Web
2. Conecta con tu repositorio de GitHub
3. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Variables de entorno en el hosting

Configura las siguientes variables:

- `NODE_ENV`: `production`
- `PORT`: `10000` (o el puerto que asigne tu host)
- `SUPABASE_URL`: La URL de tu proyecto de Supabase
- `SUPABASE_KEY`: La clave service_role (secreta) de Supabase
- `FRONTEND_URL`: (Opcional) La URL de tu frontend

## Seguridad

Importante:

- La clave `service_role` otorga acceso completo a tu base de datos
- NUNCA expongas esta clave en el frontend o código público
- Usa RLS (Row Level Security) para proteger tus datos

## Solución de problemas

Si enfrentas problemas de conexión:

1. Verifica que las claves en `.env` sean correctas
2. Asegúrate de que la tabla se haya creado correctamente en Supabase
3. Confirma que estás usando la clave `service_role` para el backend

## Estructura del proyecto

- `index.js`: Punto de entrada de la aplicación y rutas
- `db.js`: Configuración de la conexión a Supabase
- `utils.js`: Funciones de utilidad
- `.env`: Variables de entorno
