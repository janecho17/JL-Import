// js/carrito.js
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "./firebase.js";
import { TIENDA } from "./firebase.js";
import { iniciarHeader, formatearPrecio, actualizarContadorCarrito, toast } from "./usuario.js";

iniciarHeader();

const cont = document.querySelector("[data-carrito-lista]");
const totalEl = document.querySelector("[data-carrito-total]");
const btnCheckout = document.querySelector("[data-checkout]");
let usuarioActual = null;

onAuthStateChanged(auth, (u) => (usuarioActual = u));

function leerCarrito() {
  return JSON.parse(localStorage.getItem("jlimport_carrito") || "[]");
}
function guardarCarrito(carrito) {
  localStorage.setItem("jlimport_carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();
}

function render() {
  const carrito = leerCarrito();
  if (!cont) return;

  if (!carrito.length) {
    cont.innerHTML = `<p class="texto-vacio">Tu carrito está vacío. <a href="index.html">Ver productos</a></p>`;
    totalEl && (totalEl.textContent = formatearPrecio(0));
    if (btnCheckout) btnCheckout.disabled = true;
    return;
  }

  cont.innerHTML = carrito
    .map((item, i) => {
      const atributosTxt = Object.entries(item.atributos || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
      return `
      <div class="carrito-item" data-index="${i}">
        <img src="${item.imagen || "img/placeholder.png"}" alt="${item.nombre}">
        <div class="carrito-item__info">
          <h3>${item.nombre}</h3>
          ${atributosTxt ? `<p class="carrito-item__variante">${atributosTxt}</p>` : ""}
          <strong>${formatearPrecio(item.precio)}</strong>
        </div>
        <div class="carrito-item__cantidad">
          <button data-restar>−</button>
          <span>${item.cantidad}</span>
          <button data-sumar>+</button>
        </div>
        <button class="carrito-item__eliminar" data-eliminar aria-label="Eliminar">✕</button>
      </div>`;
    })
    .join("");

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  totalEl && (totalEl.textContent = formatearPrecio(total));
  if (btnCheckout) btnCheckout.disabled = false;

  cont.querySelectorAll("[data-index]").forEach((fila) => {
    const idx = parseInt(fila.dataset.index, 10);
    fila.querySelector("[data-sumar]").addEventListener("click", () => cambiarCantidad(idx, 1));
    fila.querySelector("[data-restar]").addEventListener("click", () => cambiarCantidad(idx, -1));
    fila.querySelector("[data-eliminar]").addEventListener("click", () => eliminarItem(idx));
  });
}

function cambiarCantidad(idx, delta) {
  const carrito = leerCarrito();
  carrito[idx].cantidad = Math.max(1, carrito[idx].cantidad + delta);
  guardarCarrito(carrito);
  render();
}

function eliminarItem(idx) {
  const carrito = leerCarrito();
  carrito.splice(idx, 1);
  guardarCarrito(carrito);
  render();
}

btnCheckout?.addEventListener("click", async () => {
  const carrito = leerCarrito();
  if (!carrito.length) return;

  if (!usuarioActual) {
    toast("Inicia sesión para completar tu pedido", "error");
    setTimeout(() => (window.location.href = "login.html?redirect=carrito.html"), 1200);
    return;
  }

  btnCheckout.disabled = true;
  btnCheckout.textContent = "Procesando...";

  try {
    const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    const userSnap = await getDoc(doc(db, "usuarios", usuarioActual.uid));
    const datosUsuario = userSnap.exists() ? userSnap.data() : {};

    const pedidoRef = await addDoc(collection(db, "pedidos"), {
      clienteId: usuarioActual.uid,
      clienteNombre: datosUsuario.nombre || usuarioActual.displayName || "",
      clienteTelefono: datosUsuario.telefono || "",
      items: carrito,
      total,
      estado: "pendiente",
      creadoEn: serverTimestamp(),
    });

    guardarCarrito([]);
    render();

    const mensaje = construirMensajeWhatsApp(pedidoRef.id, carrito, total);
    window.open(`https://wa.me/${TIENDA.whatsapp}?text=${mensaje}`, "_blank");

    toast("¡Pedido enviado! Coordinaremos por WhatsApp.", "exito");
    setTimeout(() => (window.location.href = "perfil.html"), 1500);
  } catch (err) {
    console.error(err);
    toast("No se pudo procesar el pedido. Intenta de nuevo.", "error");
  } finally {
    btnCheckout.disabled = false;
    btnCheckout.textContent = "Finalizar pedido";
  }
});

function construirMensajeWhatsApp(pedidoId, items, total) {
  const lineas = items.map((i) => `• ${i.cantidad}x ${i.nombre} - ${formatearPrecio(i.precio)}`);
  const texto = [
    `Hola ${TIENDA.nombre}, quiero confirmar mi pedido *#${pedidoId.slice(0, 8).toUpperCase()}*:`,
    ...lineas,
    `Total: ${formatearPrecio(total)}`,
  ].join("\n");
  return encodeURIComponent(texto);
}

render();
