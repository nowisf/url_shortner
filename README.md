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
-- Crear la tabla en el esquema predeterminado
CREATE TABLE urls (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  creation_date TEXT NOT NULL,
  times_clicked INTEGER NOT NULL DEFAULT 0,
  short_url TEXT NOT NULL
);

-- IMPORTANTE: Habilitar Row Level Security (RLS) para la tabla
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- No necesitas crear políticas si usas clave de servicio (service_role)

-- Crear función para incrementar contador
CREATE OR REPLACE FUNCTION increment_url_counter(url_short_key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE urls
  SET times_clicked = times_clicked + 1
  WHERE short_url = url_short_key;
END;
$$ LANGUAGE plpgsql;
```

4. Habilita Row Level Security (RLS):

   - Ve a "Authentication" → "Policies" y asegúrate de que RLS esté habilitado para la tabla `urls`
   - **No necesitas crear políticas adicionales** si utilizas la clave de servicio

5. En la sección "Project Settings" → "API", copia:
   - **Project URL**: Para la variable `SUPABASE_URL`
   - **service_role key (secret)**: Para la variable `SUPABASE_KEY` (IMPORTANTE: usa la clave service_role, NO la anon/public)

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
- `SUPABASE_KEY`: La clave service_role (secreta) de Supabase - NUNCA uses la clave anónima
- `FRONTEND_URL`: (Opcional) La URL de tu frontend. Si no se especifica, se permitirán solicitudes desde cualquier origen.

## Seguridad

Al usar la clave service_role con Row Level Security (RLS) habilitada pero sin políticas, estás configurando la máxima seguridad:

- Solo tu backend puede acceder a los datos usando la clave service_role
- Cualquier otro cliente que intente acceder a la tabla obtendrá error o resultados vacíos
- La clave service_role debe mantenerse segura y NUNCA exponerse en el frontend

## Estructura del proyecto

- `index.js`: Punto de entrada de la aplicación
- `db.js`: Configuración de la base de datos (SQLite/Supabase)
- `utils.js`: Funciones de utilidad
- `.env`: Variables de entorno
