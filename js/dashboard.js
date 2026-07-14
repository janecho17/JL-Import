// js/dashboard.js
// Panel de administración: productos (con variantes ilimitadas), categorías, marcas,
// clientes, estadísticas básicas y subida de imágenes a Firebase Storage.

import { protegerRutaAdmin } from "./adminGuard.js";
import {
  db,
  storage,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
} from "./firebase.js";
import { formatearPrecio, toast } from "./usuario.js";

protegerRutaAdmin().then((user) => {
  document.querySelector("[data-admin-correo]") &&
    (document.querySelector("[data-admin-correo]").textContent = user.email);
  iniciarTabs();
  cargarProductos();
  cargarCategorias();
  cargarMarcas();
  cargarClientes();
  cargarEstadisticas();
});

// ---------- Tabs ----------
function iniciarTabs() {
  const tabs = document.querySelectorAll("[data-tab-btn]");
  const paneles = document.querySelectorAll("[data-tab-panel]");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("activa"));
      paneles.forEach((p) => p.classList.remove("activo"));
      btn.classList.add("activa");
      document.querySelector(`[data-tab-panel="${btn.dataset.tabBtn}"]`)?.classList.add("activo");
    });
  });
}

// ---------- Categorías ----------
async function cargarCategorias() {
  const tabla = document.querySelector("[data-tabla-categorias]");
  const selectCatProducto = document.querySelector("[data-select-categoria-producto]");
  if (!tabla) return;
  const snap = await getDocs(collection(db, "categorias"));
  tabla.innerHTML = "";
  selectCatProducto && (selectCatProducto.innerHTML = "");
  snap.forEach((d) => {
    const c = d.data();
    tabla.innerHTML += `
      <tr>
        <td>${c.nombre}</td>
        <td><button class="btn-icono" data-eliminar-cat="${d.id}">Eliminar</button></td>
      </tr>`;
    if (selectCatProducto) selectCatProducto.innerHTML += `<option value="${d.id}">${c.nombre}</option>`;
  });
  tabla.querySelectorAll("[data-eliminar-cat]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta categoría?")) return;
      await deleteDoc(doc(db, "categorias", btn.dataset.eliminarCat));
      cargarCategorias();
    })
  );
}

document.querySelector("#form-categoria")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  await addDoc(collection(db, "categorias"), {
    nombre: form.nombre.value.trim(),
    imagen: "",
    creadoEn: serverTimestamp(),
  });
  form.reset();
  toast("Categoría creada", "exito");
  cargarCategorias();
});

// ---------- Marcas ----------
async function cargarMarcas() {
  const tabla = document.querySelector("[data-tabla-marcas]");
  const selectMarcaProducto = document.querySelector("[data-select-marca-producto]");
  if (!tabla) return;
  const snap = await getDocs(collection(db, "marcas"));
  tabla.innerHTML = "";
  selectMarcaProducto && (selectMarcaProducto.innerHTML = "");
  snap.forEach((d) => {
    const m = d.data();
    tabla.innerHTML += `
      <tr>
        <td>${m.nombre}</td>
        <td><button class="btn-icono" data-eliminar-marca="${d.id}">Eliminar</button></td>
      </tr>`;
    if (selectMarcaProducto) selectMarcaProducto.innerHTML += `<option value="${d.id}">${m.nombre}</option>`;
  });
  tabla.querySelectorAll("[data-eliminar-marca]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta marca?")) return;
      await deleteDoc(doc(db, "marcas", btn.dataset.eliminarMarca));
      cargarMarcas();
    })
  );
}

document.querySelector("#form-marca")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  await addDoc(collection(db, "marcas"), {
    nombre: form.nombre.value.trim(),
    creadoEn: serverTimestamp(),
  });
  form.reset();
  toast("Marca creada", "exito");
  cargarMarcas();
});

// ---------- Productos (con variantes ilimitadas) ----------
let variantesTemp = []; // variantes del producto que se está creando/editando
let productoEditandoId = null;

const formProducto = document.querySelector("#form-producto");
const contVariantes = document.querySelector("[data-variantes-editor]");
const tablaProductos = document.querySelector("[data-tabla-productos]");

