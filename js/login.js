// js/login.js
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "./firebase.js";
import { toast } from "./usuario.js";

const form = document.querySelector("#form-login");
const btnReset = document.querySelector("[data-reset-pass]");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  const correo = form.correo.value.trim();
  const clave = form.clave.value;

  btn.disabled = true;
  btn.textContent = "Ingresando...";
  try {
    await signInWithEmailAndPassword(auth, correo, clave);
    const destino = new URLSearchParams(location.search).get("redirect") || "index.html";
    window.location.href = destino;
  } catch (err) {
    toast(traducirError(err.code), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Ingresar";
  }
});

btnReset?.addEventListener("click", async () => {
  const correo = form.correo.value.trim();
  if (!correo) {
    toast("Escribe tu correo para recuperar la contraseña", "error");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, correo);
    toast("Te enviamos un correo para restablecer tu contraseña", "exito");
  } catch (err) {
    toast(traducirError(err.code), "error");
  }
});

function traducirError(code) {
  const mapa = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
  };
  return mapa[code] || "Ocurrió un error al ingresar. Intenta de nuevo.";
}
