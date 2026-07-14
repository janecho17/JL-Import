// js/pedidos.js
// Panel de administración de pedidos: listar, filtrar por estado y actualizar estado.

import { protegerRutaAdmin } from "./adminGuard.js";
import {
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  TIENDA,
} from "./firebase.js";
import { formatearPrecio, toast } from "./usuario.js";

const ESTADOS = ["pendiente", "procesando", "enviado", "entregado", "cancelado"];

const cont = document.querySelector("[data-pedidos-admin]");
const filtroEstado = document.querySelector("[data-filtro-estado]");
let pedidosCache = [];

protegerRutaAdmin().then(() => {
  cargarPedidos();
});

async function cargarPedidos() {
  if (!cont) return;
  cont.innerHTML = `<p class="texto-vacio">Cargando pedidos...</p>`;
  const snap = await getDocs(query(collection(db, "pedidos"), orderBy("creadoEn", "desc")));
  pedidosCache = [];
  snap.forEach((d) => pedidosCache.push({ id: d.id, ...d.data() }));
  render();
}

function render() {
  let lista = [...pedidosCache];
  const estado = filtroEstado?.value;
  if (estado) lista = lista.filter((p) => p.estado === estado);

  cont.innerHTML = lista.length
    ? ""
    : `<p class="texto-vacio">No hay pedidos con ese filtro.</p>`;

  lista.forEach((p) => {
    const fila = document.createElement("article");
    fila.className = "pedido-admin-card";
    fila.innerHTML = `
      <div class="pedido-admin-card__cabecera">
        <div>
          <strong>#${p.id.slice(0, 8).toUpperCase()}</strong>
          <span>${p.clienteNombre || "Cliente"} · ${p.clienteTelefono || "sin teléfono"}</span>
        </div>
        <strong>${formatearPrecio(p.total || 0)}</strong>
      </div>
      <ul class="pedido-admin-card__items">
        ${(p.items || []).map((i) => `<li>${i.cantidad}x ${i.nombre}</li>`).join("")}
      </ul>
      <div class="pedido-admin-card__acciones">
        <select data-estado>
          ${ESTADOS.map((e) => `<option value="${e}" ${e === p.estado ? "selected" : ""}>${e}</option>`).join("")}
        </select>
        <a class="btn btn--whatsapp" target="_blank"
           href="https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent(
             `Hola, sobre tu pedido #${p.id.slice(0, 8).toUpperCase()}...`
           )}">WhatsApp</a>
      </div>
    `;
    fila.querySelector("[data-estado]").addEventListener("change", async (e) => {
      try {
        await updateDoc(doc(db, "pedidos", p.id), { estado: e.target.value });
        p.estado = e.target.value;
        toast("Estado del pedido actualizado", "exito");
      } catch (err) {
        toast("No se pudo actualizar el estado", "error");
      }
    });
    cont.appendChild(fila);
  });
}

filtroEstado?.addEventListener("change", render);