document.querySelector("[data-agregar-variante]")?.addEventListener("click", () => {
  variantesTemp.push({ atributos: { Color: "", Talla: "", Memoria: "" }, stock: 0, imagenes: [] });
  renderVariantesEditor();
});

function renderVariantesEditor() {
  if (!contVariantes) return;
  contVariantes.innerHTML = variantesTemp
    .map(
      (v, i) => `
    <div class="variante-editor" data-variante-idx="${i}">
      <div class="variante-editor__campos">
        <input type="text" placeholder="Color (opcional)" value="${v.atributos.Color || ""}" data-attr="Color">
        <input type="text" placeholder="Talla (opcional)" value="${v.atributos.Talla || ""}" data-attr="Talla">
        <input type="text" placeholder="Memoria (opcional)" value="${v.atributos.Memoria || ""}" data-attr="Memoria">
        <input type="number" placeholder="Stock" min="0" value="${v.stock}" data-attr-stock>
        <input type="file" accept="image/*" multiple data-attr-imagenes>
      </div>
      <div class="variante-editor__miniaturas">
        ${(v.imagenes || []).map((img) => `<img src="${img}">`).join("")}
      </div>
      <button type="button" class="btn-icono" data-eliminar-variante>Eliminar variante</button>
    </div>`
    )
    .join("");

  contVariantes.querySelectorAll("[data-variante-idx]").forEach((el) => {
    const idx = parseInt(el.dataset.varianteIdx, 10);
    el.querySelectorAll("[data-attr]").forEach((input) => {
      input.addEventListener("input", () => {
        const clave = input.dataset.attr;
        if (input.value) variantesTemp[idx].atributos[clave] = input.value;
        else delete variantesTemp[idx].atributos[clave];
      });
    });
    el.querySelector("[data-attr-stock]").addEventListener("input", (e) => {
      variantesTemp[idx].stock = parseInt(e.target.value || "0", 10);
    });
    el.querySelector("[data-attr-imagenes]").addEventListener("change", async (e) => {
      const archivos = [...e.target.files];
      toast("Subiendo imágenes...", "info");
      const urls = [];
      for (const archivo of archivos) {
        const storageRef = ref(storage, `productos/${Date.now()}_${archivo.name}`);
        await uploadBytes(storageRef, archivo);
        urls.push(await getDownloadURL(storageRef));
      }
      variantesTemp[idx].imagenes.push(...urls);
      renderVariantesEditor();
    });
    el.querySelector("[data-eliminar-variante]").addEventListener("click", () => {
      variantesTemp.splice(idx, 1);
      renderVariantesEditor();
    });
  });
}

formProducto?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;

  try {
    let imagenPrincipal = form.dataset.imagenPrincipal || "";
    const archivoPrincipal = form.imagenPrincipal.files[0];
    if (archivoPrincipal) {
      const storageRef = ref(storage, `productos/principal_${Date.now()}_${archivoPrincipal.name}`);
      await uploadBytes(storageRef, archivoPrincipal);
      imagenPrincipal = await getDownloadURL(storageRef);
    }

    const especificaciones = [...contVariantes.parentElement.querySelectorAll("[data-spec-clave]")]
      .map((el, i) => {
        const claveEl = el;
        const valorEl = contVariantes.parentElement.querySelectorAll("[data-spec-valor]")[i];
        return { clave: claveEl.value.trim(), valor: valorEl.value.trim() };
      })
      .filter((s) => s.clave && s.valor);

    const datos = {
      nombre: form.nombre.value.trim(),
      descripcion: form.descripcion.value.trim(),
      categoriaId: form.categoriaId.value,
      marcaId: form.marcaId.value,
      precio: parseFloat(form.precio.value || "0"),
      precioOferta: form.precioOferta.value ? parseFloat(form.precioOferta.value) : null,
      enOferta: !!form.precioOferta.value,
      destacado: form.destacado.checked,
      imagenPrincipal,
      variantes: variantesTemp,
      especificaciones,
      actualizadoEn: serverTimestamp(),
    };

    if (productoEditandoId) {
      await updateDoc(doc(db, "productos", productoEditandoId), datos);
      toast("Producto actualizado", "exito");
    } else {
      datos.creadoEn = serverTimestamp();
      await addDoc(collection(db, "productos"), datos);
      toast("Producto creado", "exito");
    }

    form.reset();
    variantesTemp = [];
    productoEditandoId = null;
    renderVariantesEditor();
    cargarProductos();
  } catch (err) {
    console.error(err);
    toast("No se pudo guardar el producto", "error");
  } finally {
    btn.disabled = false;
  }
});

