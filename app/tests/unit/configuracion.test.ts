import { expect, it } from "vitest";
import { comprobarConfiguracionFirebase, type ConfiguracionFirebase } from "../../src/datos/firebase";
const local:ConfiguracionFirebase={modo:"local",usarEmuladores:true,usarEmuladorFunciones:true,apiKey:"demo",appId:"demo",projectId:"demo-barberpro-m13",authDomain:"localhost",appUrl:"http://localhost:4321"};
it("local solo permite emuladores en localhost y proyecto ficticio", () => {
  expect(comprobarConfiguracionFirebase(local,"http://localhost:4321")).toBeNull();
  for(const config of [{...local,projectId:"real"},{...local,usarEmuladores:false}]) expect(comprobarConfiguracionFirebase(config,"http://localhost:4321")).not.toBeNull();
  expect(comprobarConfiguracionFirebase(local,"https://ejemplo.test")).not.toBeNull();
});
it("WEB exige HTTPS, origen canonico, dominio Firebase y ausencia de emuladores", () => {
  const web={...local,modo:"web",usarEmuladores:false,usarEmuladorFunciones:false,projectId:"barberia-ejemplo",authDomain:"barberia-ejemplo.firebaseapp.com",appUrl:"https://barberia-ejemplo.web.app"};
  expect(comprobarConfiguracionFirebase(web,web.appUrl)).toBeNull();
  for(const origen of ["http://barberia-ejemplo.web.app","https://otro.test"]) expect(comprobarConfiguracionFirebase(web,origen)).not.toBeNull();
  expect(comprobarConfiguracionFirebase({...web,usarEmuladores:true},web.appUrl)).not.toBeNull();
  expect(comprobarConfiguracionFirebase({...web,usarEmuladorFunciones:true},web.appUrl)).not.toBeNull();
});

