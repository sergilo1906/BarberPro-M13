import "./firebase.js";
import { onRequest } from "firebase-functions/v2/https";

export const ping = onRequest((peticion, respuestaHttp) => {
  respuestaHttp.status(200).send("ok");
});
