# Calcular Adicional Noturno

Site estático em Astro para estimar o adicional noturno no navegador. O projeto não possui banco de dados, API de cálculo, analytics ou armazenamento dos valores digitados.

## Antes de publicar

O domínio ainda não foi informado. Defina `PUBLIC_SITE_URL` com a URL final, sem barra no fim. Enquanto a variável não for configurada, canonical, sitemap e dados estruturados usam `https://example.com`.

Também permanecem pendentes:

- conteúdo final das páginas de políticas;
- dados reais do responsável pelo site;
- um canal de contato e serviço de envio compatível com Cloudflare.

As páginas de políticas têm `noindex, follow` e não entram no sitemap. Remova o `noindex` somente após revisar e publicar o conteúdo de cada uma.

## Desenvolvimento

Requisitos: Node.js 22 e npm.

```bash
npm install
npm run dev
```

Verificações:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

O build estático é gerado em `dist/`.

## Cloudflare

Este repositório usa Wrangler Static Assets, sem Worker de aplicação. O arquivo `wrangler.jsonc` publica somente o diretório `dist/`, força URLs com barra final e usa o `404.html` gerado pelo Astro.

Configuração para o painel:

- Root directory: `/`
- Install command: `npm install` (ou o padrão detectado)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Variável de ambiente: `PUBLIC_SITE_URL=https://seu-dominio.com.br`

Não configure um diretório de saída adicional no comando de deploy: o Wrangler lê `./dist` em `wrangler.jsonc`.

Para verificar a publicação:

1. abra `/`, `/sobre/` e `/contato/`;
2. confira `/robots.txt` e `/sitemap.xml`;
3. teste um endereço inexistente para confirmar a página 404;
4. inspecione o canonical e os JSON-LD no HTML;
5. calcule um cenário em um celular e em um desktop.

## Formulário de contato

O formulário é apenas uma interface e o botão está desativado. Não afirme que há envio até configurar um endpoint real, proteção contra abuso, tratamento de consentimento e dados verdadeiros do responsável.

## Conteúdo futuro

Consulte `CONTENT_STRATEGY.md`. O artigo futuro sobre cálculo manual não deve substituir nem duplicar a intenção transacional da homepage.
