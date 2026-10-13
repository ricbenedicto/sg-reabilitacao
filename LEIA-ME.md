# SG Reabilitação e Bem Estar — site para publicação

Pasta pronta para subir em qualquer hospedagem. Sem build, sem dependências.

```
index.html          página inicial
fisioterapia.html   página de fisioterapia
psicologia.html     página de psicologia
styles.css          estilos (todas as páginas)
app.js              WhatsApp, Instagram e galeria
imagens/            11 fotos em WebP (233 KB no total)
sitemap.xml         mapa do site para o Google
robots.txt          libera a indexação e aponta o sitemap
favicon.svg         ícone da aba do navegador
manifest.webmanifest  identidade do app instalável (nome, cores, atalhos)
sw.js               service worker: guarda o site para abrir offline
offline.html        página mostrada quando não há conexão
icones/             ícones do app (192, 512, maskable e Apple)
.htaccess           cache, compressão, HTTPS e tipos do PWA (Apache)
```

### O site é um PWA

Depois de publicado **em HTTPS**, o site pode ser instalado na tela inicial do
celular e abre sem a barra do navegador. Também funciona sem conexão: as páginas
já visitadas abrem do cache e, numa página nunca aberta, aparece `offline.html`
com endereço, telefones e horário.

Importante: **o service worker só funciona em HTTPS** (ou em localhost). Abrindo
os arquivos direto do computador, com dois cliques, nada disso liga — e o site
continua funcionando normalmente, só sem o modo offline.

**Ao publicar qualquer alteração**, abra `sw.js` e troque o número em
`const VERSAO = "sg-v1"` para `"sg-v2"`, `"sg-v3"` e assim por diante. Sem isso,
quem já visitou o site pode continuar vendo a versão antiga. Quando a versão
muda, quem está no site recebe um aviso discreto com o botão "Atualizar".

---

## 1. Antes de publicar: trocar o domínio

O pacote usa um domínio de exemplo: `https://ricbenedicto.github.io/sg-reabilitacao`

Faça **localizar e substituir** por todo o domínio real nestes arquivos:
`index.html`, `fisioterapia.html`, `psicologia.html`, `sitemap.xml`, `robots.txt`.

O domínio aparece em: `<link rel="canonical">`, nas tags `og:`, no sitemap e nos dados
estruturados (schema). Se ficar o endereço errado, o Google indexa o endereço errado.

**Sugestões de domínio:** `sgreabilitacao.com.br`, `sgbemestar.com.br`,
`clinicasgreabilitacao.com.br`. Registro no Registro.br custa cerca de R$ 40 por ano.

## 2. Publicar

Qualquer uma destas opções funciona:

- **Hospedagem comum (Hostinger, Locaweb, KingHost):** subir a pasta inteira via FTP ou
  gerenciador de arquivos, dentro de `public_html`. Ativar o certificado SSL gratuito no painel.
- **Vercel ou Netlify (grátis):** arrastar a pasta na interface. HTTPS já vem ativo.
  Nesse caso o `.htaccess` é ignorado — não faz mal.

## 3. Depois de publicar (é aqui que o SEO acontece)

1. **Google Search Console** — adicionar a propriedade do domínio, verificar, enviar
   `sitemap.xml` e pedir indexação das três páginas.
2. **Google Meu Negócio** — colocar o site no perfil, conferir categorias
   (principal: Fisioterapeuta; secundárias: Psicólogo, Clínica de reabilitação),
   cadastrar os serviços e o horário, e publicar fotos novas com frequência.
3. **Instagram** — colocar o link do site na bio dos três perfis.
4. **Avaliações** — pedir avaliação a cada paciente atendido. Sair de 12 para 40 avaliações
   muda mais a posição no mapa do que qualquer ajuste no site.

---

## 4. O que ainda precisa ser preenchido

Procure por `[` no código ou pelos trechos com borda tracejada no site. São estes:

| Onde | O que falta |
|---|---|
| `fisioterapia.html` | registro profissional (CREFITO) da Dra. Sthephany Barros |
| `fisioterapia.html` | descrição de **Pilates no solo** |
| `fisioterapia.html` | descrição de **Quiropraxia** |
| `fisioterapia.html` | resposta sobre convênio |
| `psicologia.html` | registro profissional (CRP) de Graziela Dias |
| `psicologia.html` | resposta sobre atendimento online |
| todas | imagem de compartilhamento (`og:image`) — hoje usa a foto da fachada |

Colocar os registros profissionais ajuda na confiança e no SEO de saúde.

## 5. Editar depois

- **Trocar uma foto:** substituir o arquivo em `imagens/` mantendo o mesmo nome,
  ou trocar o `src` no HTML. Sempre conferir `width` e `height` da tag `<img>`.
- **WhatsApp e Instagram:** o objeto `CONFIG` no topo do `app.js`.
- **Horários:** aparecem em três lugares — no bloco de contato de cada página, nas
  perguntas frequentes e no schema (`openingHoursSpecification`, dentro do `index.html`).
  Hoje estão como: segunda a sexta, 8h às 13h; sábado, 8h às 17h; domingo fechado.

## 6. Detalhes técnicos já implementados

- Imagens em WebP servidas como arquivos separados, com `width`/`height` (evita salto de
  layout), `loading="lazy"` abaixo da dobra e `fetchpriority="high"` + `preload` na foto
  de topo, que é o elemento de maior impacto no tempo de carregamento.
- CSS e JS externos, com `defer` no script — o navegador reaproveita entre as páginas.
- Uma página por serviço, com `<h1>` próprio, título, descrição e URL próprios.
- Dados estruturados: `MedicalClinic` com endereço, telefones, horários, serviços e nota,
  `BreadcrumbList` e `FAQPage` nas páginas internas.
- HTML semântico, textos alternativos em todas as imagens, navegação por teclado,
  foco visível e contraste conferido.
