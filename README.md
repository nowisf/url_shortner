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
3. Ve a la sección "Table Editor" y crea una nueva tabla con la siguiente estructura:

   - **Nombre de la tabla**: `urls` (¡importante usar minúsculas!)
   - **Columnas**:
     - `id` (tipo: text, Primary Key)
     - `original_url` (tipo: text, Not Null)
     - `creation_date` (tipo: text, Not Null)
     - `times_clicked` (tipo: integer, Not Null, Default: 0)
     - `short_url` (tipo: text, Not Null)

   Alternativamente, puedes usar el SQL Editor y ejecutar:

```sql
-- Crear la tabla en el esquema public
CREATE TABLE public.urls (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  creation_date TEXT NOT NULL,
  times_clicked INTEGER NOT NULL DEFAULT 0,
  short_url TEXT NOT NULL
);

-- IMPORTANTE: Habilitar Row Level Security (RLS) para la tabla
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir operaciones anónimas
CREATE POLICY "Permitir SELECT anónimo" ON public.urls FOR SELECT USING (true);
CREATE POLICY "Permitir INSERT anónimo" ON public.urls FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir UPDATE anónimo" ON public.urls FOR UPDATE USING (true);
```

4. Verifica los permisos de Row Level Security (RLS):

   - Ve a "Authentication" → "Policies" y asegúrate de que la tabla `urls` tenga políticas para permitir SELECT, INSERT y UPDATE.
   - Si no están configuradas, crea las políticas con acceso "Public" (para usuarios anónimos).

5. En la sección "Project Settings" → "API", copia:
   - **Project URL**: Para la variable `SUPABASE_URL`
   - **anon/public API key**: Para la variable `SUPABASE_KEY`

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
