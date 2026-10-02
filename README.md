# 🛻 ReboqueJá — MVP

**Protótipo académico** que liga condutores com o veículo avariado ou acidentado a
empresas de reboque na **Cidade da Matola, Moçambique**. Experiência estilo
Yango/Uber: mapa em ecrã inteiro, bottom sheet, procura animada, acompanhamento em
tempo real e avaliação final.

> ⚠️ Trabalho de fim de curso — **sem pagamento real**. Todos os dados do seed são
> fictícios.

---

## Stack

- **Next.js 14 (App Router) + TypeScript**
- **Tailwind CSS** (primária `#FFC300`, mobile-first, modo escuro)
- **SQLite + Prisma** (zero configuração — não precisa de instalar PostgreSQL)
- **Autenticação JWT** em cookie HttpOnly (jose + bcryptjs) com papéis
  `CONDUTOR`, `EMPRESA`, `ADMIN` e middleware de protecção de rotas
- **MapLibre GL + tiles OpenStreetMap** (sem chave paga) e **Nominatim** para
  pesquisar endereços
- **Polling de 5 s** nas páginas de acompanhamento
- **Zod** para validação

## Como correr

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o .env (ou copiar .env.example)
#    DATABASE_URL="file:./dev.db"
#    AUTH_SECRET="qualquer-string-secreta"

# 3. Criar a base de dados e gerar o cliente
npx prisma db push

# 4. Dados de exemplo (seed)
npm run db:seed

# 5. Arrancar em desenvolvimento
npm run dev
```

Abra **http://localhost:3000**.

> Para replicar com **PostgreSQL**: mude `provider = "postgresql"` no
> `prisma/schema.prisma`, ajuste o `DATABASE_URL` e corra `npx prisma migrate
> dev --name init`.

## Contas de teste (seed)

| Perfil | Credenciais | Senha |
|---|---|---|
| 🛡️ Admin | `admin@reboqueja.co.mz` | `admin123` |
| 👤 Condutor | `+258 84 111 1111` | `teste123` |
| 👤 Condutor | `+258 84 222 2222` | `teste123` |
| 👤 Condutor | `+258 84 333 3333` | `teste123` |
| 🏢 Empresa (Machava) | `+258 86 500 0001` | `teste123` |
| 🏢 Empresa (Matola Rio) | `+258 86 500 0002` | `teste123` |
| 🏢 Empresa (Liberdade) | `+258 86 500 0003` | `teste123` |
| 🏢 Empresa (T3) | `+258 86 500 0004` | `teste123` |
| 🏢 Empresa pendente (Fomento) | `+258 86 500 0005` | `teste123` |

O seed cria 4 empresas aprovadas (cada uma com 2 camiões e faixas de preço
500–6 500 MT), 1 pendente, 3 condutores com veículos e **10 pedidos históricos**
(7 concluídos com avaliações, 1 a caminho, 1 pendente e 1 cancelado).

## Regras de negócio implementadas

1. **Âmbito geográfico** — pedidos com origem/destino fora do polígono da Matola
   (`src/lib/geo.ts`) são bloqueados no cliente **e** no servidor.
2. **Preços em faixas** — nunca valores fixos; cada empresa define faixas por
   tipo de veículo × intervalo de km (0–5, 5–10, 10–20, 20+).
3. **Consentimento + aprovação** — o nome, contacto e faixas só ficam públicos
   com checkbox de consentimento (data registada) **e** aprovação do admin.
4. **Pagamento simulado** — condutor indica Dinheiro/M-Pesa/e-Mola; a empresa
   confirma o recebimento.
5. **Formatos** — PT de Moçambique, moeda `MT`, telefone `+258 8X XXX XXXX`,
   datas `dd/mm/aaaa`.

## Estrutura

```
src/
  app/
    (publico)/          # landing, entrar, registar, empresas, termos
    app/                # área do condutor (mapa Yango, pedido, histórico…)
    empresa/            # painel, pedidos, camiões, preços, histórico, perfil
    admin/              # dashboard, empresas, pedidos, utilizadores, avaliações
    api/                # rotas REST (auth, pedidos, empresa, admin…)
  components/           # UI base, mapa, bottom sheet, questionário SUS
  lib/                  # prisma, auth JWT, geo, validações Zod, formatos, SUS
  middleware.ts         # protecção /app (CONDUTOR), /empresa (EMPRESA), /admin (ADMIN)
