import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  observarAuth: vi.fn(), observarPerfil: vi.fn(), crearPerfil: vi.fn(), crearCuenta: vi.fn(),
  token: vi.fn(), enviarCorreo: vi.fn(), actualizarNombre: vi.fn(), cerrar: vi.fn(),
  autenticacion: { currentUser: null as unknown },
}));
vi.mock("../../src/datos/firebase", () => ({ obtenerServiciosFirebase: () => ({ autenticacion: sdk.autenticacion }) }));
vi.mock("../../src/datos/personas", () => ({ crearPerfilUsuario: sdk.crearPerfil, observarPerfilUsuario: sdk.observarPerfil }));
vi.mock("firebase/auth", () => ({
  onIdTokenChanged: sdk.observarAuth, getIdTokenResult: sdk.token,
  createUserWithEmailAndPassword: sdk.crearCuenta, updateProfile: sdk.actualizarNombre,
  sendEmailVerification: sdk.enviarCorreo, signOut: sdk.cerrar,
  reload: vi.fn(), signInWithEmailAndPassword: vi.fn(), applyActionCode: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubGlobal("window", { addEventListener: vi.fn(), location: { origin: "http://127.0.0.1:4331" } });
  sdk.token.mockResolvedValue({ claims: {} });
  sdk.observarPerfil.mockReturnValue(vi.fn());
  sdk.autenticacion.currentUser = null;
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("estado de sesion y recuperacion", () => {
  it("dos consumidores comparten un listener y distinguen carga de invitado", async () => {
    const sesion = await import("../../src/datos/sesion");
    sesion.observarSesion(vi.fn());
    sesion.observarSesion(vi.fn());
    expect(sdk.observarAuth).toHaveBeenCalledTimes(1);
    expect(sesion.obtenerUsuarioActual().estado).toBe("cargando");
    sdk.observarAuth.mock.calls[0][1](null);
    expect((await sesion.esperarEstadoSesion()).estado).toBe("invitado");
  });
  it("descarta la respuesta antigua si el usuario sale mientras carga el token", async () => {
    let resolverToken: (valor: { claims: object }) => void = () => {};
    sdk.token.mockReturnValue(new Promise((resolver) => { resolverToken = resolver; }));
    const sesion = await import("../../src/datos/sesion");
    sesion.observarSesion(vi.fn());
    const recibir = sdk.observarAuth.mock.calls[0][1];
    recibir({ uid: "anterior", email: "anterior@example.test" });
    recibir(null);
    resolverToken({ claims: { role: "admin" } });
    await Promise.resolve();
    await Promise.resolve();
    expect(sesion.obtenerUsuarioActual().estado).toBe("invitado");
    expect(sesion.obtenerUsuarioActual().usuario).toBeNull();
    expect(sdk.observarPerfil).not.toHaveBeenCalled();
  });
  it("una cuenta creada con fallo de perfil se recupera sin intentar otra alta ni enviar correo", async () => {
    sdk.crearCuenta.mockResolvedValue({ user: { uid: "parcial", email: "parcial@example.test" } });
    sdk.crearPerfil.mockRejectedValue(new Error("Sin conexion"));
    const sesion = await import("../../src/datos/sesion");
    const resultado = await sesion.registrarUsuario("parcial@example.test", "Prueba123!", "Persona", "");
    expect(resultado).toEqual({ perfilCreado: false, correoEnviado: false });
    expect(sdk.crearCuenta).toHaveBeenCalledTimes(1);
    expect(sdk.enviarCorreo).not.toHaveBeenCalled();
  });
  it("un fallo del correo conserva la cuenta y el perfil", async () => {
    sdk.crearCuenta.mockResolvedValue({ user: { uid: "correo", email: "correo@example.test" } });
    sdk.autenticacion.currentUser = { uid: "correo" };
    sdk.enviarCorreo.mockRejectedValue(new Error("Limite temporal"));
    const sesion = await import("../../src/datos/sesion");
    expect(await sesion.registrarUsuario("correo@example.test", "Prueba123!", "Persona", "")).toEqual({ perfilCreado: true, correoEnviado: false });
  });
  it("un claim desconocido produce error y no se convierte en cliente", async () => {
    sdk.token.mockResolvedValue({ claims: { role: "owner" } });
    const sesion = await import("../../src/datos/sesion");
    sesion.observarSesion(vi.fn());
    sdk.observarAuth.mock.calls[0][1]({ uid: "invalido" });
    expect((await sesion.esperarEstadoSesion()).estado).toBe("error");
    expect(sesion.obtenerUsuarioActual().usuario).toBeNull();
  });
  it("la politica exige correo salvo perfil y no da acceso administrativo al responsable", async () => {
    const { comprobarPermiso } = await import("../../src/comun/permisos");
    const estado = {
      estado: "autenticado" as const, perfil: null, errorPerfil: false, mensaje: "",
      usuario: { uid: "responsable", correo: "responsable@example.test", correoVerificado: false, nombre: "Persona", rol: "manager" as const, versionRol: 0, plan: "free" },
    };
    expect(comprobarPermiso(estado, ["manager"])).toBe(false);
    expect(comprobarPermiso(estado, ["manager"], false)).toBe(true);
    estado.usuario.correoVerificado = true;
    expect(comprobarPermiso(estado, ["admin"])).toBe(false);
  });
});
