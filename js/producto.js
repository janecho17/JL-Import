// js/producto.js
// Ficha de producto: variantes ilimitadas (color/talla/memoria), galería por variante,
// stock por variante, especificaciones y agregar al carrito.

import { auth, db, doc, getDoc, updateDoc, onAuthStateChanged } from "./firebase.js";
import { iniciarHeader, formatearPrecio, actualizarContadorCarrito, toast } from "./usuario.js";

iniciarHeader();

const params = new URLSearchParams(location.search);
const productoId = params.get("id");

const cont = document.querySelector("[data-producto-detalle]");
let producto = null;
let variantesSeleccion = {}; // { color: 'Negro', talla: 'M', ... }
let varianteActual = null;
let usuarioActual = null;

onAuthStateChanged(auth, (u) => (usuarioActual = u));

async function cargarProducto() {
  if (!productoId || !cont) {
    cont && (cont.innerHTML = `<p class="texto-vacio">Producto no encontrado.</p>`);
    return;
  }
  const snap = await getDoc(doc(db, "productos", productoId));
  if (!snap.exists()) {
    cont.innerHTML = `<p class="texto-vacio">Este producto ya no está disponible.</p>`;
    return;
  }
  producto = snap.data();
  renderizar();
}

function obtenerOpcionesPorAtributo() {
  const atributos = {};
  (producto.variantes || []).forEach((v) => {
    Object.entries(v.atributos || {}).forEach(([clave, valor]) => {
      atributos[clave] = atributos[clave] || new Set();
      atributos[clave].add(valor);
    });
  });
  return atributos;
}

function buscarVarianteCoincidente() {
  return (producto.variantes || []).find((v) =>
    Object.entries(variantesSeleccion).every(([k, val]) => v.atributos?.[k] === val)
  );
}

function renderizar() {
  const atributos = obtenerOpcionesPorAtributo();

  // Selección inicial: primer valor de cada atributo
  Object.entries(atributos).forEach(([clave, valores]) => {
    if (!variantesSeleccion[clave]) variantesSeleccion[clave] = [...valores][0];
  });
  varianteActual = buscarVarianteCoincidente() || (producto.variantes || [])[0];

  const galeria = varianteActual?.imagenes?.length
    ? varianteActual.imagenes
    : [producto.imagenPrincipal || "img/placeholder.png"];

  const enOferta = producto.precioOferta && producto.precioOferta < producto.precio;
  const precioFinal = enOferta ? producto.precioOferta : producto.precio;
  const stock = varianteActual?.stock ?? 0;

  cont.innerHTML = `
    <div class="producto-detalle__galeria">
      <img class="galeria-principal" src="${galeria[0]}" alt="${producto.nombre}" data-img-principal>
      <div class="galeria-miniaturas">
        ${galeria.map((img) => `<img src="${img}" data-thumb>`).join("")}
      </div>
    </div>
    <div class="producto-detalle__info">
      <h1>${producto.nombre}</h1>
      <div class="producto-detalle__precio">
        ${enOferta ? `<span class="precio-tachado">${formatearPrecio(producto.precio)}</span>` : ""}
        <strong>${formatearPrecio(precioFinal)}</strong>
      </div>

      <div class="producto-detalle__variantes" data-variantes></div>

      <p class="producto-detalle__stock ${stock > 0 ? "" : "sin-stock"}" data-stock-texto>
        ${stock > 0 ? `${stock} unidad(es) disponibles` : "Sin stock por ahora"}
      </p>

      <div class="producto-detalle__cantidad">
        <label for="cantidad">Cantidad</label>
        <input type="number" id="cantidad" min="1" max="${Math.max(stock, 1)}" value="1">
      </div>

      <div class="producto-detalle__acciones">
        <button class="btn btn--primario" data-agregar-carrito ${stock < 1 ? "disabled" : ""}>
          Agregar al carrito
        </button>
        <button class="btn btn--fav" data-agregar-favorito>♡ Favorito</button>
      </div>

      ${producto.especificaciones?.length ? `
        <div class="producto-detalle__specs">
          <h2>Especificaciones</h2>
          <ul>
            ${producto.especificaciones.map((e) => `<li><strong>${e.clave}:</strong> ${e.valor}</li>`).join("")}
          </ul>
        </div>` : ""}
    </div>
  `;

  const varCont = cont.querySelector("[data-variantes]");
  Object.entries(atributos).forEach(([clave, valores]) => {
    const grupo = document.createElement("div");
    grupo.className = "variante-grupo";
    grupo.innerHTML = `<span class="variante-grupo__label">${clave}</span>`;
    const opciones = document.createElement("div");
    opciones.className = "variante-grupo__opciones";
    [...valores].forEach((valor) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "variante-opcion" + (variantesSeleccion[clave] === valor ? " variante-opcion--activa" : "");
      btn.textContent = valor;
      btn.addEventListener("click", () => {
        variantesSeleccion[clave] = valor;
        renderizar();
      });
      opciones.appendChild(btn);
    });
    grupo.appendChild(opciones);
    varCont.appendChild(grupo);
  });

  cont.querySelectorAll("[data-thumb]").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      cont.querySelector("[data-img-principal]").src = thumb.src;
    });
  });

  cont.querySelector("[data-agregar-carrito]")?.addEventListener("click", agregarAlCarrito);
  cont.querySelector("[data-agregar-favorito]")?.addEventListener("click", alternarFavorito);
}

function agregarAlCarrito() {
  const cantidad = Math.max(1, parseInt(cont.querySelector("#cantidad").value || "1", 10));
  const stock = varianteActual?.stock ?? 0;
  if (cantidad > stock) {
    toast("No hay suficiente stock para esa cantidad", "error");
    return;
  }

  const carrito = JSON.parse(localStorage.getItem("jlimport_carrito") || "[]");
  const enOferta = producto.precioOferta && producto.precioOferta < producto.precio;
  const claveVariante = JSON.stringify(varianteActual?.atributos || {});
  const idxExistente = carrito.findIndex(
    (i) => i.productoId === productoId && JSON.stringify(i.atributos) === claveVariante
  );

  if (idxExistente >= 0) {
    carrito[idxExistente].cantidad += cantidad;
  } else {
    carrito.push({
      productoId,
      nombre: producto.nombre,
      imagen: varianteActual?.imagenes?.[0] || producto.imagenPrincipal,
      atributos: varianteActual?.atributos || {},
      precio: enOferta ? producto.precioOferta : producto.precio,
      cantidad,
    });
  }
  localStorage.setItem("jlimport_carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();
  toast("Producto agregado al carrito", "exito");
}

async function alternarFavorito() {
  if (!usuarioActual) {
    toast("Inicia sesión para guardar favoritos", "error");
    return;
  }
  const ref = doc(db, "usuarios", usuarioActual.uid);
  const snap = await getDoc(ref);
  const favoritos = snap.exists() ? snap.data().favoritos || [] : [];
  const yaEsta = favoritos.includes(productoId);
  const nuevos = yaEsta ? favoritos.filter((id) => id !== productoId) : [...favoritos, productoId];
  await updateDoc(ref, { favoritos: nuevos });
  toast(yaEsta ? "Eliminado de favoritos" : "Agregado a favoritos", "exito");
}

cargarProducto();
