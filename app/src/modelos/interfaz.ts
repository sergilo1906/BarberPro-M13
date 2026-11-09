export type TipoAviso = "success" | "error" | "info";
export interface OpcionesConfirmacion { title: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean; }
export interface DatosCalendario { title: string; startUtc: string; endUtc: string; description?: string; location?: string; }
