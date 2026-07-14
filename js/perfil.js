// js/perfil.js
import {
  auth,
  db,
  signOut,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "./firebase.js";
import { requiereSesion, formatearPrecio, toast } from "./usuario.js";

const form = document.querySelector("#form-perfil");
const listaPedidos = document.querySelector("[data-pedidos-lista]");
const listaFavoritos = document.querySelector("[data-favoritos-lista]");
const btnLogout = document.querySelector("[data-logout-perfil]");

requiereSesion(async (user) => {
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);
  const datos = snap.exists() ? snap.data() : {};

  if (form) {
    form.nombre.value = datos.nombre || user.displayName || "";
    form.telefono.value = datos.telefono || "";
    form.correo.value = user.email || "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await updateDoc(ref, {
          nombre: form.nombre.value.trim(),
          telefono: form.telefono.value.trim(),
        });
        toast("Perfil actualizado", "exito");
      } catch (err) {
        toast("No se pudo actualizar el perfil", "error");
      }
    });
  }

  await cargarPedidos(user.uid);
  await cargarFavoritos(datos.favoritos || []);
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

async function cargarPedidos(uid) {
  if (!listaPedidos) return;
  try {
    const q = query(
      collection(db, "pedidos"),
      where("clienteId", "==", uid),
      orderBy("creadoEn", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      listaPedidos.innerHTML = `<p class="texto-vacio">Aún no tienes pedidos.</p>`;
      return;
    }
    listaPedidos.innerHTML = "";
    snap.forEach((docu) => {
      const p = docu.data();
      const fila = document.createElement("article");
      fila.className = "pedido-card";
      fila.innerHTML = `
        <div class="pedido-card__cabecera">
          <span>Pedido #${docu.id.slice(0, 8).toUpperCase()}</span>
          <span class="badge badge--${p.estado}">${p.estado}</span>
        </div>
        <p>${p.items?.length || 0} producto(s) · ${formatearPrecio(p.total || 0)}</p>
      `;
      listaPedidos.appendChild(fila);
    });
  } catch (err) {
    listaPedidos.innerHTML = `<p class="texto-vacio">No se pudieron cargar tus pedidos.</p>`;
  }
}

async function cargarFavoritos(idsFavoritos) {
  if (!listaFavoritos) return;
  if (!idsFavoritos.length) {
    listaFavoritos.innerHTML = `<p class="texto-vacio">No tienes productos favoritos.</p>`;
    return;
  }
  listaFavoritos.innerHTML = "";
  for (const id of idsFavoritos) {
    try {
      const snap = await getDoc(doc(db, "productos", id));
      if (!snap.exists()) continue;
      const p = snap.data();
      const card = document.createElement("a");
      card.href = `producto.html?id=${id}`;
      card.className = "producto-mini";
      card.innerHTML = `
        <img src="${p.imagenPrincipal || "img/placeholder.png"}" alt="${p.nombre}">
        <span>${p.nombre}</span>
        <strong>${formatearPrecio(p.precio)}</strong>
      `;
      listaFavoritos.appendChild(card);
    } catch (e) {
      /* producto eliminado o inaccesible: se omite */
    }
  }
}
