-- SQL para diagnosticar la existencia de la tabla urls en diferentes esquemas
SELECT 
  table_schema, 
  table_name 
FROM 
  information_schema.tables 
WHERE 
  table_name = 'urls';

-- Si la tabla existe en el esquema 'public', puedes:
-- 1. Usar la tabla existente modificando db.js para usar el esquema 'public'
-- 2. Eliminar la tabla y crearla en el esquema 'api'
-- DROP TABLE IF EXISTS public.urls;

-- Si decides usar el esquema api, ejecuta:
CREATE TABLE IF NOT EXISTS api.urls (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  creation_date TEXT NOT NULL,
  times_clicked INTEGER NOT NULL DEFAULT 0,
  short_url TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE api.urls ENABLE ROW LEVEL SECURITY;

-- Asignar permisos
GRANT ALL ON api.urls TO service_role, anon;

-- Crear política de acceso (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polrelid = 'api.urls'::regclass 
    AND polname = 'Allow full access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow full access" ON api.urls 
      FOR ALL 
      TO service_role 
      USING (true)';
  END IF;
END
$$; 