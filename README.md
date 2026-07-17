# Calcular Adicional Noturno

Site em Astro para estimar o adicional noturno no navegador. O projeto não possui banco de dados nem armazenamento dos valores digitados. A audiência geral das páginas é medida pelo Google Analytics 4, propriedade `G-GFSN15TNEC`.

## Domínio e contato

O domínio padrão é `https://calculoadicionalnoturno.com`. Se o endereço final for diferente, defina `PUBLIC_SITE_URL` com a URL completa, sem barra no fim.

O formulário de contato e a newsletter enviam notificações para `contato@calculoadicionalnoturno.com` por meio da API do Resend. Antes de publicar:

1. valide `calculoadicionalnoturno.com` no Resend;
2. crie uma chave de API;
3. cadastre os segredos no projeto Cloudflare:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_FROM_EMAIL
```

Em `CONTACT_FROM_EMAIL`, use um remetente do domínio validado, por exemplo `Adicional Noturno <formularios@calculoadicionalnoturno.com>`. Nunca coloque a chave do Resend em arquivos versionados ou em variáveis públicas.

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

Este repositório usa um Cloudflare Worker leve para os formulários e Wrangler Static Assets para o site. O arquivo `wrangler.jsonc` publica `dist/`, envia somente `/api/*` ao Worker, força URLs com barra final e usa o `404.html` gerado pelo Astro.

Configuração para o painel:

- Root directory: `/`
- Install command: `npm install` (ou o padrão detectado)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Variável de build opcional: `PUBLIC_SITE_URL=https://calculoadicionalnoturno.com`
- Segredos do Worker: `RESEND_API_KEY` e `CONTACT_FROM_EMAIL`

Não configure um diretório de saída adicional no comando de deploy: o Wrangler lê `./dist` em `wrangler.jsonc`.

Para verificar a publicação:

1. abra `/`, `/sobre/` e `/contato/`;
2. confira `/robots.txt` e `/sitemap.xml`;
3. teste um endereço inexistente para confirmar a página 404;
4. inspecione o canonical e os JSON-LD no HTML;
5. envie uma mensagem de teste e uma inscrição de newsletter;
6. calcule um cenário em um celular e em um desktop.

## Formulários

Os endpoints `/api/contact` e `/api/newsletter` validam e limitam os campos, usam um campo-isca contra preenchimento automatizado e não expõem credenciais no navegador. Se os segredos ainda não estiverem configurados, retornam uma mensagem segura em vez de simular sucesso.

## Conteúdo futuro

Consulte `CONTENT_STRATEGY.md`. O artigo futuro sobre cálculo manual não deve substituir nem duplicar a intenção transacional da homepage.