prisma/
  schema.prisma         # 9 modelos
  seed.ts               # dados de exemplo
```

## Lista de verificação (fluxos de ponta a ponta)

### Públicas
- [ ] `/` — landing com como funciona (3 passos) e 2 CTAs
- [ ] `/entrar` — login condutor/empresa/admin (botões de preenchimento rápido)
- [ ] `/registar` — criar conta condutor → cai em `/app`
- [ ] `/registar/empresa` — registo com checkbox de consentimento → `/empresa`
- [ ] `/empresas` — só aprovadas; faixas de preço e ★ média
- [ ] `/termos` — termos, privacidade e nota de protótipo académico

### Condutor
- [ ] `/app` — mapa ecrã inteiro + bottom sheet; pin GPS (ou toque no mapa);
      aviso vermelho se fora da Matola; destino com pesquisa Nominatim; tipo de
      problema/veículo; observações
- [ ] `/app/pedido/novo` — radar animado; cartões com ★, faixa, distância e ETA;
      "Mais próxima automaticamente"; cria pedido
- [ ] `/app/pedido/[id]` — polling 5 s; radar enquanto PENDENTE; após 3 min
      mostra "Tentar de novo" ou cancelar; cartão empresa (📞/💬); timeline com
      ícones; cancelar com confirmação
- [ ] `/app/pedido/[id]/concluir` — 3 métodos de pagamento + ★ comentário
- [ ] `/app/historico` — pedidos com estado/empresa/data/faixa
- [ ] `/app/perfil` — dados e CRUD de veículos
- [ ] `/app/avaliacao-prototipo` — SUS (10) + 3 extras + comentário; SUS 0–100

### Empresa
- [ ] `/empresa` — toggle Disponível/Indisponível; pedidos novos com som e
      destaque; serviços em curso; números do dia
- [ ] `/empresa/pedidos/[id]` — aceitar (com camião/motorista) ou recusar;
      avançar estado; 📍 GPS real; ▶ **simular trajecto** (o camião move-se no
      mapa do condutor!); confirmar recebimento do pagamento
- [ ] `/empresa/camioes` — CRUD completo
- [ ] `/empresa/precos` — CRUD de faixas por tipo × km
- [ ] `/empresa/historico` — concluídos/cancelados + ★ recebidas
- [ ] `/empresa/perfil` — dados, estado de aprovação e consentimento
- [ ] `/empresa/avaliacao-prototipo` — mesmo questionário

### Admin
- [ ] `/admin` — KPIs: pedidos por estado, tempo médio de resposta (PENDENTE→ACEITE), tempo médio até à chegada (ACEITE→NO_LOCAL), ★ média, pedidos por bairro
- [ ] `/admin/empresas` — aprovar/rejeitar/revogar (mostra a data do consentimento; aprovar sem consentimento é bloqueado)
- [ ] `/admin/pedidos` — filtros por estado, empresa e datas
- [ ] `/admin/utilizadores` — activar/desactivar (admin não pode desactivar-se)
- [ ] `/admin/avaliacoes` — SUS médio, médias por pergunta, respostas individuais, **exportação CSV**

### Demonstração sugerida (10 min)
1. Entrar como **condutor** → pedir reboque (se o PC não tiver GPS, toque no
   mapa dentro da Matola).
2. Noutro browser (ou janela anónima), entrar como **empresa** → aceitar o
   pedido → escolher camião → "Simular trajecto" → ver o camião a mover-se no
   ecrã do condutor.
3. Avançar estados até CONCLUÍDO → como condutor, pagar + avaliar.
4. Como **admin**, ver o dashboard e as estatísticas actualizadas.
