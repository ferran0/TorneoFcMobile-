/* script.js - V. final: landing con modo usuario/admin + registro 1 vez por dispositivo */
(() => {
  const LS_KEY = "fc_torneo_v1";
  const LS_CURRENT = "fc_torneo_current_player";
  const ADMIN_CODE = "0007";

  const app = { state: null, ui: {} };

  function init(){
    cacheUI();
    bindLanding();
    bindNav();
    loadState();
    // default show landing
  }

  function cacheUI(){
    // landing
    app.ui.landing = document.getElementById("landing");
    app.ui.enterUser = document.getElementById("enterUser");
    app.ui.enterAdmin = document.getElementById("enterAdmin");

    // main app layout
    app.ui.topbar = document.getElementById("topbar");
    app.ui.app = document.getElementById("app");
    app.ui.footer = document.getElementById("footer");
    app.ui.navBtns = document.querySelectorAll(".nav-btn[data-sec]");
    app.ui.volverLanding = document.getElementById("volverLanding");

    // registro
    app.ui.formRegistro = document.getElementById("formRegistro");
    app.ui.regNombre = document.getElementById("regNombre");
    app.ui.regPin = document.getElementById("regPin");
    app.ui.msgRegistro = document.getElementById("msgRegistro");
    app.ui.misDatos = document.getElementById("misDatos");
    app.ui.mdNombre = document.getElementById("md-nombre");
    app.ui.mdPin = document.getElementById("md-pin");
    app.ui.mdJornadas = document.getElementById("md-jornadas");

    // calendario + tabla
    app.ui.selectJornada = document.getElementById("selectJornada");
    app.ui.listaCalendario = document.getElementById("listaCalendario");
    app.ui.tablaBody = document.querySelector("#tablaClasificacion tbody");
    app.ui.exportCSV = document.getElementById("exportCSV");
    app.ui.exportJSON = document.getElementById("exportJSON");

    // admin UI
    app.ui.adminBtn = document.getElementById("adminBtn");
    app.ui.adminModal = document.getElementById("adminModal");
    app.ui.closeAdmin = document.getElementById("closeAdmin");
    app.ui.adminLogin = document.getElementById("adminLogin");
    app.ui.adminPanel = document.getElementById("adminPanel");
    app.ui.adminCodeInput = document.getElementById("adminCodeInput");
    app.ui.adminLoginBtn = document.getElementById("adminLoginBtn");
    app.ui.adminMsg = document.getElementById("adminMsg");
    app.ui.tabBtns = document.querySelectorAll(".tab-btn");
    app.ui.pinCount = document.getElementById("pinCount");
    app.ui.genPins = document.getElementById("genPins");
    app.ui.pinsTable = document.querySelector("#pinsTable tbody");
    app.ui.jugadoresTable = document.querySelector("#jugadoresTable tbody");
    app.ui.buscarJugador = document.getElementById("buscarJugador");
    app.ui.nroJornada = document.getElementById("nroJornada");
    app.ui.crearJornada = document.getElementById("crearJornada");
    app.ui.selJornadaForPart = document.getElementById("selJornadaForPart");
    app.ui.selLocal = document.getElementById("selLocal");
    app.ui.selVisitante = document.getElementById("selVisitante");
    app.ui.pFecha = document.getElementById("pFecha");
    app.ui.pHora = document.getElementById("pHora");
    app.ui.agregarPartido = document.getElementById("agregarPartido");
    app.ui.adminJornadasList = document.getElementById("adminJornadasList");
    app.ui.listPartidosResultados = document.getElementById("listPartidosResultados");
    app.ui.ptsWin = document.getElementById("ptsWin");
    app.ui.ptsDraw = document.getElementById("ptsDraw");
    app.ui.ptsLoss = document.getElementById("ptsLoss");
    app.ui.exportAll = document.getElementById("exportAll");
    app.ui.importAll = document.getElementById("importAll");
    app.ui.fileInput = document.getElementById("fileInput");
    app.ui.clearAll = document.getElementById("clearAll");
    app.ui.logoutAdmin = document.getElementById("logoutAdmin");
  }

  function bindLanding(){
    app.ui.enterUser.addEventListener("click", () => {
      openAppMode("user");
    });
    app.ui.enterAdmin.addEventListener("click", () => {
      openAppMode("admin");
    });
  }

  function bindNav(){
    document.querySelectorAll(".nav-btn[data-sec]").forEach(btn =>
      btn.addEventListener("click", (e) => {
        showSection(btn.dataset.sec);
        document.querySelectorAll(".nav-btn").forEach(n => n.classList.remove("active"));
        btn.classList.add("active");
      })
    );
    app.ui.volverLanding.addEventListener("click", () => {
      // return to landing
      app.ui.app.classList.add("hidden");
      app.ui.topbar.classList.add("hidden");
      app.ui.footer.classList.add("hidden");
      app.ui.landing.classList.remove("hidden");
      logoutAdmin();
    });

    // registro + exports
    app.ui.formRegistro.addEventListener("submit", handleRegister);
    app.ui.exportCSV.addEventListener("click", exportTableCSV);
    app.ui.exportJSON.addEventListener("click", exportDBJSON);

    // admin
    app.ui.adminBtn.addEventListener("click", () => {
      app.ui.adminModal.classList.remove("hidden");
    });
    app.ui.closeAdmin.addEventListener("click", () => {
      app.ui.adminModal.classList.add("hidden");
      logoutAdmin();
    });
    app.ui.adminLoginBtn.addEventListener("click", adminLogin);
    app.ui.tabBtns.forEach(b => b.addEventListener("click", switchTab));
    app.ui.genPins.addEventListener("click", () => {
      const n = Number(app.ui.pinCount.value) || 0;
      if (n <= 0) return alert("Ingresa una cantidad válida.");
      generatePins(n);
    });

    app.ui.buscarJugador.addEventListener("input", renderJugadoresTable);
    app.ui.crearJornada.addEventListener("click", () => {
      const nro = Number(app.ui.nroJornada.value) || 1;
      createJornada(nro);
    });
    app.ui.agregarPartido.addEventListener("click", handleAgregarPartido);
    app.ui.exportAll?.addEventListener("click", exportDBJSON);
    app.ui.importAll?.addEventListener("click", () => app.ui.fileInput?.click());
    app.ui.fileInput?.addEventListener("change", handleImportFile);
    app.ui.clearAll?.addEventListener("click", handleClearAll);
    app.ui.logoutAdmin?.addEventListener("click", logoutAdmin);
    app.ui.ptsWin?.addEventListener("change", () => saveState());
    app.ui.ptsDraw?.addEventListener("change", () => saveState());
    app.ui.ptsLoss?.addEventListener("change", () => saveState());
  }

  /* ---------- STATE ---------- */
  function defaultState(){
    return {
      config: {
        adminCode: ADMIN_CODE,
        puntos: { win: 3, draw: 1, loss: 0 }
      },
      pins: [],
      jugadores: [],
      jornadas: [],
      lastUpdated: new Date().toISOString()
    };
  }

  function loadState(){
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      app.state = defaultState();
      saveState(false);
    } else {
      try {
        app.state = JSON.parse(raw);
        if (!app.state.config) app.state.config = defaultState().config;
        if (!app.state.pins) app.state.pins = [];
        if (!app.state.jugadores) app.state.jugadores = [];
        if (!app.state.jornadas) app.state.jornadas = [];
      } catch(e){
        console.error("Error parse LS:", e);
        app.state = defaultState();
        saveState(false);
      }
    }
  }

  function saveState(rerender = true){
    app.state.lastUpdated = new Date().toISOString();
    app.state.config.puntos.win = Number(app.ui.ptsWin?.value ?? app.state.config.puntos.win);
    app.state.config.puntos.draw = Number(app.ui.ptsDraw?.value ?? app.state.config.puntos.draw);
    app.state.config.puntos.loss = Number(app.ui.ptsLoss?.value ?? app.state.config.puntos.loss);
    localStorage.setItem(LS_KEY, JSON.stringify(app.state));
    if (rerender) renderAll();
  }

  /* ---------- UI MODE ---------- */
  function openAppMode(mode){
    // hide landing, show app
    app.ui.landing.classList.add("hidden");
    app.ui.topbar.classList.remove("hidden");
    app.ui.app.classList.remove("hidden");
    app.ui.footer.classList.remove("hidden");
    showSection("registro");
    document.querySelectorAll(".nav-btn").forEach(n => n.classList.remove("active"));
    document.querySelector('.nav-btn[data-sec="registro"]').classList.add("active");

    if (mode === "admin") {
      // open admin login modal directly
      app.ui.adminModal.classList.remove("hidden");
      app.ui.adminLogin.classList.remove("hidden");
      app.ui.adminPanel.classList.add("hidden");
    } else {
      // user mode: do nothing special: users can view calendar and tabla and register
      // show/hide register form based on whether device already registered
      const current = localStorage.getItem(LS_CURRENT);
      if (current) {
        // show current data
        const player = app.state.jugadores.find(j=>j.id===current);
        if (player) showMyData(player);
        else localStorage.removeItem(LS_CURRENT);
      } else {
        // ensure form visible
        app.ui.misDatos.classList.add("hidden");
      }
    }
  }

  /* ---------- RENDER ---------- */
  function renderAll(){
    populateConfigUI();
    renderSelectJornadas();
    renderCalendario();
    renderTabla();
    renderPinsTable();
    renderJugadoresTable();
    renderAdminJornadas();
    renderPartidosResultados();
    syncRegistrationState();
  }

  function populateConfigUI(){
    app.ui.ptsWin && (app.ui.ptsWin.value = app.state.config.puntos.win);
    app.ui.ptsDraw && (app.ui.ptsDraw.value = app.state.config.puntos.draw);
    app.ui.ptsLoss && (app.ui.ptsLoss.value = app.state.config.puntos.loss);
  }

  function showSection(id){
    document.querySelectorAll(".panel").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  /* ---------- REGISTRO USUARIO (1 vez por dispositivo) ---------- */
  function handleRegister(e){
    e.preventDefault();
    const nombre = app.ui.regNombre.value.trim();
    const pin = app.ui.regPin.value.trim();

    app.ui.msgRegistro.textContent = "";
    if (!nombre || nombre.length < 2) {
      app.ui.msgRegistro.textContent = "Nombre demasiado corto.";
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      app.ui.msgRegistro.textContent = "PIN debe tener 4 dígitos.";
      return;
    }

    // check device hasn't already registered a player
    const current = localStorage.getItem(LS_CURRENT);
    if (current) {
      app.ui.msgRegistro.textContent = "Este dispositivo ya registró un jugador.";
      return;
    }

    const pinObj = app.state.pins.find(p => p.pin === pin);
    if (!pinObj) {
      app.ui.msgRegistro.textContent = "PIN inválido. Pide a un admin que te envíe uno.";
      return;
    }
    if (pinObj.usado) {
      app.ui.msgRegistro.textContent = "Ese PIN ya fue usado.";
      return;
    }

    if (app.state.jugadores.some(j => j.nombre.toLowerCase() === nombre.toLowerCase())) {
      app.ui.msgRegistro.textContent = "Nombre ya registrado. Usa otro nombre o contacta admin.";
      return;
    }

    const id = "j" + Date.now() + Math.floor(Math.random()*999);
    const jugador = { id, nombre, pin, registradoEn: new Date().toISOString() };
    app.state.jugadores.push(jugador);
    pinObj.usado = true;
    pinObj.jugadorId = id;
    saveState();

    // mark this device as used
    localStorage.setItem(LS_CURRENT, id);

    app.ui.msgRegistro.textContent = "✔ Registro exitoso";
    app.ui.regNombre.value = "";
    app.ui.regPin.value = "";
    showMyData(jugador);
  }

  function showMyData(j){
    app.ui.misDatos.classList.remove("hidden");
    app.ui.mdNombre.textContent = "Nombre: " + j.nombre;
    app.ui.mdPin.textContent = "PIN: " + j.pin;
    const jornadasAsignadas = [];
    app.state.jornadas.forEach(jr => {
      jr.partidos.forEach(p => {
        if ((p.local === j.nombre) || (p.visitante === j.nombre)) {
          jornadasAsignadas.push(`J${jr.numero}: ${p.local} vs ${p.visitante} (${p.fecha || '?'} ${p.hora || ''})`);
        }
      });
    });
    app.ui.mdJornadas.textContent = jornadasAsignadas.length ? "Asignado en: " + jornadasAsignadas.join(" | ") : "No tiene partidos asignados aún.";
  }

  function syncRegistrationState(){
    const current = localStorage.getItem(LS_CURRENT);
    if (current) {
      const player = app.state.jugadores.find(j=>j.id===current);
      if (player) showMyData(player);
      else {
        localStorage.removeItem(LS_CURRENT);
        app.ui.misDatos.classList.add("hidden");
      }
    } else {
      app.ui.misDatos.classList.add("hidden");
    }
  }

  /* ---------- PINS ---------- */
  function generatePins(n){
    const created = [];
    let attempts = 0;
    while (created.length < n && attempts < n * 10) {
      const pin = ("" + Math.floor(1000 + Math.random() * 9000));
      if (!app.state.pins.some(p => p.pin === pin)) {
        const obj = { pin, creadoEn: new Date().toISOString(), usado: false, jugadorId: null };
        app.state.pins.push(obj);
        created.push(obj);
      }
      attempts++;
    }
    saveState();
    alert(`${created.length} PINs generados.`);
    renderPinsTable();
  }

  function renderPinsTable(){
    if (!app.ui.pinsTable) return;
    app.ui.pinsTable.innerHTML = "";
    app.state.pins.slice().reverse().forEach(p => {
      const tr = document.createElement("tr");
      const estado = p.usado ? "Usado" : "Disponible";
      tr.innerHTML = `
        <td><strong>${p.pin}</strong></td>
        <td>${estado}</td>
        <td>
          <button class="btn outline copyPin" data-pin="${p.pin}">Copiar</button>
        </td>
      `;
      app.ui.pinsTable.appendChild(tr);
    });
    document.querySelectorAll(".copyPin").forEach(b => b.addEventListener("click", (e) => {
      const pin = e.currentTarget.dataset.pin;
      navigator.clipboard?.writeText(pin).then(() => {
        alert("PIN copiado: " + pin);
      }, () => alert("No se pudo copiar"));
    }));
  }

  /* ---------- JUGADORES ---------- */
  function renderJugadoresTable(){
    const q = app.ui.buscarJugador.value?.toLowerCase?.() || "";
    if (!app.ui.jugadoresTable) return;
    app.ui.jugadoresTable.innerHTML = "";
    app.state.jugadores.forEach(j => {
      if (q && !j.nombre.toLowerCase().includes(q)) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${j.nombre}</td>
        <td>${j.pin}</td>
        <td>
          <button class="btn outline viewPlayer" data-id="${j.id}">Ver</button>
          <button class="btn danger delPlayer" data-id="${j.id}">Eliminar</button>
        </td>
      `;
      app.ui.jugadoresTable.appendChild(tr);
    });
    document.querySelectorAll(".delPlayer").forEach(b => b.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Eliminar jugador? Esto afectará partidos.")) return;
      deletePlayer(id);
    }));
  }

  function deletePlayer(id){
    const pin = app.state.pins.find(p => p.jugadorId === id);
    if (pin) { pin.jugadorId = null; pin.usado = false; }
    app.state.jugadores = app.state.jugadores.filter(j => j.id !== id);
    app.state.jornadas.forEach(jr => {
      jr.partidos.forEach(p => {
        if (p.local === id) p.local = "Libre";
        if (p.visitante === id) p.visitante = "Libre";
      });
    });
    // if deleted current device player, remove marker
    const current = localStorage.getItem(LS_CURRENT);
    if (current === id) localStorage.removeItem(LS_CURRENT);
    saveState();
  }

  /* ---------- JORNADAS / PARTIDOS ---------- */
  function createJornada(numero){
    if (app.state.jornadas.some(j => j.numero === numero)){
      alert("Esa jornada ya existe.");
      return;
    }
    const id = "jr" + Date.now() + Math.floor(Math.random()*999);
    app.state.jornadas.push({ id, numero, partidos: [] });
    saveState();
    alert("Jornada creada: " + numero);
  }

  function handleAgregarPartido(){
    const jrId = app.ui.selJornadaForPart.value;
    const local = app.ui.selLocal.value.trim();
    const visitante = app.ui.selVisitante.value.trim();
    const fecha = app.ui.pFecha.value || null;
    const hora = app.ui.pHora.value || null;
    if (!jrId) return alert("Selecciona una jornada.");
    if (!local || !visitante) return alert("Selecciona local y visitante.");
    if (local === visitante) return alert("Local y visitante no pueden ser iguales.");
    const jr = app.state.jornadas.find(j => j.id === jrId);
    if (!jr) return alert("Jornada no encontrada.");

    const id = "p" + Date.now() + Math.floor(Math.random()*999);
    const partido = { id, local, visitante, fecha, hora, resultado: null };
    jr.partidos.push(partido);
    saveState();
    alert("Partido agregado.");
  }

  function renderAdminJornadas(){
    // fill select for adding partido
    if (!app.ui.selJornadaForPart) return;
    app.ui.selJornadaForPart.innerHTML = "";
    app.ui.selJornadaForPart.appendChild(new Option("-- Selecciona --", ""));
    app.state.jornadas.slice().sort((a,b)=>a.numero-b.numero).forEach(jr => {
      app.ui.selJornadaForPart.appendChild(new Option("Jornada " + jr.numero, jr.id));
    });

    // players in selLocal/selVisitante
    app.ui.selLocal.innerHTML = ""; app.ui.selVisitante.innerHTML = "";
    app.ui.selLocal.appendChild(new Option("-- Selecciona jugador --",""));
    app.ui.selVisitante.appendChild(new Option("-- Selecciona jugador --",""));
    app.state.jugadores.forEach(j => {
      app.ui.selLocal.appendChild(new Option(j.nombre, j.nombre));
      app.ui.selVisitante.appendChild(new Option(j.nombre, j.nombre));
    });
    app.ui.selLocal.appendChild(new Option("Libre","Libre"));
    app.ui.selVisitante.appendChild(new Option("Libre","Libre"));

    // render jornadas list
    app.ui.adminJornadasList.innerHTML = "";
    if (app.state.jornadas.length === 0) {
      app.ui.adminJornadasList.innerHTML = "<p class='muted'>No hay jornadas creadas.</p>";
      return;
    }
    app.state.jornadas.slice().sort((a,b)=>a.numero-b.numero).forEach(jr => {
      const div = document.createElement("div");
      div.className = "card";
      let html = `<h4>Jornada ${jr.numero} <button data-jid="${jr.id}" class="btn outline delJr">Eliminar</button></h4>`;
      if (jr.partidos.length === 0) html += "<p class='muted'>Sin partidos</p>";
      else {
        html += "<div>";
        jr.partidos.forEach(p => {
          const res = p.resultado ? `${p.resultado.l} - ${p.resultado.v}` : " - ";
          html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.02)">
            <div><strong>${p.local}</strong> vs <strong>${p.visitante}</strong><div class="kv">${p.fecha || ''} ${p.hora || ''}</div></div>
            <div style="text-align:right">
              <div class="kv">Resultado: <span class="result">${res}</span></div>
              <div style="margin-top:6px">
                <button data-jid="${jr.id}" data-pid="${p.id}" class="btn outline editP">Editar</button>
                <button data-jid="${jr.id}" data-pid="${p.id}" class="btn danger delP">Eliminar</button>
              </div>
            </div>
          </div>`;
        });
        html += "</div>";
      }
      div.innerHTML = html;
      app.ui.adminJornadasList.appendChild(div);
    });

    // bind delete jornada / partido events
    document.querySelectorAll(".delJr").forEach(b => b.addEventListener("click", e => {
      const id = e.currentTarget.dataset.jid;
      if (!confirm("Eliminar jornada y todos sus partidos?")) return;
      app.state.jornadas = app.state.jornadas.filter(j => j.id !== id);
      saveState();
    }));
    document.querySelectorAll(".delP").forEach(b => b.addEventListener("click", e=>{
      const jid = e.currentTarget.dataset.jid;
      const pid = e.currentTarget.dataset.pid;
      const jr = app.state.jornadas.find(x=>x.id===jid);
      if (!jr) return;
      jr.partidos = jr.partidos.filter(p=>p.id!==pid);
      saveState();
    }));
    document.querySelectorAll(".editP").forEach(b => b.addEventListener("click", e=>{
      const jid = e.currentTarget.dataset.jid;
      const pid = e.currentTarget.dataset.pid;
      const jr = app.state.jornadas.find(x=>x.id===jid);
      if (!jr) return;
      const p = jr.partidos.find(pp=>pp.id===pid);
      if (!p) return;
      const nuevoLocal = prompt("Local", p.local) || p.local;
      const nuevoVis = prompt("Visitante", p.visitante) || p.visitante;
      const fecha = prompt("Fecha (YYYY-MM-DD)", p.fecha || "") || p.fecha;
      const hora = prompt("Hora (HH:MM)", p.hora || "") || p.hora;
      p.local = nuevoLocal; p.visitante = nuevoVis; p.fecha = fecha; p.hora = hora;
      saveState();
    }));
  }

  /* ---------- CALENDARIO (por jornada) ---------- */
  function renderSelectJornadas(){
    if (!app.ui.selectJornada) return;
    app.ui.selectJornada.innerHTML = "";
    app.ui.selectJornada.appendChild(new Option("Todas las jornadas", "all"));
    app.state.jornadas.slice().sort((a,b)=>a.numero-b.numero).forEach(jr => {
      app.ui.selectJornada.appendChild(new Option("Jornada " + jr.numero, jr.id));
    });
    app.ui.selectJornada.addEventListener("change", renderCalendario);
  }

  function renderCalendario(){
    const sel = app.ui.selectJornada.value || "all";
    app.ui.listaCalendario.innerHTML = "";
    const jornadas = sel === "all" ? app.state.jornadas : app.state.jornadas.filter(j => j.id === sel);
    if (jornadas.length === 0) {
      app.ui.listaCalendario.innerHTML = "<p class='muted'>No hay partidos programados.</p>";
      return;
    }
    jornadas.slice().sort((a,b)=>a.numero-b.numero).forEach(jr => {
      // jornada header
      const header = document.createElement("div");
      header.className = "card";
      header.innerHTML = `<h3>Jornada ${jr.numero}</h3>`;
      app.ui.listaCalendario.appendChild(header);
      // partidos
      jr.partidos.forEach(p => {
        const card = document.createElement("div");
        card.className = "match-card";
        const registradoLocal = app.state.jugadores.some(j => j.nombre === p.local);
        const registradoVis = app.state.jugadores.some(j => j.nombre === p.visitante);
        const resText = p.resultado ? `<span class="result">${p.resultado.l} - ${p.resultado.v}</span>` : `<span class="badge">Pendiente</span>`;
        card.innerHTML = `
          <div class="match-top">
            <div><strong>J${jr.numero}</strong> • <span class="kv">${p.fecha || ''} ${p.hora || ''}</span></div>
            <div class="badge">${registradoLocal ? "✔" : "—"} / ${registradoVis ? "✔" : "—"}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div><strong>${p.local}</strong> <span class="kv">vs</span> <strong>${p.visitante}</strong></div>
              <div class="kv">ID: ${p.id}</div>
            </div>
            <div style="text-align:center">
              ${resText}
            </div>
          </div>
        `;
        app.ui.listaCalendario.appendChild(card);
      });
    });
  }

  /* ---------- RESULTADOS ---------- */
  function renderPartidosResultados(){
    if (!app.ui.listPartidosResultados) return;
    app.ui.listPartidosResultados.innerHTML = "";
    app.state.jornadas.slice().sort((a,b)=>a.numero-b.numero).forEach(jr => {
      jr.partidos.forEach(p => {
        const div = document.createElement("div");
        div.className = "card";
        const l = p.resultado ? p.resultado.l : "";
        const v = p.resultado ? p.resultado.v : "";
        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><strong>J${jr.numero}</strong> • ${p.local} vs ${p.visitante} <div class="kv">${p.fecha || ''} ${p.hora || ''}</div></div>
            <div style="display:flex;gap:6px;align-items:center">
              <input data-pid="${p.id}" data-jid="${jr.id}" class="resInput" type="number" min="0" placeholder="L" value="${l}" style="width:60px" />
              <span>:</span>
              <input data-pid="${p.id}" data-jid="${jr.id}" class="resInput" type="number" min="0" placeholder="V" value="${v}" style="width:60px" />
              <button data-pid="${p.id}" data-jid="${jr.id}" class="btn neon-purple saveRes">Guardar</button>
              <button data-pid="${p.id}" data-jid="${jr.id}" class="btn outline clearRes">Limpiar</button>
            </div>
          </div>
        `;
        app.ui.listPartidosResultados.appendChild(div);
      });
    });

    document.querySelectorAll(".saveRes").forEach(b => b.addEventListener("click", (e) => {
      const pid = e.currentTarget.dataset.pid;
      const jid = e.currentTarget.dataset.jid;
      const inputs = Array.from(document.querySelectorAll(`.resInput[data-pid="${pid}"][data-jid="${jid}"]`));
      const lval = Number(inputs[0].value);
      const vval = Number(inputs[1].value);
      if (isNaN(lval) || isNaN(vval)) return alert("Ingresa goles válidos (0+).");
      setResultado(jid, pid, lval, vval);
    }));

    document.querySelectorAll(".clearRes").forEach(b => b.addEventListener("click", (e) => {
      const pid = e.currentTarget.dataset.pid;
      const jid = e.currentTarget.dataset.jid;
      clearResultado(jid, pid);
    }));
  }

  function setResultado(jid, pid, golesL, golesV){
    const jr = app.state.jornadas.find(j=>j.id===jid);
    if (!jr) return;
    const p = jr.partidos.find(pp=>pp.id===pid);
    if (!p) return;
    p.resultado = { l: Math.max(0, Number(golesL)), v: Math.max(0, Number(golesV)) };
    saveState();
  }

  function clearResultado(jid, pid){
    const jr = app.state.jornadas.find(j=>j.id===jid);
    if (!jr) return;
    const p = jr.partidos.find(pp=>pp.id===pid);
    if (!p) return;
    p.resultado = null;
    saveState();
  }

  /* ---------- TABLA ---------- */
  function buildTabla(){
    const stats = {};
    app.state.jugadores.forEach(j => {
      stats[j.nombre] = { nombre: j.nombre, puntos:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dif:0 };
    });

    app.state.jornadas.forEach(jr => {
      jr.partidos.forEach(p => {
        if (!p.resultado) return;
        const locals = p.local || "Libre";
        const visits = p.visitante || "Libre";
        if (!stats[locals]) stats[locals] = { nombre: locals, puntos:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dif:0 };
        if (!stats[visits]) stats[visits] = { nombre: visits, puntos:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dif:0 };

        const l = Number(p.resultado.l), v = Number(p.resultado.v);
        stats[locals].pj += 1;
        stats[visits].pj += 1;
        stats[locals].gf += l;
        stats[locals].gc += v;
        stats[visits].gf += v;
        stats[visits].gc += l;

        if (l > v) {
          stats[locals].pg += 1;
          stats[visits].pp += 1;
          stats[locals].puntos += app.state.config.puntos.win;
          stats[visits].puntos += app.state.config.puntos.loss;
        } else if (l < v) {
          stats[visits].pg += 1;
          stats[locals].pp += 1;
          stats[visits].puntos += app.state.config.puntos.win;
          stats[locals].puntos += app.state.config.puntos.loss;
        } else {
          stats[locals].pe += 1;
          stats[visits].pe += 1;
          stats[locals].puntos += app.state.config.puntos.draw;
          stats[visits].puntos += app.state.config.puntos.draw;
        }
      });
    });

    Object.values(stats).forEach(s => s.dif = s.gf - s.gc);
    return stats;
  }

  function renderTabla(){
    if (!app.ui.tablaBody) return;
    const statsMap = buildTabla();
    const arr = Object.values(statsMap);
    arr.sort((a,b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.dif !== a.dif) return b.dif - a.dif;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.nombre.localeCompare(b.nombre);
    });
    app.ui.tablaBody.innerHTML = "";
    arr.forEach((r, idx) => {
      const tr = document.createElement("tr");
      if (idx < 3) tr.classList.add("pos-top");
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td style="text-align:left">${r.nombre}</td>
        <td>${r.puntos}</td>
        <td>${r.pj}</td>
        <td>${r.pg}</td>
        <td>${r.pe}</td>
        <td>${r.pp}</td>
        <td>${r.gf}</td>
        <td>${r.gc}</td>
        <td>${r.dif}</td>
      `;
      app.ui.tablaBody.appendChild(tr);
    });
  }

  /* ---------- EXPORT / IMPORT ---------- */
  function exportDBJSON(){
    const data = JSON.stringify(app.state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fc_torneo_backup.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportTableCSV(){
    const statsMap = buildTabla();
    const rows = [["Pos","Jugador","PTS","PJ","PG","PE","PP","GF","GC","DIF"]];
    const arr = Object.values(statsMap);
    arr.sort((a,b)=> b.puntos - a.puntos || b.dif - a.dif || b.gf - a.gf || a.nombre.localeCompare(b.nombre));
    arr.forEach((r, i) => rows.push([i+1,r.nombre,r.puntos,r.pj,r.pg,r.pe,r.pp,r.gf,r.gc,r.dif]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "tabla_clasificacion.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e){
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!confirm("Importar JSON reemplazará la base actual. Continuar?")) return;
        app.state = parsed;
        saveState();
      } catch(err){
        alert("Archivo inválido.");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }

  function handleClearAll(){
    if (!confirm("Eliminar todos los datos del torneo?")) return;
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_CURRENT);
    app.state = defaultState();
    saveState();
  }

  /* ---------- ADMIN AUTH ---------- */
  function adminLogin(){
    const code = app.ui.adminCodeInput.value?.trim();
    if (code === app.state.config.adminCode) {
      app.ui.adminLogin.classList.add("hidden");
      app.ui.adminPanel.classList.remove("hidden");
      app.ui.adminMsg.textContent = "";
      renderAll();
    } else {
      app.ui.adminMsg.textContent = "Clave incorrecta.";
    }
    app.ui.adminCodeInput.value = "";
  }

  function logoutAdmin(){
    app.ui.adminPanel.classList.add("hidden");
    app.ui.adminLogin.classList.remove("hidden");
    app.ui.adminModal.classList.add("hidden");
  }

  /* ---------- UI TAB SWITCH ---------- */
  function switchTab(e){
    document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    const t = e.currentTarget.dataset.tab;
    document.getElementById("tab" + capitalize(t)).classList.remove("hidden");
    e.currentTarget.classList.add("active");
  }
  function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- START / RENDER ---------- */
  function renderAll(){
    populateConfigUI();
    renderSelectJornadas();
    renderCalendario();
    renderTabla();
    renderPinsTable();
    renderJugadoresTable();
    renderAdminJornadas();
    renderPartidosResultados();
    syncRegistrationState();
  }

  init();
})();
