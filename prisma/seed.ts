import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BAIRROS: Record<string, { lat: number; lng: number; endereco: string }> = {
  Machava: { lat: -25.955, lng: 32.46, endereco: "Av. das FPLM, Machava, Matola" },
  "Matola Rio": { lat: -25.99, lng: 32.47, endereco: "Bairro Matola Rio, Matola" },
  Liberdade: { lat: -25.97, lng: 32.49, endereco: "Bairro Liberdade, Matola" },
  T3: { lat: -25.965, lng: 32.44, endereco: "Bairro T3, Matola" },
  Fomento: { lat: -25.95, lng: 32.48, endereco: "Bairro Fomento, Matola" },
  "Matola Gare": { lat: -26.01, lng: 32.46, endereco: "Bairro Matola Gare, Matola" },
};

async function main() {
  console.log("🌱 A semear a base de dados do ReboqueJá…");

  // Limpeza (ordem importante pelas FKs)
  await prisma.avaliacao.deleteMany();
  await prisma.pedidoEvento.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.faixaPreco.deleteMany();
  await prisma.camiao.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.respostaPrototipo.deleteMany();
  await prisma.utilizador.deleteMany();

  const senha = await bcrypt.hash("teste123", 10);

  // ---------- Admin ----------
  await prisma.utilizador.create({
    data: {
      nome: "Administrador ReboqueJá",
      telefone: "+258870000000",
      email: "admin@reboqueja.co.mz",
      senhaHash: await bcrypt.hash("admin123", 10),
      papel: "ADMIN",
    },
  });

  // ---------- Condutores ----------
  const condutores = await Promise.all(
    [
      { nome: "João Macuácua", telefone: "+258841111111", email: "joao@teste.mz" },
      { nome: "Ana Sitoe", telefone: "+258842222222", email: "ana@teste.mz" },
      { nome: "Carlos Chissano", telefone: "+258843333333", email: "carlos@teste.mz" },
    ].map((c) =>
      prisma.utilizador.create({
        data: {
          nome: c.nome,
          telefone: c.telefone,
          email: c.email,
          senhaHash: senha,
          papel: "CONDUTOR",
          veiculos: {
            create: [
              {
                marca: ["Toyota", "Toyota", "Suzuki"][0],
                modelo: "Corolla",
                matricula: "ABM-123-MC",
                tipo: "LIGEIRO",
              },
              { marca: "Toyota", modelo: "Hilux", matricula: "GHN-456-MC", tipo: "SUV" },
            ],
          },
        },
      })
    )
  );
  // Distribui os veículos: cada condutor 1–2 veículos
  await prisma.veiculo.create({
    data: { condutorId: condutores[0].id, marca: "Nissan", modelo: "NP200", matricula: "KLM-789-MC", tipo: "SUV" },
  });

  // ---------- Empresas ----------
  type DefEmpresa = {
    nome: string; nuit: string; telefone: string; email: string;
    bairro: keyof typeof BAIRROS; aprovada: boolean; disponivel: boolean;
    camioes: { matricula: string; tipo: string; motorista: string; tel: string }[];
    faixas: Record<string, [number, number][]>;
  };

  const empresasDef: DefEmpresa[] = [
    {
      nome: "Reboque Machava Lda",
      nuit: "400123456",
      telefone: "+258865000001",
      email: "machava@reboqueja.co.mz",
      bairro: "Machava",
      aprovada: true,
      disponivel: true,
      camioes: [
        { matricula: "RBM-001-MC", tipo: "PESADO", motorista: "Alberto Nhaca", tel: "+258875000001" },
        { matricula: "RBM-002-MC", tipo: "LIGEIRO", motorista: "Ernesto Cuna", tel: "+258875000002" },
      ],
      faixas: {
        LIGEIRO: [[500, 1000], [1000, 2000], [2000, 3000], [3500, 5000]],
        SUV: [[700, 1200], [1200, 2500], [2500, 4000], [4000, 5000]],
        MINIBUS: [[1000, 1800], [1800, 3000], [3000, 4500], [4500, 5000]],
        PESADO: [[1500, 2500], [2500, 3500], [3500, 5000], [5000, 6000]],
      },
    },
    {
      nome: "Matola Rio Assistência",
      nuit: "400234567",
      telefone: "+258865000002",
      email: "riomz@reboqueja.co.mz",
      bairro: "Matola Rio",
      aprovada: true,
      disponivel: true,
      camioes: [
        { matricula: "MRA-010-MC", tipo: "LIGEIRO", motorista: "Domingos Chirindza", tel: "+258875000003" },
        { matricula: "MRA-011-MC", tipo: "PESADO", motorista: "Salomão Mabjaia", tel: "+258875000004" },
      ],
      faixas: {
        LIGEIRO: [[600, 1100], [1100, 2200], [2200, 3200], [3200, 4800]],
        SUV: [[800, 1400], [1400, 2600], [2600, 4200], [4200, 5500]],
        MINIBUS: [[1100, 2000], [2000, 3200], [3200, 4800], [4800, 6000]],
        PESADO: [[1600, 2600], [2600, 3800], [3800, 5200], [5200, 6500]],
      },
    },
    {
      nome: "Socorro Rápido Liberdade",
      nuit: "400345678",
      telefone: "+258865000003",
      email: "liberdade@reboqueja.co.mz",
      bairro: "Liberdade",
      aprovada: true,
      disponivel: true,
      camioes: [
        { matricula: "SRL-020-MC", tipo: "LIGEIRO", motorista: "Tomás Bila", tel: "+258875000005" },
        { matricula: "SRL-021-MC", tipo: "MINIBUS", motorista: "Nelson Macassa", tel: "+258875000006" },
      ],
      faixas: {
        LIGEIRO: [[500, 950], [950, 1900], [1900, 2900], [2900, 4500]],
        SUV: [[700, 1300], [1300, 2400], [2400, 3800], [3800, 5000]],
        MINIBUS: [[950, 1700], [1700, 2900], [2900, 4300], [4300, 5500]],
        PESADO: [[1400, 2400], [2400, 3400], [3400, 4800], [4800, 6000]],
      },
    },
    {
      nome: "T3 Reboques & Socorro",
      nuit: "400456789",
      telefone: "+258865000004",
      email: "t3@reboqueja.co.mz",
      bairro: "T3",
      aprovada: true,
      disponivel: true,
      camioes: [
        { matricula: "T3R-030-MC", tipo: "LIGEIRO", motorista: "Paulo Muianga", tel: "+258875000007" },
        { matricula: "T3R-031-MC", tipo: "SUV", motorista: "Rogério Tembe", tel: "+258875000008" },
      ],
      faixas: {
        LIGEIRO: [[550, 1050], [1050, 2100], [2100, 3100], [3100, 4700]],
        SUV: [[750, 1350], [1350, 2500], [2500, 3900], [3900, 5200]],
        MINIBUS: [[1000, 1900], [1900, 3100], [3100, 4600], [4600, 5800]],
        PESADO: [[1500, 2500], [2500, 3600], [3600, 5000], [5000, 6200]],
      },
    },
    {
      nome: "Reboque Fomento (aguardando aprovação)",
      nuit: "400567890",
      telefone: "+258865000005",
      email: "fomento@reboqueja.co.mz",
      bairro: "Fomento",
      aprovada: false,
      disponivel: false,
      camioes: [
        { matricula: "RFA-040-MC", tipo: "LIGEIRO", motorista: "Hélder Zandamela", tel: "+258875000009" },
      ],
      faixas: {
        LIGEIRO: [[500, 1000], [1000, 2000], [2000, 3000], [3000, 4500]],
      },
    },
  ];

  const empresasCriadas: { id: string; nome: string; faixas: Record<string, [number, number][]> }[] = [];
  const diasAtras = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000);

  for (const def of empresasDef) {
    const b = BAIRROS[def.bairro];
    const utilizador = await prisma.utilizador.create({
      data: {
        nome: def.nome,
        telefone: def.telefone,
        email: def.email,
        senhaHash: senha,
        papel: "EMPRESA",
        empresa: {
          create: {
            nome: def.nome,
            nuit: def.nuit,
            telefone: def.telefone,
            email: def.email,
            endereco: b.endereco,
            lat: b.lat,
            lng: b.lng,
            raioKm: 15,
            disponivel: def.disponivel,
            estadoAprovacao: def.aprovada ? "APROVADA" : "PENDENTE",
            consentimentoEm: diasAtras(30),
          },
        },
      },
    });

    const empresa = (await prisma.empresa.findUnique({
      where: { utilizadorId: utilizador.id },
    }))!;

    // Camiões
    for (const c of def.camioes) {
      await prisma.camiao.create({
        data: {
          empresaId: empresa.id,
          matricula: c.matricula,
          tipo: c.tipo,
          capacidade: c.tipo === "PESADO" ? "Até 5 t" : "Até 2 t",
          motoristaNome: c.motorista,
          motoristaTelefone: c.tel,
          activo: true,
          lat: b.lat + (Math.random() - 0.5) * 0.03,
          lng: b.lng + (Math.random() - 0.5) * 0.03,
        },
      });
    }

    // Faixas de preço
    const faixas: Record<string, [number, number][]> = {};
    for (const [tipo, intervalos] of Object.entries(def.faixas)) {
      faixas[tipo] = [];
      const kms: [number, number][] = [
        [0, 5], [5, 10], [10, 20], [20, 9999],
      ];
      for (let i = 0; i < intervalos.length; i++) {
        const [pMin, pMax] = intervalos[i];
        const [kmMin, kmMax] = kms[i];
        await prisma.faixaPreco.create({
          data: {
            empresaId: empresa.id,
            tipoVeiculo: tipo,
            kmMin,
            kmMax,
            precoMin: pMin,
            precoMax: pMax,
          },
        });
        faixas[tipo].push([pMin, pMax]);
      }
    }

    empresasCriadas.push({ id: empresa.id, nome: def.nome, faixas });
  }

  // ---------- Pedidos históricos (10) ----------
  const pontosMatola: { lat: number; lng: number; endereco: string }[] = [
    { lat: -25.958, lng: 32.457, endereco: "Av. Samora Machel, Machava, Matola" },
    { lat: -25.992, lng: 32.471, endereco: "Rua da Namaacha, Matola Rio, Matola" },
    { lat: -25.968, lng: 32.492, endereco: "Bairro Liberdade, Matola" },
    { lat: -25.963, lng: 32.442, endereco: "Bairro T3, Matola" },
    { lat: -25.951, lng: 32.481, endereco: "Bairro Fomento, Matola" },
    { lat: -26.008, lng: 32.459, endereco: "Matola Gare, Matola" },
    { lat: -25.941, lng: 32.502, endereco: "Infulene, Matola" },
    { lat: -25.972, lng: 32.465, endereco: "Av. das FPLM, Matola" },
    { lat: -25.947, lng: 32.444, endereco: "Zimpeto, Matola" },
    { lat: -25.983, lng: 32.438, endereco: "Marrote, Matola" },
  ];

  const destinos: { lat: number; lng: number; endereco: string }[] = [
    { lat: -25.9655, lng: 32.4523, endereco: "Oficina Auto Geral, Machava, Matola" },
    { lat: -25.962, lng: 32.459, endereco: "Casa do condutor, Matola" },
    { lat: -25.9905, lng: 32.4712, endereco: "Oficina Central Matola Rio" },
    { lat: -25.9598, lng: 32.4789, endereco: "Posto de socorro FPLM" },
  ];

  const problemas = ["AVARIA_MECANICA", "ACIDENTE", "PNEU_FURADO", "SEM_COMBUSTIVEL", "BATERIA", "OUTRO"] as const;
  const tiposVeiculo = ["LIGEIRO", "SUV", "MINIBUS", "PESADO"] as const;
  const pagamentos = ["DINHEIRO", "MPESA", "EMOLA"] as const;

  // Script de cenários
  type Cenario = {
    estado: string; haDias: number; estrelas: number | null;
    comentario: string | null; empresa: number | null; minAtras?: number;
  };

  const cenarios: Cenario[] = [
    { estado: "CONCLUIDO", haDias: 9, estrelas: 5, comentario: "Chegaram em 15 minutos! Excelente serviço.", empresa: 0 },
    { estado: "CONCLUIDO", haDias: 8, estrelas: 4, comentario: "Bom atendimento, preço justo.", empresa: 1 },
    { estado: "CONCLUIDO", haDias: 6, estrelas: 5, comentario: "O motorista foi muito profissional.", empresa: 2 },
    { estado: "CONCLUIDO", haDias: 5, estrelas: 3, comentario: "Demorou um pouco, mas resolveu.", empresa: 0 },
    { estado: "CONCLUIDO", haDias: 4, estrelas: 4, comentario: null, empresa: 3 },
    { estado: "CONCLUIDO", haDias: 3, estrelas: 5, comentario: "Muito rápido e preço dentro da faixa.", empresa: 1 },
    { estado: "CONCLUIDO", haDias: 2, estrelas: 4, comentario: null, empresa: 2 },
    { estado: "A_CAMINHO", haDias: 0, estrelas: null, comentario: null, empresa: 0, minAtras: 20 },
    { estado: "PENDENTE", haDias: 0, estrelas: null, comentario: null, empresa: null, minAtras: 1 },
    { estado: "CANCELADO", haDias: 1, estrelas: null, comentario: null, empresa: null },
  ] as const;

  const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  for (let i = 0; i < cenarios.length; i++) {
    const c = cenarios[i];
    const condutor = condutores[i % condutores.length];
    const origem = pontosMatola[i];
    const destino = destinos[i % destinos.length];
    const distancia = haversine(origem, destino);
    const tipoVeiculo = tiposVeiculo[i % 4];
    const criadoEm = new Date(
      Date.now() - (c.haDias || 0) * 24 * 3600 * 1000 - (c.minAtras || 0) * 60 * 1000
    );

    const empresaId = c.empresa !== null ? empresasCriadas[c.empresa].id : null;
    const faixasEmp = c.empresa !== null ? empresasCriadas[c.empresa].faixas[tipoVeiculo] : null;
    const intervalo =
      faixasEmp?.find((_, idx) => {
        const kms: [number, number][] = [[0, 5], [5, 10], [10, 20], [20, 9999]];
        return distancia >= kms[idx][0] && distancia <= kms[idx][1];
      }) || [500, 2000] as [number, number];

    const camiao =
      c.empresa !== null
        ? await prisma.camiao.findFirst({ where: { empresaId: empresasCriadas[c.empresa].id } })
        : null;

    const eventos: { estado: string; nota?: string; minutosDepois: number }[] = [
      { estado: "PENDENTE", nota: "Pedido criado", minutosDepois: 0 },
    ];
    if (c.estado !== "PENDENTE" && c.estado !== "CANCELADO") {
      eventos.push({ estado: "ACEITE", minutosDepois: 2 });
      if (["A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "A_CAMINHO", minutosDepois: 4 });
      }
      if (["NO_LOCAL", "EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "NO_LOCAL", minutosDepois: 12 });
      }
      if (["EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "EM_TRANSPORTE", minutosDepois: 20 });
      }
      if (c.estado === "CONCLUIDO") {
        eventos.push({ estado: "CONCLUIDO", minutosDepois: 35 });
      }
    }
    if (c.estado === "CANCELADO") {
      eventos.push({ estado: "CANCELADO", nota: "Cancelado pelo condutor", minutosDepois: 5 });
    }

    const pedido = await prisma.pedido.create({
      data: {
        condutorId: condutor.id,
        empresaId,
        camiaoId: camiao?.id || null,
        veiculoId: null,
        origemLat: origem.lat,
        origemLng: origem.lng,
        origemEndereco: origem.endereco,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        destinoEndereco: destino.endereco,
        distanciaKm: Math.round(distancia * 10) / 10,
        tipoProblema: problemas[i % problemas.length],
        tipoVeiculo,
        observacoes: i % 3 === 0 ? "Veículo bloqueado na berma direita." : null,
        estado: c.estado,
        precoMin: intervalo[0],
        precoMax: intervalo[1],
        metodoPagamento: c.estado === "CONCLUIDO" ? pagamentos[i % 3] : null,
        pagamentoConfirmado: c.estado === "CONCLUIDO" && i % 2 === 0,
        criadoEm,
        actualizadoEm: new Date(criadoEm.getTime() + 40 * 60 * 1000),
      },
    });

    for (const ev of eventos) {
      await prisma.pedidoEvento.create({
        data: {
          pedidoId: pedido.id,
          estado: ev.estado,
          nota: ev.nota,
          criadoEm: new Date(criadoEm.getTime() + ev.minutosDepois * 60 * 1000),
        },
      });
    }

    if (c.estrelas) {
      await prisma.avaliacao.create({
        data: {
          pedidoId: pedido.id,
          estrelas: c.estrelas,
          comentario: c.comentario,
        },
      });
    }
  }

  // ---------- Respostas ao protótipo de exemplo ----------
  await prisma.respostaPrototipo.create({
    data: {
      utilizadorId: condutores[0].id,
      papel: "CONDUTOR",
      respostas: JSON.stringify({
        sus: [5, 1, 5, 1, 4, 2, 5, 1, 4, 1],
        extras: [5, 5, 5],
        comentario: "Interface simples, parece o Yango. Gostei da faixa de preço.",
      }),
      susScore: 90,
      comentario: "Interface simples, parece o Yango. Gostei da faixa de preço.",
    },
  });

  console.log("✅ Seed concluído!");
  console.log("   Admin: admin@reboqueja.co.mz / admin123");
  console.log("   Condutores: +258841111111 / +258842222222 / +258843333333 (senha: teste123)");
  console.log("   Empresas: +258865000001…005 (senha: teste123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
