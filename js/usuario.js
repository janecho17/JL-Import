// js/usuario.js
// Maneja el estado de sesión global: header dinámico, logout, contador de carrito/favoritos.

import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
} from "./firebase.js";

export function iniciarHeader() {
  const authArea = document.querySelector("[data-auth-area]");
  const carritoCount = document.querySelector("[data-carrito-count]");
  const adminLink = document.querySelector("[data-admin-link]");

  actualizarContadorCarrito();
  window.addEventListener("storage", actualizarContadorCarrito);

  onAuthStateChanged(auth, async (user) => {
    if (!authArea) return;

    if (user) {
      let esAdmin = false;
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        esAdmin = snap.exists() && snap.data().rol === "admin";
      } catch (e) {
        console.warn("No se pudo verificar el rol:", e);
      }

      authArea.innerHTML = `
        <a href="perfil.html" class="nav-link">Mi cuenta</a>
        <button class="nav-link nav-link--btn" data-logout>Salir</button>
      `;
      authArea.querySelector("[data-logout]").addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
      });

      if (adminLink) adminLink.style.display = esAdmin ? "inline-flex" : "none";
    } else {
      authArea.innerHTML = `
        <a href="login.html" class="nav-link">Ingresar</a>
        <a href="registro.html" class="nav-link nav-link--btn">Crear cuenta</a>
      `;
      if (adminLink) adminLink.style.display = "none";
    }
  });
}

export function actualizarContadorCarrito() {
  const el = document.querySelector("[data-carrito-count]");
  if (!el) return;
  const carrito = JSON.parse(localStorage.getItem("jlimport_carrito") || "[]");
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  el.textContent = total;
  el.style.display = total > 0 ? "inline-flex" : "none";
}

export function requiereSesion(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) callback(user);
    else window.location.href = "login.html";
  });
}

export function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(valor);
}

export function toast(mensaje, tipo = "info") {
  let cont = document.querySelector(".toast-cont");
  if (!cont) {
    cont = document.createElement("div");
    cont.className = "toast-cont";
    document.body.appendChild(cont);
  }
  const t = document.createElement("div");
  t.className = `toast toast--${tipo}`;
  t.textContent = mensaje;
  cont.appendChild(t);
  requestAnimationFrame(() => t.classList.add("toast--show"));
  setTimeout(() => {
    t.classList.remove("toast--show");
    setTimeout(() => t.remove(), 300);
  }, 3200);
}
