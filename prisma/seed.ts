import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BAIRROS: Record<string, { lat: number; lng: number; endereco: string }> = {
  Machava: { lat: -25.955, lng: 32.46, endereco: "Av. das FPLM, Machava, Matola" },
  "Matola Rio": { lat: -25.99, lng: 32.47, endereco: "Bairro Matola Rio, Matola" },
  Liberdade: { lat: -25.97, lng: 32.49, endereco: "Bairro Liberdade, Matola" },
  T3: { lat: -25.965, lng: 32.44, endereco: "Bairro T3, Matola" },
  Fomento: { lat: -25.95, lng: 32.48, endereco: "Bairro Fomento, Matola" },
};

async function main() {
  console.log("🌱 A semear a base de dados do ReboqueJá…");

  // Limpeza (ordem importante pelas FKs)
  await prisma.avaliacao.deleteMany();
  await prisma.pedidoEvento.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.atribuicaoCamiao.deleteMany();
  await prisma.faixaPreco.deleteMany();
  await prisma.camiao.deleteMany();
  await prisma.empresa.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.respostaPrototipo.deleteMany();
  await prisma.utilizador.deleteMany();

  const senha = await bcrypt.hash("teste123", 10);
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const agora = Date.now();
  const diasAtras = (n: number) => new Date(agora - n * 24 * 3600 * 1000);

  // ---------- Admin ----------
  const admin = await prisma.utilizador.create({
    data: {
      nome: "Administrador ReboqueJá",
      telefone: "+258870000000",
      email: "admin@reboqueja.co.mz",
      senhaHash: senhaAdmin,
      papel: "ADMIN",
      criadoEm: diasAtras(45),
    },
  });

  // ---------- Clientes e seus veículos ----------
  const clientesDef = [
    {
      nome: "João Macuácua",
      telefone: "+258841111111",
      email: "joao@teste.mz",
      veiculos: [
        { marca: "Toyota", modelo: "Corolla", matricula: "ABM-123-MC", tipo: "LIGEIRO" },
        { marca: "Nissan", modelo: "NP200", matricula: "KLM-789-MC", tipo: "SUV" },
      ],
    },
    {
      nome: "Ana Sitoe",
      telefone: "+258842222222",
      email: "ana@teste.mz",
      veiculos: [
        { marca: "Toyota", modelo: "Hilux", matricula: "GHN-456-MC", tipo: "SUV" },
        { marca: "Suzuki", modelo: "Swift", matricula: "MPT-214-MC", tipo: "LIGEIRO" },
      ],
    },
    {
      nome: "Carlos Chissano",
      telefone: "+258843333333",
      email: "carlos@teste.mz",
      veiculos: [
        { marca: "Mitsubishi", modelo: "Pajero", matricula: "ACX-809-MC", tipo: "MINIBUS" },
      ],
    },
  ];

  const condutores: { id: string; veiculos: { id: string; tipo: string }[] }[] = [];
  for (let idx = 0; idx < clientesDef.length; idx++) {
    const c = clientesDef[idx];
    const criado = await prisma.utilizador.create({
      data: {
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        senhaHash: senha,
        papel: "CLIENTE",
        criadoEm: diasAtras(25 - idx),
        veiculos: {
          create: c.veiculos,
        },
      },
      include: { veiculos: true },
    });
    condutores.push({
      id: criado.id,
      veiculos: criado.veiculos.map((v) => ({ id: v.id, tipo: v.tipo })),
    });
  }

  // ---------- Empresas ----------
  type DefCamiao = {
    matricula: string;
    marca: string;
    modelo: string;
    tipo: string;
    motorista: string;
    tel: string;
    email: string;
    disponivel: boolean;
    lat?: number;
    lng?: number;
    semCondutor?: boolean;
  };

  type DefEmpresa = {
    nome: string;
    nuit: string;
    telefone: string;
    email: string;
    bairro: keyof typeof BAIRROS;
    aprovada: boolean;
    disponivel: boolean;
    camioes: DefCamiao[];
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
        {
          matricula: "RBM-001-MC",
          marca: "Volvo",
          modelo: "FH 460",
          tipo: "PESADO",
          motorista: "Alberto Nhaca",
          tel: "+258875000001",
          email: "alberto.nhaca@reboqueja.co.mz",
          disponivel: true,
          lat: -25.955,
          lng: 32.46,
        },
        {
          matricula: "RBM-002-MC",
          marca: "Isuzu",
          modelo: "NQR 500",
          tipo: "LIGEIRO",
          motorista: "Ernesto Cuna",
          tel: "+258875000002",
          email: "ernesto.cuna@reboqueja.co.mz",
          disponivel: true,
          lat: -25.959,
          lng: 32.463,
        },
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
        {
          matricula: "MRA-010-MC",
          marca: "Toyota",
          modelo: "Dyna 200",
          tipo: "LIGEIRO",
          motorista: "Domingos Chirindza",
          tel: "+258875000003",
          email: "domingos.chirindza@reboqueja.co.mz",
          disponivel: true,
          lat: -25.984,
          lng: 32.468,
        },
        {
          matricula: "MRA-011-MC",
          marca: "Scania",
          modelo: "P310",
          tipo: "PESADO",
          motorista: "Salomão Mabjaia",
          tel: "+258875000004",
          email: "salomao.mabjaia@reboqueja.co.mz",
          disponivel: true,
          lat: -25.978,
          lng: 32.472,
        },
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
        {
          matricula: "SRL-020-MC",
          marca: "Mitsubishi",
          modelo: "Canter FE85",
          tipo: "LIGEIRO",
          motorista: "Tomás Bila",
          tel: "+258875000005",
          email: "tomas.bila@reboqueja.co.mz",
          disponivel: true,
          lat: -25.967,
          lng: 32.482,
        },
        {
          matricula: "SRL-021-MC",
          marca: "Mercedes-Benz",
          modelo: "Atego 1218",
          tipo: "MINIBUS",
          motorista: "Nelson Macassa",
          tel: "+258875000006",
          email: "nelson.macassa@reboqueja.co.mz",
          disponivel: false,
        },
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
        {
          matricula: "T3R-030-MC",
          marca: "Hino",
          modelo: "300 Series",
          tipo: "LIGEIRO",
          motorista: "Paulo Muianga",
          tel: "+258875000007",
          email: "paulo.muianga@reboqueja.co.mz",
          disponivel: true,
          lat: -25.963,
          lng: 32.444,
        },
        {
          matricula: "T3R-031-MC",
          marca: "Ford",
          modelo: "Cargo 816",
          tipo: "SUV",
          motorista: "Rogério Tembe",
          tel: "+258875000008",
          email: "rogerio.tembe@reboqueja.co.mz",
          disponivel: false,
          semCondutor: true,
        },
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
        {
          matricula: "RFA-040-MC",
          marca: "Hyundai",
          modelo: "HD65",
          tipo: "LIGEIRO",
          motorista: "Hélder Zandamela",
          tel: "+258875000009",
          email: "helder.zandamela@reboqueja.co.mz",
          disponivel: false,
        },
      ],
      faixas: {
        LIGEIRO: [[500, 1000], [1000, 2000], [2000, 3000], [3000, 4500]],
      },
    },
  ];

  const empresasCriadas: { id: string; nome: string; faixas: Record<string, [number, number][]> }[] = [];
  const camiaoPorMatricula = new Map<string, { id: string; empresaId: string }>();

  for (let idx = 0; idx < empresasDef.length; idx++) {
    const def = empresasDef[idx];
    const b = BAIRROS[def.bairro];
    const utilizador = await prisma.utilizador.create({
      data: {
        nome: def.nome,
        telefone: def.telefone,
        email: def.email,
        senhaHash: senha,
        papel: "EMPRESA",
        criadoEm: diasAtras(35 - idx),
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

    // Camiões + condutores + histórico de atribuições
    for (let ci = 0; ci < def.camioes.length; ci++) {
      const c = def.camioes[ci];
      const condUser = await prisma.utilizador.create({
        data: {
          nome: c.motorista,
          telefone: c.tel,
          email: c.email,
          senhaHash: senha,
          papel: "CONDUTOR",
          empresaCondutorId: empresa.id,
          criadoEm: diasAtras(22 - ci),
        },
      });

      const temGps = Boolean(c.disponivel && c.lat !== undefined && c.lng !== undefined);
      const camCriado = await prisma.camiao.create({
        data: {
          empresaId: empresa.id,
          motoristaId: c.semCondutor ? null : condUser.id,
          matricula: c.matricula,
          marca: c.marca,
          modelo: c.modelo,
          tipo: c.tipo,
          capacidade: c.tipo === "PESADO" ? "Até 5 t" : "Até 2 t",
          motoristaNome: c.semCondutor ? "" : c.motorista,
          motoristaTelefone: c.semCondutor ? "" : c.tel,
          activo: true,
          lat: temGps ? c.lat! : 0,
          lng: temGps ? c.lng! : 0,
          disponivel: temGps,
          partilhaLocalizacao: temGps,
          localizacaoActualizadaEm: temGps ? new Date(agora - 15_000) : null,
        },
      });
      camiaoPorMatricula.set(c.matricula, { id: camCriado.id, empresaId: empresa.id });

      await prisma.atribuicaoCamiao.create({
        data: {
          camiaoId: camCriado.id,
          motoristaId: condUser.id,
          atribuidoPorId: c.semCondutor ? utilizador.id : admin.id,
          inicioEm: diasAtras(c.semCondutor ? 18 : 20),
          fimEm: c.semCondutor ? diasAtras(3) : null,
          motivo: c.semCondutor
            ? "Fim de turno — veículo aguarda nova escala"
            : "Associação inicial da frota",
        },
      });
    }

    // Faixas de preço
    const faixas: Record<string, [number, number][]> = {};
    const kms: [number, number][] = [[0, 5], [5, 10], [10, 20], [20, 9999]];
    for (const [tipo, intervalos] of Object.entries(def.faixas)) {
      faixas[tipo] = [];
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

  // Condutores livres para associação imediata
  await prisma.utilizador.createMany({
    data: [
      {
        nome: "Mateus Mondlane",
        telefone: "+258875000010",
        email: "mateus.mondlane@reboqueja.co.mz",
        senhaHash: senha,
        papel: "CONDUTOR",
        empresaCondutorId: empresasCriadas[0].id,
        criadoEm: diasAtras(12),
      },
      {
        nome: "Sérgio Guambe",
        telefone: "+258875000011",
        email: "sergio.guambe@reboqueja.co.mz",
        senhaHash: senha,
        papel: "CONDUTOR",
        empresaCondutorId: empresasCriadas[1].id,
        criadoEm: diasAtras(12),
      },
    ],
  });

  // ---------- Pedidos interligados (13) ----------
  const pontosMatola = [
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
    { lat: -25.956, lng: 32.461, endereco: "Rotunda da Machava, Matola" },
    { lat: -25.961, lng: 32.458, endereco: "Av. das Indústrias, Machava, Matola" },
  ];

  const destinos = [
    { lat: -25.9655, lng: 32.4523, endereco: "Oficina Auto Geral, Machava, Matola" },
    { lat: -25.962, lng: 32.459, endereco: "Casa do condutor, Matola" },
    { lat: -25.9905, lng: 32.4712, endereco: "Oficina Central Matola Rio" },
    { lat: -25.9598, lng: 32.4789, endereco: "Posto de socorro FPLM" },
  ];

  const problemas = ["AVARIA_MECANICA", "ACIDENTE", "PNEU_FURADO", "SEM_COMBUSTIVEL", "BATERIA", "OUTRO"];
  const tiposVeiculo = ["LIGEIRO", "SUV", "MINIBUS", "PESADO"];
  const pagamentos = ["DINHEIRO", "MPESA", "EMOLA"];

  const cenarios: {
    estado: string;
    haDias: number;
    minAtras?: number;
    estrelas: number | null;
    comentario: string | null;
    empresa: number | null;
    camiaoMatricula: string | null;
    clienteIdx: number;
  }[] = [
    { estado: "CONCLUIDO", haDias: 6, estrelas: 5, comentario: "Chegaram em 15 minutos! Excelente serviço.", empresa: 0, camiaoMatricula: "RBM-001-MC", clienteIdx: 0 },
    { estado: "CONCLUIDO", haDias: 5, estrelas: 4, comentario: "Bom atendimento, preço justo.", empresa: 1, camiaoMatricula: "MRA-010-MC", clienteIdx: 1 },
    { estado: "CONCLUIDO", haDias: 4, estrelas: 5, comentario: "O motorista foi muito profissional.", empresa: 2, camiaoMatricula: "SRL-020-MC", clienteIdx: 0 },
    { estado: "CONCLUIDO", haDias: 3, estrelas: 4, comentario: "Atendimento atencioso na via principal.", empresa: 0, camiaoMatricula: "RBM-002-MC", clienteIdx: 2 },
    { estado: "CONCLUIDO", haDias: 3, estrelas: 4, comentario: "Muito rápido dentro da faixa de T3.", empresa: 3, camiaoMatricula: "T3R-030-MC", clienteIdx: 1 },
    { estado: "CONCLUIDO", haDias: 2, estrelas: 5, comentario: "Muito rápido e preço dentro da faixa.", empresa: 1, camiaoMatricula: "MRA-011-MC", clienteIdx: 0 },
    { estado: "CONCLUIDO", haDias: 1, estrelas: 4, comentario: "Sem complicações no pagamento M-Pesa.", empresa: 2, camiaoMatricula: "SRL-020-MC", clienteIdx: 2 },
    { estado: "CONCLUIDO", haDias: 0, minAtras: 180, estrelas: 5, comentario: "Reboque pontual e cuidadoso hoje de manhã.", empresa: 0, camiaoMatricula: "RBM-001-MC", clienteIdx: 0 },
    { estado: "CONCLUIDO", haDias: 0, minAtras: 95, estrelas: 5, comentario: "Socorro eficiente na Zona da Liberdade.", empresa: 2, camiaoMatricula: "SRL-020-MC", clienteIdx: 1 },
    { estado: "RECUSADO", haDias: 1, estrelas: null, comentario: null, empresa: 1, camiaoMatricula: "MRA-011-MC", clienteIdx: 2 },
    { estado: "CANCELADO", haDias: 2, estrelas: null, comentario: null, empresa: null, camiaoMatricula: null, clienteIdx: 1 },
    { estado: "A_CAMINHO", haDias: 0, minAtras: 12, estrelas: null, comentario: null, empresa: 1, camiaoMatricula: "MRA-010-MC", clienteIdx: 1 },
    { estado: "PENDENTE", haDias: 0, minAtras: 1, estrelas: null, comentario: null, empresa: 0, camiaoMatricula: "RBM-001-MC", clienteIdx: 2 },
  ];

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
    const cliente = condutores[c.clienteIdx % condutores.length];
    const veiculoCliente = cliente.veiculos[i % Math.max(1, cliente.veiculos.length)] ?? null;
    const origem = pontosMatola[i % pontosMatola.length];
    const destino = destinos[i % destinos.length];
    const distancia = haversine(origem, destino);
    const tipoVeiculo = veiculoCliente?.tipo || tiposVeiculo[i % 4];
    const criadoEm = new Date(
      agora - (c.haDias || 0) * 24 * 3600 * 1000 - (c.minAtras || 0) * 60 * 1000
    );

    const empresaId = c.empresa !== null ? empresasCriadas[c.empresa].id : null;
    const faixasEmp = c.empresa !== null ? empresasCriadas[c.empresa].faixas[tipoVeiculo] : null;
    const kms: [number, number][] = [[0, 5], [5, 10], [10, 20], [20, 9999]];
    const intervalo =
      faixasEmp?.find((_, idx) => distancia >= kms[idx][0] && distancia <= kms[idx][1]) || [500, 2000];

    const camiao = c.camiaoMatricula
      ? camiaoPorMatricula.get(c.camiaoMatricula) ?? null
      : c.empresa !== null
        ? await prisma.camiao.findFirst({ where: { empresaId: empresasCriadas[c.empresa].id } })
        : null;

    const eventos: { estado: string; nota?: string; minutosDepois: number }[] = [
      { estado: "PENDENTE", nota: "Pedido criado", minutosDepois: 0 },
    ];
    if (c.estado === "RECUSADO") {
      eventos.push({ estado: "RECUSADO", nota: "Recusado pelo condutor", minutosDepois: 2 });
    } else if (c.estado !== "PENDENTE" && c.estado !== "CANCELADO") {
      eventos.push({ estado: "ACEITE", minutosDepois: 2 });
      if (["A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "A_CAMINHO", minutosDepois: 4 });
      }
      if (["NO_LOCAL", "EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "NO_LOCAL", minutosDepois: 12 });
      }
      if (["EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "EM_TRANSPORTE", minutosDepois: 18 });
      }
      if (c.estado === "CONCLUIDO") {
        eventos.push({ estado: "CONCLUIDO", minutosDepois: 32 });
      }
    }
    if (c.estado === "CANCELADO") {
      eventos.push({ estado: "CANCELADO", nota: "Cancelado pelo cliente", minutosDepois: 5 });
    }

    const duracaoMin = c.estado === "CONCLUIDO" ? 32 : c.estado === "A_CAMINHO" ? 6 : 0;
    const pedido = await prisma.pedido.create({
      data: {
        condutorId: cliente.id,
        empresaId,
        camiaoId: camiao?.id || null,
        veiculoId: veiculoCliente?.id || null,
        origemLat: origem.lat,
        origemLng: origem.lng,
        origemEndereco: origem.endereco,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        destinoEndereco: destino.endereco,
        distanciaKm: Math.round(distancia * 10) / 10,
        tipoProblema: problemas[i % problemas.length],
        tipoVeiculo,
        observacoes: i % 3 === 0 ? "Veículo estacionado na berma direita com os quatro piscas." : null,
        estado: c.estado,
        motivoRecusa: c.estado === "RECUSADO" ? "Veículo em manutenção programada" : null,
        precoMin: intervalo[0],
        precoMax: intervalo[1],
        metodoPagamento: c.estado === "CONCLUIDO" ? pagamentos[i % 3] : null,
        pagamentoConfirmado: c.estado === "CONCLUIDO" && i % 2 === 0,
        canceladoPor: c.estado === "CANCELADO" ? "CLIENTE" : null,
        criadoEm,
        actualizadoEm: new Date(criadoEm.getTime() + duracaoMin * 60 * 1000),
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

  // ---------- Resposta ao protótipo ----------
  await prisma.respostaPrototipo.create({
    data: {
      utilizadorId: condutores[0].id,
      papel: "CLIENTE",
      respostas: JSON.stringify({
        sus: [5, 1, 5, 1, 4, 2, 5, 1, 4, 1],
        extras: [5, 5, 5],
        comentario: "Interface simples, parece o Yango. Gostei da faixa de preço.",
      }),
      susScore: 90,
      comentario: "Interface simples, parece o Yango. Gostei da faixa de preço.",
      criadoEm: diasAtras(2),
    },
  });

  console.log("✅ Seed concluído!");
  console.log("   Admin: admin@reboqueja.co.mz / admin123");
  console.log("   Clientes: +258841111111 / +258842222222 / +258843333333 (senha: teste123)");
  console.log("   Empresas: +258865000001…005 (senha: teste123)");
  console.log("   Condutores: +258875000001 … +258875000011 (senha: teste123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
