/* ============ CONFIGURAÇÃO (edite aqui) ============ */
const CONFIG = {
  whatsapp: "5511996007361",                                  /* (11) 99600-7361 */
  instagram: "https://www.instagram.com/reabilitacao.bem.estar/"
};
/* =================================================== */

document.querySelectorAll("[data-wa]").forEach(a => {
  a.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(a.dataset.wa);
});
document.querySelectorAll("[data-instagram]").forEach(a => { a.href = CONFIG.instagram; });

/* ─────────────────────────────────────────────────────────────
   Movimento em JavaScript. Só o que o CSS não resolve:
   posição de rolagem, indicador que se move entre destinos e
   a abertura da foto a partir da miniatura clicada (FLIP).
   Curvas e durações seguem o padrão do review-animations.
   ───────────────────────────────────────────────────────────── */
const EASE_OUT = "cubic-bezier(.23, 1, .32, 1)";
const EASE_IN_OUT = "cubic-bezier(.77, 0, .175, 1)";
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const calm = () => motionQuery.matches;

/* 1. Parallax das fotos ─ a imagem corre um pouco mais devagar que a página.
      transform apenas, dentro de um quadro que corta, e só enquanto visível. */
(() => {
  const frames = [...document.querySelectorAll(".photo .frame")];
  if (!frames.length) return;

  const visible = new Set();
  let ticking = false;

  const range = () => (window.innerWidth < 700 ? 12 : 20);

  function place(frame) {
    const img = frame.querySelector("img");
    if (!img) return;
    const r = frame.getBoundingClientRect();
    const travel = (window.innerHeight - r.top) / (window.innerHeight + r.height); // 0 → 1
    const offset = (Math.min(Math.max(travel, 0), 1) - 0.5) * range();
    img.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.1)`;
  }

  function frame$() {
    ticking = false;
    visible.forEach(place);
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame$);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
    if (visible.size) onScroll();
  }, { rootMargin: "120px 0px" });

  function enable() {
    frames.forEach(f => io.observe(f));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }
  function disable() {
    io.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    frames.forEach(f => { const i = f.querySelector("img"); if (i) i.style.transform = ""; });
  }

  if (!calm()) enable();
  motionQuery.addEventListener("change", () => (calm() ? disable() : enable()));
})();

/* 2. Indicador do menu ─ um traço que desliza até a seção em que você está.
      Move-se por transform (translateX + scaleX), nunca por left/width.    */
(() => {
  const list = document.querySelector(".mast__nav ul");
  if (!list) return;
  const links = [...list.querySelectorAll('a[href^="#"]')];
  const targets = links
    .map(a => ({ a, el: document.querySelector(a.getAttribute("href")) }))
    .filter(t => t.el);
  if (!targets.length) return;

  const mark = document.createElement("span");
  mark.className = "mast__ind";
  mark.setAttribute("aria-hidden", "true");
  list.appendChild(mark);

  let current = null;
  function moveTo(link) {
    if (link === current) return;
    current = link;
    targets.forEach(t => (t.a === link ? t.a.setAttribute("aria-current", "true") : t.a.removeAttribute("aria-current")));
    if (!link) { mark.style.opacity = "0"; return; }
    const l = link.getBoundingClientRect(), u = list.getBoundingClientRect();
    mark.style.transitionDuration = calm() ? "0ms" : "";
    mark.style.opacity = "1";
    mark.style.transform = `translateX(${(l.left - u.left).toFixed(1)}px) scaleX(${(l.width / 100).toFixed(4)})`;
  }

  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const hit = targets.find(t => t.el === en.target);
      if (hit) moveTo(hit.a);
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  targets.forEach(t => spy.observe(t.el));
  window.addEventListener("resize", () => { const c = current; current = null; moveTo(c); }, { passive: true });
})();

/* 3. Galeria ─ a foto cresce a partir da miniatura que você tocou (FLIP),
      com WAAPI: acelerado por GPU, interrompível e reversível.            */
const plates = [...document.querySelectorAll(".plate")];
const lb = document.getElementById("lb");
const lbStage = document.getElementById("lb-stage");
const lbCap = document.getElementById("lb-cap");

if (lb && plates.length) {
  let i = 0, lastFocus = null, running = null;

  function render(n) {
    i = (n + plates.length) % plates.length;
    const src = plates[i].querySelector("img");
    const full = document.createElement("img");
    full.src = src.currentSrc || src.src;
    full.alt = src.alt;
    lbStage.replaceChildren(full);
    lbCap.textContent = plates[i].dataset.cap || "";
    return full;
  }

  /* transform que leva a foto ampliada de volta ao lugar da miniatura */
  function toThumb(full, thumb) {
    const a = thumb.getBoundingClientRect(), b = full.getBoundingClientRect();
    if (!b.width || !b.height) return "scale(.96)";
    const scale = Math.max(a.width / b.width, 0.05);
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(4)})`;
  }

  async function show(n, animateFrom) {
    const full = render(n);
    if (full.decode) { try { await full.decode(); } catch (e) { /* imagem em cache ou falha: segue */ } }
    if (calm() || !animateFrom) return;
    running?.cancel();
    running = full.animate(
      [{ transform: toThumb(full, animateFrom), opacity: 0.4 }, { transform: "none", opacity: 1 }],
      { duration: 280, easing: EASE_OUT }
    );
  }

  function open(n) {
    lastFocus = document.activeElement;
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (!calm()) lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
    show(n, plates[n].querySelector("img"));
    document.getElementById("lb-close").focus();
  }

  function close() {
    const full = lbStage.querySelector("img");
    const thumb = plates[i].querySelector("img");
    document.body.style.overflow = "";
    const done = () => { lb.classList.remove("is-open"); if (lastFocus) lastFocus.focus(); };
    if (calm() || !full) return done();
    running?.cancel();
    /* volta para a miniatura correspondente, mesmo depois de navegar pelas setas */
    full.animate([{ transform: "none", opacity: 1 }, { transform: toThumb(full, thumb), opacity: 0 }],
      { duration: 220, easing: EASE_IN_OUT });
    lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: EASE_IN_OUT }).finished
      .then(done).catch(done);
  }

  /* trocar de foto: deslize curto no sentido da navegação */
  function step(dir) {
    const from = dir > 0 ? 18 : -18;
    render(i + dir);
    const full = lbStage.querySelector("img");
    if (!calm() && full) {
      running?.cancel();
      running = full.animate(
        [{ transform: `translateX(${from}px)`, opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 220, easing: EASE_OUT }
      );
    }
  }

  plates.forEach((p, n) => p.addEventListener("click", () => open(n)));
  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", () => step(-1));
  document.getElementById("lb-next").addEventListener("click", () => step(1));
  lb.addEventListener("click", e => { if (e.target === lb) close(); });

  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Tab") {
      const f = [...lb.querySelectorAll("button")], first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* 4. Toque nas pranchas: resposta imediata ao dedo, onde o hover não existe */
if (!finePointer.matches) {
  document.querySelectorAll(".plate").forEach(p => {
    const img = p.querySelector("img");
    if (!img) return;
    p.addEventListener("pointerdown", () => { if (!calm()) img.style.transform = "scale(.985)"; });
    ["pointerup", "pointercancel", "pointerleave"].forEach(ev =>
      p.addEventListener(ev, () => { img.style.transform = ""; }));
  });
}


/* ─────────────────────────────────────────────────────────────
   Aplicativo instalável (PWA)
   Registra o service worker, que guarda o site para abrir rápido
   e funcionar sem conexão. Só roda em servidor com HTTPS — em
   arquivo local ou dentro de uma pré-visualização, não faz nada.
   ───────────────────────────────────────────────────────────── */
(() => {
  const temManifest = !!document.querySelector('link[rel="manifest"]');
  const seguro = location.protocol === "https:" || ["localhost","127.0.0.1"].includes(location.hostname);
  if (!("serviceWorker" in navigator) || !temManifest || !seguro) return;

  const aviso = document.getElementById("update");
  let esperando = null;

  function mostrarAviso(worker) {
    esperando = worker;
    if (aviso) aviso.classList.add("is-on");
  }

  if (aviso) {
    document.getElementById("update-go")?.addEventListener("click", () => {
      aviso.classList.remove("is-on");
      esperando?.postMessage("aplicar-atualizacao");
    });
    document.getElementById("update-no")?.addEventListener("click", () => aviso.classList.remove("is-on"));
  }

  /* o navegador troca de worker: recarrega uma única vez */
  let recarregando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recarregando) return;
    recarregando = true;
    location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw.js", { scope: "./" });
      if (reg.waiting && navigator.serviceWorker.controller) mostrarAviso(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const novo = reg.installing;
        if (!novo) return;
        novo.addEventListener("statechange", () => {
          /* instalado com um worker já no comando = é atualização, não primeira visita */
          if (novo.state === "installed" && navigator.serviceWorker.controller) mostrarAviso(novo);
        });
      });
      /* procura versão nova quando a pessoa volta ao site */
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
    } catch (e) {
      /* sem service worker o site funciona igual, só não fica disponível offline */
    }
  });
})();
