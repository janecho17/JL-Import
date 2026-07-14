// js/adminGuard.js
// Protege las páginas de administración. Debe importarse ANTES que cualquier
// otro script de la página admin. Redirige si el usuario no es admin.

import { auth, db, onAuthStateChanged, doc, getDoc } from "./firebase.js";

export function protegerRutaAdmin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        const esAdmin = snap.exists() && snap.data().rol === "admin";
        if (!esAdmin) {
          window.location.href = "index.html";
          return;
        }
        resolve(user);
      } catch (err) {
        console.error("Error verificando permisos de administrador:", err);
        window.location.href = "index.html";
      }
    });
  });
}
