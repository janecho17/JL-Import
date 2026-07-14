// js/registro.js
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  updateProfile,
  doc,
  setDoc,
  serverTimestamp,
} from "./firebase.js";
import { toast } from "./usuario.js";

const form = document.querySelector("#form-registro");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  const nombre = form.nombre.value.trim();
  const telefono = form.telefono.value.trim();
  const correo = form.correo.value.trim();
  const clave = form.clave.value;
  const clave2 = form.clave2.value;

  if (clave !== clave2) {
    toast("Las contraseñas no coinciden", "error");
    return;
  }
  if (clave.length < 6) {
    toast("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creando cuenta...";
  try {
    const cred = await createUserWithEmailAndPassword(auth, correo, clave);
    await updateProfile(cred.user, { displayName: nombre });
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nombre,
      telefono,
      correo,
      rol: "cliente",
      creadoEn: serverTimestamp(),
    });
    toast("Cuenta creada. ¡Bienvenido a JL-IMPORT!", "exito");
    window.location.href = "index.html";
  } catch (err) {
    toast(traducirError(err.code), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Crear cuenta";
  }
});

function traducirError(code) {
  const mapa = {
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/weak-password": "La contraseña es muy débil.",
  };
  return mapa[code] || "No se pudo crear la cuenta. Intenta de nuevo.";
}
