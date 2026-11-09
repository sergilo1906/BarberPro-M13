import { afterEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: "barberpro-m13-local" })),
  initializeAuth: vi.fn(() => ({})),
  getFirestore: vi.fn(() => ({})),
  getFunctions: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  connectFunctionsEmulator: vi.fn(),
}));

vi.mock("firebase/app", () => ({ getApps: () => [], initializeApp: sdk.initializeApp }));
vi.mock("firebase/auth", () => ({ initializeAuth: sdk.initializeAuth, connectAuthEmulator: sdk.connectAuthEmulator,
  indexedDBLocalPersistence: {}, browserLocalPersistence: {}, inMemoryPersistence: {} }));
vi.mock("firebase/firestore", () => ({ getFirestore: sdk.getFirestore, connectFirestoreEmulator: sdk.connectFirestoreEmulator }));
vi.mock("firebase/functions", () => ({ getFunctions: sdk.getFunctions, connectFunctionsEmulator: sdk.connectFunctionsEmulator }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

function configurarEmuladores(): void {
  vi.stubEnv("PUBLIC_USE_FIREBASE_EMULATORS", "1");
  vi.stubEnv("PUBLIC_USE_FUNCTIONS_EMULATOR", "0");
  vi.stubEnv("PUBLIC_FIREBASE_API_KEY", "demo-api-key");
  vi.stubEnv("PUBLIC_FIREBASE_AUTH_DOMAIN", "localhost");
  vi.stubEnv("PUBLIC_FIREBASE_PROJECT_ID", "demo-barberpro-m13");
  vi.stubEnv("PUBLIC_FIREBASE_APP_ID", "1:123456789:web:demo");
}

describe("Configuración Firebase aislada", () => {
  it("no inicializa ningún SDK al importar ni al consultar el modo desconectado", async () => {
    vi.stubEnv("PUBLIC_USE_FIREBASE_EMULATORS", "0");
    vi.stubEnv("PUBLIC_USE_FUNCTIONS_EMULATOR", "0");
    const firebase = await import("../../src/datos/firebase");
    expect(sdk.initializeApp).not.toHaveBeenCalled();
    expect(firebase.obtenerServiciosFirebase("localhost")).toBeNull();
    expect(sdk.initializeAuth).not.toHaveBeenCalled();
    expect(sdk.getFirestore).not.toHaveBeenCalled();
    expect(sdk.getFunctions).not.toHaveBeenCalled();
  });

  it("rechaza un proyecto real antes de inicializar SDK", async () => {
    configurarEmuladores();
    vi.stubEnv("PUBLIC_FIREBASE_PROJECT_ID", "proyecto-ajeno");
    const firebase = await import("../../src/datos/firebase");
    expect(() => firebase.obtenerServiciosFirebase("localhost")).toThrow("proyecto ficticio");
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });

  it("rechaza un host remoto aunque el proyecto sea demo", async () => {
    configurarEmuladores();
    const firebase = await import("../../src/datos/firebase");
    expect(() => firebase.obtenerServiciosFirebase("ejemplo.test")).toThrow("localhost");
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });

  it("rechaza una configuración incompleta", async () => {
    configurarEmuladores();
    vi.stubEnv("PUBLIC_FIREBASE_API_KEY", "");
    const firebase = await import("../../src/datos/firebase");
    expect(() => firebase.obtenerServiciosFirebase("127.0.0.1")).toThrow("Falta");
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });

  it("conecta los tres emuladores y conserva una sola instancia", async () => {
    configurarEmuladores();
    const firebase = await import("../../src/datos/firebase");
    const servicios = firebase.obtenerServiciosFirebase("127.0.0.1");
    expect(servicios).not.toBeNull();
    expect(sdk.connectAuthEmulator).toHaveBeenCalledWith(servicios?.autenticacion, "http://127.0.0.1:9099", { disableWarnings: true });
    expect(sdk.connectFirestoreEmulator).toHaveBeenCalledWith(servicios?.baseDatos, "127.0.0.1", 8088);
    expect(sdk.connectFunctionsEmulator).toHaveBeenCalledWith(servicios?.funcionesRemotas, "127.0.0.1", 5001);
    expect(firebase.obtenerServiciosFirebase("localhost")).toBe(servicios);
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1);
  });

  it("el indicador antiguo habilita los tres emuladores, incluso fuera de DEV", async () => {
    configurarEmuladores();
    vi.stubEnv("DEV", false);
    vi.stubEnv("PUBLIC_USE_FIREBASE_EMULATORS", "0");
    vi.stubEnv("PUBLIC_USE_FUNCTIONS_EMULATOR", "1");
    const firebase = await import("../../src/datos/firebase");
    firebase.obtenerServiciosFirebase("localhost");
    expect(sdk.connectAuthEmulator).toHaveBeenCalledTimes(1);
    expect(sdk.connectFirestoreEmulator).toHaveBeenCalledTimes(1);
    expect(sdk.connectFunctionsEmulator).toHaveBeenCalledTimes(1);
  });
});