async function cargarProductos() {
  if (!tablaProductos) return;
  const snap = await getDocs(collection(db, "productos"));
  tablaProductos.innerHTML = "";
  snap.forEach((d) => {
    const p = d.data();
    const stockTotal = (p.variantes || []).reduce((acc, v) => acc + (v.stock || 0), 0);
    tablaProductos.innerHTML += `
      <tr>
        <td><img class="tabla-thumb" src="${p.imagenPrincipal || "img/placeholder.png"}"></td>
        <td>${p.nombre}</td>
        <td>${formatearPrecio(p.precio)}</td>
        <td>${stockTotal}</td>
        <td>
          <button class="btn-icono" data-editar-producto="${d.id}">Editar</button>
          <button class="btn-icono" data-eliminar-producto="${d.id}">Eliminar</button>
        </td>
      </tr>`;
  });

  tablaProductos.querySelectorAll("[data-eliminar-producto]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este producto?")) return;
      await deleteDoc(doc(db, "productos", btn.dataset.eliminarProducto));
      cargarProductos();
    })
  );

  tablaProductos.querySelectorAll("[data-editar-producto]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const id = btn.dataset.editarProducto;
      const snapDoc = await getDocs(collection(db, "productos"));
      snapDoc.forEach((d) => {
        if (d.id !== id) return;
        const p = d.data();
        productoEditandoId = id;
        formProducto.nombre.value = p.nombre || "";
        formProducto.descripcion.value = p.descripcion || "";
        formProducto.categoriaId.value = p.categoriaId || "";
        formProducto.marcaId.value = p.marcaId || "";
        formProducto.precio.value = p.precio || "";
        formProducto.precioOferta.value = p.precioOferta || "";
        formProducto.destacado.checked = !!p.destacado;
        formProducto.dataset.imagenPrincipal = p.imagenPrincipal || "";
        variantesTemp = p.variantes || [];
        renderVariantesEditor();
        document.querySelector('[data-tab-btn="productos"]')?.click();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    })
  );
}

// ---------- Clientes ----------
async function cargarClientes() {
  const tabla = document.querySelector("[data-tabla-clientes]");
  if (!tabla) return;
  const snap = await getDocs(collection(db, "usuarios"));
  tabla.innerHTML = "";
  snap.forEach((d) => {
    const u = d.data();
    if (u.rol === "admin") return;
    tabla.innerHTML += `
      <tr>
        <td>${u.nombre || "—"}</td>
        <td>${u.correo || "—"}</td>
        <td>${u.telefono || "—"}</td>
      </tr>`;
  });
}

// ---------- Estadísticas ----------
async function cargarEstadisticas() {
  const cont = document.querySelector("[data-estadisticas]");
  if (!cont) return;
  const [productosSnap, pedidosSnap, clientesSnap] = await Promise.all([
    getDocs(collection(db, "productos")),
    getDocs(collection(db, "pedidos")),
    getDocs(collection(db, "usuarios")),
  ]);

  let ventasTotal = 0;
  let pendientes = 0;
  pedidosSnap.forEach((d) => {
    const p = d.data();
    ventasTotal += p.total || 0;
    if (p.estado === "pendiente") pendientes++;
  });

  cont.innerHTML = `
    <div class="stat-card"><span>Productos</span><strong>${productosSnap.size}</strong></div>
    <div class="stat-card"><span>Pedidos totales</span><strong>${pedidosSnap.size}</strong></div>
    <div class="stat-card"><span>Pedidos pendientes</span><strong>${pendientes}</strong></div>
    <div class="stat-card"><span>Clientes</span><strong>${clientesSnap.size}</strong></div>
    <div class="stat-card stat-card--ancho"><span>Ventas acumuladas</span><strong>${formatearPrecio(ventasTotal)}</strong></div>
  `;
}
