import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

let db;

// Verificar el entorno para usar la base de datos correspondiente
if (process.env.NODE_ENV === "production") {
  // Configuración para Supabase en producción
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  console.log(
    "SUPABASE_URL configurada:",
    !!supabaseUrl,
    supabaseUrl ? `(${supabaseUrl.substring(0, 15)}...)` : ""
  );
  console.log(
    "SUPABASE_KEY configurada:",
    !!supabaseKey,
    supabaseKey ? `(longitud: ${supabaseKey.length})` : ""
  );

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Error: SUPABASE_URL y SUPABASE_KEY deben estar definidos en variables de entorno"
    );
    process.exit(1);
  }

  // Crear cliente de Supabase
  console.log("Iniciando conexión con Supabase...");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Función para verificar la conexión
  const checkConnection = () => {
    console.log("Verificando conexión con Supabase...");
    return supabase
      .from("urls")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (error) {
          console.error("Error al conectar con Supabase:", error);
          console.log("Detalles del error:", JSON.stringify(error));

          // Intentar detectar si es un problema de credenciales o permisos
          if (error.code === "PGRST301" || error.message?.includes("JWT")) {
            console.error(
              "Posible problema con la clave de API o autenticación"
            );
          } else if (error.code === "PGRST106") {
            console.error(
              "Problema con el esquema o nombre de tabla. Asegúrate que la tabla 'urls' existe en el esquema 'public'"
            );
          }
          return false;
        }
        console.log(
          `Conectado a Supabase. Tabla 'urls' tiene ${count || 0} registros.`
        );
        return true;
      })
      .catch((err) => {
        console.error(
          "Error no controlado al verificar conexión con Supabase:",
          err
        );
        return false;
      });
  };

  // Agregar un retraso antes de verificar la conexión
  setTimeout(() => {
    checkConnection();
  }, 2000);

  // Crear una versión compatible con la API de better-sqlite3
  db = {
    prepare: (text) => {
      return {
        run: async (...params) => {
          try {
            // Adaptar consultas INSERT, UPDATE, DELETE para Supabase
            if (text.trim().toLowerCase().startsWith("insert into urls")) {
              console.log("Ejecutando INSERT en Supabase");
              const { data, error } = await supabase.from("urls").insert([
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
              return data;
            } else if (
              text
                .trim()
                .toLowerCase()
                .includes("update urls set times_clicked")
            ) {
              console.log("Ejecutando UPDATE contador en Supabase");
              // Intentar update directo sin rpc
              const getResult = await supabase
                .from("urls")
                .select("times_clicked")
                .eq("short_url", params[0])
                .single();

              if (getResult.error) {
                console.error("Error al obtener contador:", getResult.error);
                throw getResult.error;
              }

              const newCount = (getResult.data?.times_clicked || 0) + 1;
              const updateResult = await supabase
                .from("urls")
                .update({ times_clicked: newCount })
                .eq("short_url", params[0]);

              if (updateResult.error) {
                console.error(
                  "Error al actualizar contador:",
                  updateResult.error
                );
                throw updateResult.error;
              }
              return updateResult.data;
            }
          } catch (err) {
            console.error("Error en run:", err);
            throw err;
          }
        },
        get: async (...params) => {
          try {
            // Adaptar consultas SELECT para Supabase
            if (text.includes("FROM urls WHERE short_url =")) {
              console.log(`Buscando URL con short_url=${params[0]}`);
              const { data, error } = await supabase
                .from("urls")
                .select("*")
                .eq("short_url", params[0])
                .single();

              if (error) {
                // Si es error de no encontrado, devolver null
                if (error.code === "PGRST116") return null;
                console.error("Error en get (short_url):", error);
                throw error;
              }
              return data;
            } else if (text.includes("FROM urls WHERE original_url =")) {
              console.log(
                `Buscando URL con original_url=${params[0].substring(0, 30)}...`
              );
              const { data, error } = await supabase
                .from("urls")
                .select("*")
                .eq("original_url", params[0])
                .single();

              if (error) {
                // Si es error de no encontrado, devolver null
                if (error.code === "PGRST116") return null;
                console.error("Error en get (original_url):", error);
                throw error;
              }
              return data;
            }
            return null;
          } catch (err) {
            console.error("Error en get:", err);
            console.error("Texto de la consulta:", text);
            console.error("Parámetros:", params);
            throw err;
          }
        },
        all: async (...params) => {
          try {
            console.log("Consultando todas las URLs");
            const { data, error } = await supabase.from("urls").select("*");
            if (error) {
              console.error("Error en all:", error);
              throw error;
            }
            return data || [];
          } catch (err) {
            console.error("Error en all:", err);
            throw err;
          }
        },
      };
    },
    exec: async (text) => {
      try {
        // Esta función solo se usa durante la inicialización
        console.log("Las tablas deben ser creadas manualmente en Supabase");
        return null;
      } catch (err) {
        console.error("Error en exec:", err);
        throw err;
      }
    },
  };
} else {
  // SQLite para desarrollo
  db = new Database("database.sqlite");

  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id TEXT PRIMARY KEY,
      original_url TEXT NOT NULL,
      creation_date TEXT NOT NULL,
      times_clicked INTEGER NOT NULL DEFAULT 0,
      short_url TEXT NOT NULL
    )
  `);
}

export { db };
