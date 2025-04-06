import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

/**
 * Configuración de la conexión a Supabase
 * SCHEMA: 'public' - Esquema utilizado para la tabla urls
 */
const SCHEMA = "public";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validación de variables de entorno
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: SUPABASE_URL y SUPABASE_KEY son obligatorias en el archivo .env"
  );
  process.exit(1);
}

// Log de configuración (versión segura sin mostrar claves completas)
console.log(
  "SUPABASE_URL:",
  supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : "No configurada"
);
console.log(
  "SUPABASE_KEY:",
  supabaseKey
    ? `Configurada (${supabaseKey.length} caracteres)`
    : "No configurada"
);

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Verificar conexión a la base de datos
setTimeout(async () => {
  console.log("Verificando conexión con Supabase...");

  try {
    // Verificar autenticación
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error("Error de autenticación:", authError);
      return;
    }

    // Verificar acceso a la tabla urls
    const { count, error: tableError } = await supabase
      .from("urls")
      .select("*", { count: "exact", head: true });

    if (tableError) {
      console.error("Error al verificar tabla 'urls':", tableError);
      console.log(`
Necesitas crear la tabla 'urls' en Supabase con estos comandos SQL:

CREATE TABLE ${SCHEMA}.urls (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  creation_date TEXT NOT NULL,
  times_clicked INTEGER NOT NULL DEFAULT 0,
  short_url TEXT NOT NULL
);

ALTER TABLE ${SCHEMA}.urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role access" ON ${SCHEMA}.urls
  FOR ALL 
  TO service_role 
  USING (true);
`);
    } else {
      console.log(
        `Conexión exitosa. Tabla 'urls' tiene ${count || 0} registros.`
      );
    }
  } catch (err) {
    console.error("Error al verificar conexión:", err);
  }
}, 1000);

/**
 * Adaptador para mantener compatibilidad con la API de SQLite
 * Convierte las operaciones SQL a llamadas de la API de Supabase
 */
const db = {
  prepare: (text) => {
    return {
      run: async (...params) => {
        try {
          // INSERT
          if (text.trim().toLowerCase().startsWith("insert into urls")) {
            const { error } = await supabase.from("urls").insert([
              {
                id: params[0],
                original_url: params[1],
                creation_date: params[2],
                short_url: params[3],
              },
            ]);

            if (error) {
              console.error("Error en insert:", error);
              throw error;
            }
            return true;
          }
          // UPDATE contador
          else if (text.includes("update urls set times_clicked")) {
            const { data, error: getError } = await supabase
              .from("urls")
              .select("times_clicked")
              .eq("short_url", params[0])
              .single();

            if (getError) {
              console.error("Error al obtener contador:", getError);
              return null;
            }

            const newCount = (data?.times_clicked || 0) + 1;
            const { error: updateError } = await supabase
              .from("urls")
              .update({ times_clicked: newCount })
              .eq("short_url", params[0]);

            if (updateError) {
              console.error("Error al actualizar contador:", updateError);
            }
            return true;
          }
          return null;
        } catch (err) {
          console.error("Error en operación de base de datos:", err);
          return null;
        }
      },
      get: async (...params) => {
        try {
          // Buscar por short_url
          if (text.includes("FROM urls WHERE short_url =")) {
            const { data, error } = await supabase
              .from("urls")
              .select("*")
              .eq("short_url", params[0])
              .single();

            if (error && error.code !== "PGRST116") {
              console.error("Error en búsqueda:", error);
            }
            return data;
          }
          // Buscar por original_url
          else if (text.includes("FROM urls WHERE original_url =")) {
            const { data, error } = await supabase
              .from("urls")
              .select("*")
              .eq("original_url", params[0])
              .single();

            if (error && error.code !== "PGRST116") {
              console.error("Error en búsqueda:", error);
            }
            return data;
          }
          return null;
        } catch (err) {
          console.error("Error en búsqueda:", err);
          return null;
        }
      },
      all: async () => {
        try {
          const { data, error } = await supabase.from("urls").select("*");
          if (error) {
            console.error("Error al listar URLs:", error);
            return [];
          }
          return data || [];
        } catch (err) {
          console.error("Error al listar URLs:", err);
          return [];
        }
      },
    };
  },
  exec: () => {
    // No-op: Supabase no requiere ejecución de comandos SQL directos
    return null;
  },
};

export { db };
