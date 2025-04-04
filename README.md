# URL Shortener

Un servicio para acortar URLs con back-end Express y base de datos SQLite en desarrollo y Supabase en producción.

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

## Desarrollo

```bash
npm run dev
```

Esto iniciará el servidor en modo desarrollo usando SQLite como base de datos.

## Producción con Supabase

### Configuración en Supabase

1. Crea una cuenta en [Supabase](https://supabase.com/)
2. Crea un nuevo proyecto
3. Ve a la sección "SQL Editor" y ejecuta el siguiente SQL para crear la tabla:

```sql
-- Crear la tabla
CREATE TABLE urls (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  creation_date TEXT NOT NULL,
  times_clicked INTEGER NOT NULL DEFAULT 0,
  short_url TEXT NOT NULL
);

-- IMPORTANTE: Habilitar Row Level Security (RLS) para la tabla
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir operaciones anónimas
CREATE POLICY "Permitir SELECT anónimo" ON urls FOR SELECT USING (true);
CREATE POLICY "Permitir INSERT anónimo" ON urls FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir UPDATE anónimo" ON urls FOR UPDATE USING (true);

-- Función para incrementar el contador de clics
CREATE OR REPLACE FUNCTION increment_counter(value integer)
RETURNS integer
LANGUAGE sql
AS $$
  SELECT value + 1;
$$;
```

4. En la sección "Project Settings" → "API", copia la URL y la clave anónima para usarlas en tus variables de entorno.

### Configuración en Render o tu proveedor de hosting

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
- `SUPABASE_KEY`: La clave anónima/pública de Supabase
- `FRONTEND_URL`: (Opcional) La URL de tu frontend. Si no se especifica, se permitirán solicitudes desde cualquier origen.

## Estructura del proyecto

- `index.js`: Punto de entrada de la aplicación
- `db.js`: Configuración de la base de datos (SQLite/Supabase)
- `utils.js`: Funciones de utilidad
- `.env`: Variables de entorno
