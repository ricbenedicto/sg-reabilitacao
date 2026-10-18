/* ─────────────────────────────────────────────────────────────
   Service worker — SG Reabilitação e Bem Estar

   Estratégias:
   · navegação (páginas) → rede primeiro, cache como rede de segurança
     (o conteúdo do site muda pouco, mas quando muda precisa chegar)
   · arquivos fixos (css, js, fontes, imagens) → cache primeiro,
     com atualização em segundo plano
   · sem rede e sem cache → página offline.html

   Ao publicar uma alteração, troque o número da VERSAO.
   Isso descarta o cache antigo e entrega os arquivos novos.
   ───────────────────────────────────────────────────────────── */

const VERSAO = "sg-v3";
const CACHE_ESTATICO = `${VERSAO}-estatico`;
const CACHE_PAGINAS = `${VERSAO}-paginas`;

/* o essencial para o site abrir sem rede */
const ESSENCIAL = [
  "./",
  "./index.html",
  "./fisioterapia.html",
  "./psicologia.html",
  "./offline.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
  "./icones/apple-touch-icon.png",
  "./imagens/dra-sthephany.webp",
  "./imagens/sala-fisio.webp",
  "./imagens/placa-graziela.webp",
  "./imagens/sofa.webp",
  "./imagens/fachada.webp"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_ESTATICO);
    /* um arquivo que falhe não pode derrubar a instalação inteira */
    await Promise.all(ESSENCIAL.map(url =>
      cache.add(new Request(url, { cache: "reload" })).catch(() => {})
    ));
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes
      .filter(n => !n.startsWith(VERSAO))
      .map(n => caches.delete(n)));
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/* a página pede a troca quando a pessoa aceita atualizar */
self.addEventListener("message", event => {
  if (event.data === "aplicar-atualizacao") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   /* fontes do Google etc.: deixa o navegador cuidar */

  /* páginas: rede primeiro */
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const resposta = preload || await fetch(req);
        const cache = await caches.open(CACHE_PAGINAS);
        cache.put(req, resposta.clone());
        return resposta;
      } catch (e) {
        /* sem rede: a própria página, se estiver guardada; senão, a página offline */
        return (await caches.match(req, { ignoreSearch: true }))
          || (await caches.match("./offline.html"))
          || Response.error();
      }
    })());
    return;
  }

  /* demais arquivos: cache primeiro, atualizando por trás */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_ESTATICO);
    const guardado = await cache.match(req);
    const rede = fetch(req).then(resposta => {
      if (resposta && resposta.status === 200 && resposta.type === "basic") {
        cache.put(req, resposta.clone());
      }
      return resposta;
    }).catch(() => null);
    return guardado || (await rede) || Response.error();
  })());
});
