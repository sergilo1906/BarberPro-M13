import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";

export interface ConfiguracionFirebaseLocal {
  usarEmuladores: boolean;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface ServiciosFirebase {
  aplicacionFirebase: FirebaseApp;
  autenticacion: Auth;
  baseDatos: Firestore;
  funcionesRemotas: Functions;
}

let serviciosFirebase: ServiciosFirebase | null = null;

export function leerConfiguracionFirebase(): ConfiguracionFirebaseLocal {
  const usarEmuladores = import.meta.env.PUBLIC_USE_FIREBASE_EMULATORS === "1"
    || import.meta.env.PUBLIC_USE_FUNCTIONS_EMULATOR === "1";

  return {
    usarEmuladores,
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || "",
  };
}

export function comprobarConfiguracionFirebase(
  configuracionFirebase: ConfiguracionFirebaseLocal,
  nombreHost: string,
): string | null {
  if (nombreHost !== "localhost" && nombreHost !== "127.0.0.1") {
    return "Firebase local solo esta disponible desde localhost o 127.0.0.1.";
  }
  if (configuracionFirebase.projectId !== "demo-barberpro-m13") {
    return "Solo se admite el proyecto ficticio demo-barberpro-m13.";
  }
  if (configuracionFirebase.authDomain !== "localhost") {
    return "El dominio de autenticacion local debe ser localhost.";
  }
  if (!configuracionFirebase.apiKey || !configuracionFirebase.appId) {
    return "Falta la configuracion ficticia de Firebase. Consulta .env.example.";
  }
  return null;
}

export function obtenerServiciosFirebase(
  nombreHost = typeof window === "undefined" ? "" : window.location.hostname,
): ServiciosFirebase | null {
  const configuracionFirebase = leerConfiguracionFirebase();

  // Importar este módulo nunca inicia servicios. El modo público funciona desconectado.
  if (!configuracionFirebase.usarEmuladores) {
    return null;
  }
  const mensajeError = comprobarConfiguracionFirebase(configuracionFirebase, nombreHost);
  if (mensajeError !== null) {
    throw new Error(mensajeError);
  }
  if (serviciosFirebase !== null) {
    return serviciosFirebase;
  }

  let aplicacionFirebase = getApps().find((aplicacion) => aplicacion.name === "barberpro-m13-local");
  if (aplicacionFirebase === undefined) {
    aplicacionFirebase = initializeApp(configuracionFirebase, "barberpro-m13-local");
  }

  // El acceso por contraseña no necesita el resolver OAuth que carga iframes externos en móvil.
  const autenticacion = initializeAuth(aplicacionFirebase, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
  });
  const baseDatos = getFirestore(aplicacionFirebase);
  const funcionesRemotas = getFunctions(aplicacionFirebase, "europe-west1");

  // Los tres SDK se conectan antes de entregar servicios al resto de módulos.
  connectAuthEmulator(autenticacion, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(baseDatos, "127.0.0.1", 8088);
  connectFunctionsEmulator(funcionesRemotas, "127.0.0.1", 5001);

  serviciosFirebase = { aplicacionFirebase, autenticacion, baseDatos, funcionesRemotas };
  return serviciosFirebase;
}
