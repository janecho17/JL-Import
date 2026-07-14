// js/app.js
// Página de inicio: categorías, marcas, buscador, filtros, destacados y ofertas.

import { db, collection, getDocs, query, where, limit, orderBy } from "./firebase.js";
import { iniciarHeader, formatearPrecio } from "./usuario.js";

iniciarHeader();

const grid = document.querySelector("[data-grid-productos]");
const gridDestacados = document.querySelector("[data-grid-destacados]");
const gridOfertas = document.querySelector("[data-grid-ofertas]");
const contCategorias = document.querySelector("[data-categorias]");
const contMarcas = document.querySelector("[data-marcas]");
const buscador = document.querySelector("[data-buscador]");
const filtroCategoria = document.querySelector("[data-filtro-categoria]");
const filtroMarca = document.querySelector("[data-filtro-marca]");
const filtroOrden = document.querySelector("[data-filtro-orden]");

let productosCache = [];

async function cargarCategorias() {
  if (!contCategorias) return;
  const snap = await getDocs(collection(db, "categorias"));
  contCategorias.innerHTML = "";
  filtroCategoria && (filtroCategoria.innerHTML = `<option value="">Todas las categorías</option>`);
  snap.forEach((d) => {
    const c = d.data();
    contCategorias.innerHTML += `
      <a class="categoria-chip" href="index.html?categoria=${d.id}">
        <img src="${c.imagen || "img/placeholder.png"}" alt="${c.nombre}">
        <span>${c.nombre}</span>
      </a>`;
    if (filtroCategoria) {
      filtroCategoria.innerHTML += `<option value="${d.id}">${c.nombre}</option>`;
    }
  });
}

async function cargarMarcas() {
  if (!contMarcas) return;
  const snap = await getDocs(collection(db, "marcas"));
  contMarcas.innerHTML = "";
  filtroMarca && (filtroMarca.innerHTML = `<option value="">Todas las marcas</option>`);
  snap.forEach((d) => {
    const m = d.data();
    contMarcas.innerHTML += `<span class="marca-chip">${m.nombre}</span>`;
    if (filtroMarca) {
      filtroMarca.innerHTML += `<option value="${d.id}">${m.nombre}</option>`;
    }
  });
}

function tarjetaProducto(id, p) {
  const enOferta = p.precioOferta && p.precioOferta < p.precio;
  return `
    <a class="producto-card" href="producto.html?id=${id}">
      ${enOferta ? `<span class="producto-card__badge">Oferta</span>` : ""}
      <img src="${p.imagenPrincipal || "img/placeholder.png"}" alt="${p.nombre}" loading="lazy">
      <div class="producto-card__body">
        <h3>${p.nombre}</h3>
        <div class="producto-card__precio">
          ${enOferta ? `<span class="precio-tachado">${formatearPrecio(p.precio)}</span>` : ""}
          <strong>${formatearPrecio(enOferta ? p.precioOferta : p.precio)}</strong>
        </div>
      </div>
    </a>`;
}

async function cargarDestacadosYOfertas() {
  if (gridDestacados) {
    const q = query(collection(db, "productos"), where("destacado", "==", true), limit(8));
    const snap = await getDocs(q);
    gridDestacados.innerHTML = snap.empty
      ? `<p class="texto-vacio">Pronto tendremos productos destacados.</p>`
      : "";
    snap.forEach((d) => (gridDestacados.innerHTML += tarjetaProducto(d.id, d.data())));
  }
  if (gridOfertas) {
    const q = query(collection(db, "productos"), where("enOferta", "==", true), limit(8));
    const snap = await getDocs(q);
    gridOfertas.innerHTML = snap.empty
      ? `<p class="texto-vacio">Aún no hay ofertas activas.</p>`
      : "";
    snap.forEach((d) => (gridOfertas.innerHTML += tarjetaProducto(d.id, d.data())));
  }
}

async function cargarProductos() {
  if (!grid) return;
  grid.innerHTML = `<p class="texto-vacio">Cargando productos...</p>`;
  const snap = await getDocs(query(collection(db, "productos"), orderBy("creadoEn", "desc")));
  productosCache = [];
  snap.forEach((d) => productosCache.push({ id: d.id, ...d.data() }));

  const params = new URLSearchParams(location.search);
  const categoriaUrl = params.get("categoria");
  if (categoriaUrl && filtroCategoria) filtroCategoria.value = categoriaUrl;

  renderizarProductos();
}

function renderizarProductos() {
  if (!grid) return;
  let lista = [...productosCache];

  const texto = buscador?.value.trim().toLowerCase();
  if (texto) {
    lista = lista.filter((p) => p.nombre?.toLowerCase().includes(texto));
  }
  const cat = filtroCategoria?.value;
  if (cat) lista = lista.filter((p) => p.categoriaId === cat);

  const marca = filtroMarca?.value;
  if (marca) lista = lista.filter((p) => p.marcaId === marca);

  const orden = filtroOrden?.value;
  if (orden === "precio-asc") lista.sort((a, b) => (a.precio || 0) - (b.precio || 0));
  if (orden === "precio-desc") lista.sort((a, b) => (b.precio || 0) - (a.precio || 0));
  if (orden === "nombre") lista.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  grid.innerHTML = lista.length
    ? lista.map((p) => tarjetaProducto(p.id, p)).join("")
    : `<p class="texto-vacio">No se encontraron productos con esos filtros.</p>`;
}

[buscador, filtroCategoria, filtroMarca, filtroOrden].forEach((el) =>
  el?.addEventListener("input", renderizarProductos)
);

cargarCategorias();
cargarMarcas();
cargarDestacadosYOfertas();
cargarProductos();
