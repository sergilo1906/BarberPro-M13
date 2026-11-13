import { initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
export interface ConfiguracionFirebase {
    modo: string;
    usarEmuladores: boolean;
    usarEmuladorFunciones: boolean;
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    appUrl: string;
}
let servicios: {
    aplicacionFirebase: FirebaseApp;
    autenticacion: Auth;
    baseDatos: Firestore;
    funcionesRemotas: Functions;
} | null = null;
// Leemos la configuracion publica al compilar; no contiene claves administrativas.
export function leerConfiguracionFirebase(): ConfiguracionFirebase {
    return {
        modo: import.meta.env.PUBLIC_FIREBASE_MODE || "desactivado",
        usarEmuladores: import.meta.env.PUBLIC_USE_FIREBASE_EMULATORS === "1",
        usarEmuladorFunciones: import.meta.env.PUBLIC_USE_FUNCTIONS_EMULATOR === "1",
        apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || "",
        authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "",
        appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || "",
        appUrl: import.meta.env.PUBLIC_APP_URL || "",
    };
}
// Impedimos mezclar el proyecto ficticio local con una conexion WEB real.
export function comprobarConfiguracionFirebase(config: ConfiguracionFirebase, origen: string): string | null {
    if (!config.apiKey || !config.appId || !config.projectId || !config.authDomain) {
        return "Configuracion Firebase incompleta.";
    }
    let url: URL;
    try {
        url = new URL(origen);
    }
    catch {
        return "Origen no valido.";
    }
    if (config.modo === "local") {
        if (!config.usarEmuladores || !config.usarEmuladorFunciones || !["localhost", "127.0.0.1"].includes(url.hostname)
            || config.projectId !== "demo-barberpro-m13" || config.authDomain !== "localhost") {
            return "Modo local: solo localhost, emuladores y proyecto ficticio.";
        }
        return null;
    }
    if (config.modo !== "web" || config.usarEmuladores || config.usarEmuladorFunciones || url.protocol !== "https:"
        || config.projectId.startsWith("demo-") || config.authDomain !== config.projectId + ".firebaseapp.com") {
        return "Configuracion WEB no valida.";
    }
    try {
        const canonica = new URL(config.appUrl);
        if (canonica.protocol !== "https:" || canonica.origin !== url.origin || canonica.pathname !== "/") {
            return "El origen no coincide con PUBLIC_APP_URL.";
        }
    }
    catch {
        return "Falta PUBLIC_APP_URL HTTPS.";
    }
    return null;
}
// Creamos los SDK una sola vez y conectamos los emuladores antes de usarlos.
export function obtenerServiciosFirebase() {
    const config = leerConfiguracionFirebase();
    if (config.modo === "desactivado") {
        return null;
    }
    const error = comprobarConfiguracionFirebase(config, typeof window === "undefined" ? "" : window.location.origin);
    if (error) {
        throw new Error(error);
    }
    if (servicios) {
        return servicios;
    }
    const aplicacionFirebase = initializeApp(config, "barberpro-m13");
    const autenticacion = initializeAuth(aplicacionFirebase, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence] });
    const baseDatos = getFirestore(aplicacionFirebase);
    const funcionesRemotas = getFunctions(aplicacionFirebase, "europe-west1");
    if (config.modo === "local") {
        connectAuthEmulator(autenticacion, "http://127.0.0.1:9099", { disableWarnings: true });
        connectFirestoreEmulator(baseDatos, "127.0.0.1", 8088);
        connectFunctionsEmulator(funcionesRemotas, "127.0.0.1", 5001);
    }
    servicios = {
        aplicacionFirebase, autenticacion, baseDatos, funcionesRemotas
    };
    return servicios;
}
