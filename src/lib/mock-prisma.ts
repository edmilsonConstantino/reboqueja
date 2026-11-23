import "server-only";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export type ModelName =
  | "utilizador"
  | "veiculo"
  | "empresa"
  | "camiao"
  | "atribuicaoCamiao"
  | "faixaPreco"
  | "pedido"
  | "pedidoEvento"
  | "avaliacao"
  | "respostaPrototipo";

type Rec = Record<string, unknown> & { id: string };

type Store = {
  seq: number;
  utilizador: Rec[];
  veiculo: Rec[];
  empresa: Rec[];
  camiao: Rec[];
  atribuicaoCamiao: Rec[];
  faixaPreco: Rec[];
  pedido: Rec[];
  pedidoEvento: Rec[];
  avaliacao: Rec[];
  respostaPrototipo: Rec[];
};

const globalForMock = globalThis as unknown as {
  __rjMockDb?: Store;
  __rjMockPrisma?: PrismaClient;
  __rjDemoLiveCamioes?: Set<string>;
  __rjDemoLivePedidos?: Set<string>;
};

function nextId(store: Store, prefix: string): string {
  store.seq += 1;
  return `${prefix}_${store.seq.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function createInitialStore(): Store {
  const store: Store = {
    seq: 100,
    utilizador: [],
    veiculo: [],
    empresa: [],
    camiao: [],
    atribuicaoCamiao: [],
    faixaPreco: [],
    pedido: [],
    pedidoEvento: [],
    avaliacao: [],
    respostaPrototipo: [],
  };

  const senhaPadrao = bcrypt.hashSync("teste123", 8);
  const senhaAdmin = bcrypt.hashSync("admin123", 8);
  const agora = Date.now();
  const diasAtras = (n: number) => new Date(agora - n * 24 * 3600 * 1000);

  // ---------- Admin ----------
  const adminId = nextId(store, "usr");
  store.utilizador.push({
    id: adminId,
    nome: "Administrador ReboqueJá",
    telefone: "+258870000000",
    email: "admin@reboqueja.co.mz",
    senhaHash: senhaAdmin,
    papel: "ADMIN",
    activo: true,
    empresaCondutorId: null,
    criadoEm: diasAtras(45),
  });

  // ---------- Clientes e seus veículos ----------
  const condutoresDef = [
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
  const condutores: Rec[] = [];
  const veiculosPorCondutor = new Map<string, Rec[]>();
  for (let idx = 0; idx < condutoresDef.length; idx++) {
    const c = condutoresDef[idx];
    const u: Rec = {
      id: nextId(store, "usr"),
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      senhaHash: senhaPadrao,
      papel: "CLIENTE",
      activo: true,
      empresaCondutorId: null,
      criadoEm: diasAtras(25 - idx),
    };
    store.utilizador.push(u);
    condutores.push(u);

    const listaVeiculos: Rec[] = [];
    for (const v of c.veiculos) {
      const vei: Rec = {
        id: nextId(store, "vei"),
        condutorId: u.id,
        marca: v.marca,
        modelo: v.modelo,
        matricula: v.matricula,
        tipo: v.tipo,
      };
      store.veiculo.push(vei);
      listaVeiculos.push(vei);
    }
    veiculosPorCondutor.set(u.id, listaVeiculos);
  }

  // ---------- Empresas ----------
  const BAIRROS: Record<string, { lat: number; lng: number; endereco: string }> = {
    Machava: { lat: -25.955, lng: 32.46, endereco: "Av. das FPLM, Machava, Matola" },
    "Matola Rio": { lat: -25.99, lng: 32.47, endereco: "Bairro Matola Rio, Matola" },
    Liberdade: { lat: -25.97, lng: 32.49, endereco: "Bairro Liberdade, Matola" },
    T3: { lat: -25.965, lng: 32.44, endereco: "Bairro T3, Matola" },
    Fomento: { lat: -25.95, lng: 32.48, endereco: "Bairro Fomento, Matola" },
  };

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

  const empresasCriadas: {
    id: string;
    nome: string;
    faixas: Record<string, [number, number][]>;
    userId: string;
  }[] = [];

  const demoLiveCamioes = new Set<string>();
  const demoLivePedidos = new Set<string>();
  const camiaoPorMatricula = new Map<string, Rec>();

  for (let idx = 0; idx < empresasDef.length; idx++) {
    const def = empresasDef[idx];
    const b = BAIRROS[def.bairro];
    const userEmpId = nextId(store, "usr");
    const empId = nextId(store, "emp");

    store.utilizador.push({
      id: userEmpId,
      nome: def.nome,
      telefone: def.telefone,
      email: def.email,
      senhaHash: senhaPadrao,
      papel: "EMPRESA",
      activo: true,
      empresaCondutorId: null,
      criadoEm: diasAtras(35 - idx),
    });

    store.empresa.push({
      id: empId,
      utilizadorId: userEmpId,
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
    });

    for (let ci = 0; ci < def.camioes.length; ci++) {
      const c = def.camioes[ci];
      const condUserId = nextId(store, "usr");
      store.utilizador.push({
        id: condUserId,
        nome: c.motorista,
        telefone: c.tel,
        email: c.email,
        senhaHash: senhaPadrao,
        papel: "CONDUTOR",
        activo: true,
        empresaCondutorId: empId,
        criadoEm: diasAtras(22 - ci),
      });

      const camId = nextId(store, "cam");
      const temGps = Boolean(c.disponivel && c.lat !== undefined && c.lng !== undefined);
      const camRec: Rec = {
        id: camId,
        empresaId: empId,
        motoristaId: c.semCondutor ? null : condUserId,
        matricula: c.matricula,
        marca: c.marca,
        modelo: c.modelo,
        tipo: c.tipo,
        capacidade: c.tipo === "PESADO" ? "Até 5 t" : "Até 2 t",
        motoristaNome: c.semCondutor ? "" : c.motorista,
        motoristaTelefone: c.semCondutor ? "" : c.tel,
        lat: temGps ? c.lat! : 0,
        lng: temGps ? c.lng! : 0,
        activo: true,
        disponivel: temGps,
        partilhaLocalizacao: temGps,
        localizacaoActualizadaEm: temGps ? new Date(agora - 15_000) : null,
      };
      store.camiao.push(camRec);
      camiaoPorMatricula.set(c.matricula, camRec);

      if (temGps) {
        demoLiveCamioes.add(camId);
      }

      if (c.semCondutor) {
        // Histórico encerrado preservando os dados do condutor anterior
        store.atribuicaoCamiao.push({
          id: nextId(store, "atr"),
          camiaoId: camId,
          motoristaId: condUserId,
          atribuidoPorId: userEmpId,
          inicioEm: diasAtras(18),
          fimEm: diasAtras(3),
          motivo: "Fim de turno — veículo aguarda nova escala",
        });
      } else {
        store.atribuicaoCamiao.push({
          id: nextId(store, "atr"),
          camiaoId: camId,
          motoristaId: condUserId,
          atribuidoPorId: userEmpId,
          inicioEm: diasAtras(20),
          fimEm: null,
          motivo: "Associação inicial da frota",
        });
      }
    }

    const kms: [number, number][] = [[0, 5], [5, 10], [10, 20], [20, 9999]];
    const faixas: Record<string, [number, number][]> = {};
    for (const [tipo, intervalos] of Object.entries(def.faixas)) {
      faixas[tipo] = [];
      for (let i = 0; i < intervalos.length; i++) {
        const [pMin, pMax] = intervalos[i];
        const [kmMin, kmMax] = kms[i];
        store.faixaPreco.push({
          id: nextId(store, "fx"),
          empresaId: empId,
          tipoVeiculo: tipo,
          kmMin,
          kmMax,
          precoMin: pMin,
          precoMax: pMax,
        });
        faixas[tipo].push([pMin, pMax]);
      }
    }

    empresasCriadas.push({ id: empId, nome: def.nome, faixas, userId: userEmpId });
  }

  // Condutores adicionais livres (sem camião atribuído) para selecção imediata no modal
  const condutoresLivres = [
    {
      nome: "Mateus Mondlane",
      telefone: "+258875000010",
      email: "mateus.mondlane@reboqueja.co.mz",
      empresaId: empresasCriadas[0].id,
    },
    {
      nome: "Sérgio Guambe",
      telefone: "+258875000011",
      email: "sergio.guambe@reboqueja.co.mz",
      empresaId: empresasCriadas[1].id,
    },
  ];
  for (const cl of condutoresLivres) {
    store.utilizador.push({
      id: nextId(store, "usr"),
      nome: cl.nome,
      telefone: cl.telefone,
      email: cl.email,
      senhaHash: senhaPadrao,
      papel: "CONDUTOR",
      activo: true,
      empresaCondutorId: cl.empresaId,
      criadoEm: diasAtras(12),
    });
  }

  // ---------- Pedidos interligados (históricos + hoje + em curso + pendente) ----------
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

  // Nota: Cliente 0 (João +258841111111) não tem pedido activo bloqueante para poder testar "Pedir reboque" imediatamente.
  // Cliente 1 (Ana +258842222222) tem pedido A_CAMINHO com Matola Rio (MRA-010-MC).
  // Cliente 2 (Carlos +258843333333) tem pedido PENDENTE dirigido ao Condutor Demo (Alberto Nhaca / RBM-001-MC).
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

  for (let i = 0; i < cenarios.length; i++) {
    const c = cenarios[i];
    const cliente = condutores[c.clienteIdx % condutores.length];
    const veiculosCliente = veiculosPorCondutor.get(cliente.id) ?? [];
    const veiculoCliente = veiculosCliente[i % Math.max(1, veiculosCliente.length)] ?? null;
    const origem = pontosMatola[i % pontosMatola.length];
    const destino = destinos[i % destinos.length];
    const distancia = haversine(origem, destino);
    const tipoVeiculo = (veiculoCliente?.tipo as string | undefined) || tiposVeiculo[i % 4];
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
        ? store.camiao.find((cm) => cm.empresaId === empresasCriadas[c.empresa!].id) ?? null
        : null;

    const pedidoId = nextId(store, "ped");
    const duracaoMin = c.estado === "CONCLUIDO" ? 32 : c.estado === "A_CAMINHO" ? 6 : 0;
    store.pedido.push({
      id: pedidoId,
      condutorId: cliente.id,
      empresaId,
      camiaoId: camiao?.id ?? null,
      veiculoId: veiculoCliente?.id ?? null,
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
    });

    if (c.estado === "PENDENTE") {
      demoLivePedidos.add(pedidoId);
    }

    const eventos: { estado: string; nota: string | null; minutosDepois: number }[] = [
      { estado: "PENDENTE", nota: "Pedido criado", minutosDepois: 0 },
    ];
    if (c.estado === "RECUSADO") {
      eventos.push({ estado: "RECUSADO", nota: "Recusado pelo condutor", minutosDepois: 2 });
    } else if (c.estado !== "PENDENTE" && c.estado !== "CANCELADO") {
      eventos.push({ estado: "ACEITE", nota: null, minutosDepois: 2 });
      if (["A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "A_CAMINHO", nota: null, minutosDepois: 4 });
      }
      if (["NO_LOCAL", "EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "NO_LOCAL", nota: null, minutosDepois: 12 });
      }
      if (["EM_TRANSPORTE", "CONCLUIDO"].includes(c.estado)) {
        eventos.push({ estado: "EM_TRANSPORTE", nota: null, minutosDepois: 18 });
      }
      if (c.estado === "CONCLUIDO") {
        eventos.push({ estado: "CONCLUIDO", nota: null, minutosDepois: 32 });
      }
    }
    if (c.estado === "CANCELADO") {
      eventos.push({ estado: "CANCELADO", nota: "Cancelado pelo cliente", minutosDepois: 5 });
    }

    for (const ev of eventos) {
      store.pedidoEvento.push({
        id: nextId(store, "pev"),
        pedidoId,
        estado: ev.estado,
        nota: ev.nota,
        criadoEm: new Date(criadoEm.getTime() + ev.minutosDepois * 60 * 1000),
      });
    }

    if (c.estrelas) {
      store.avaliacao.push({
        id: nextId(store, "avl"),
        pedidoId,
        estrelas: c.estrelas,
        comentario: c.comentario,
      });
    }
  }

  // ---------- Resposta protótipo ----------
  store.respostaPrototipo.push({
    id: nextId(store, "prt"),
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
  });

  globalForMock.__rjDemoLiveCamioes = demoLiveCamioes;
  globalForMock.__rjDemoLivePedidos = demoLivePedidos;

  return store;
}

let lastKeepaliveMs = 0;

function refreshDemoKeepalive(store: Store): void {
  const agoraMs = Date.now();
  if (agoraMs - lastKeepaliveMs < 5_000) return;
  lastKeepaliveMs = agoraMs;

  // Mantém o sinal de GPS dos camiões demo que continuam online e a solicitação pendente demo viva
  const liveCamioes = globalForMock.__rjDemoLiveCamioes;
  if (liveCamioes) {
    for (const c of store.camiao) {
      if (
        liveCamioes.has(c.id) &&
        c.activo === true &&
        c.disponivel === true &&
        c.partilhaLocalizacao === true &&
        c.motoristaId
      ) {
        const ts =
          c.localizacaoActualizadaEm instanceof Date
            ? c.localizacaoActualizadaEm.getTime()
            : 0;
        if (agoraMs - ts > 30_000) {
          c.localizacaoActualizadaEm = new Date(agoraMs - 5_000);
        }
      }
    }
  }

  const livePedidos = globalForMock.__rjDemoLivePedidos;
  if (livePedidos) {
    for (const p of store.pedido) {
      if (livePedidos.has(p.id) && p.estado === "PENDENTE") {
        const ts = p.criadoEm instanceof Date ? p.criadoEm.getTime() : 0;
        if (agoraMs - ts > 45_000) {
          p.criadoEm = new Date(agoraMs - 15_000);
          p.actualizadoEm = p.criadoEm;
        }
      }
    }
  }
}

function getStore(): Store {
  if (!globalForMock.__rjMockDb) {
    globalForMock.__rjMockDb = createInitialStore();
  }
  const store = globalForMock.__rjMockDb;
  refreshDemoKeepalive(store);
  return store;
}

type RelationMeta = {
  target: ModelName;
  type: "one" | "many";
  resolve: (store: Store, rec: Rec) => Rec | Rec[] | null;
};

const RELATIONS: Record<ModelName, Record<string, RelationMeta>> = {
  utilizador: {
    veiculos: {
      target: "veiculo",
      type: "many",
      resolve: (s, r) => s.veiculo.filter((v) => v.condutorId === r.id),
    },
    pedidos: {
      target: "pedido",
      type: "many",
      resolve: (s, r) => s.pedido.filter((p) => p.condutorId === r.id),
    },
    empresa: {
      target: "empresa",
      type: "one",
      resolve: (s, r) => s.empresa.find((e) => e.utilizadorId === r.id) ?? null,
    },
    empresaCondutor: {
      target: "empresa",
      type: "one",
      resolve: (s, r) =>
        r.empresaCondutorId
          ? s.empresa.find((e) => e.id === r.empresaCondutorId) ?? null
          : null,
    },
    camiao: {
      target: "camiao",
      type: "one",
      resolve: (s, r) => s.camiao.find((c) => c.motoristaId === r.id) ?? null,
    },
    atribuicoesMotorista: {
      target: "atribuicaoCamiao",
      type: "many",
      resolve: (s, r) => s.atribuicaoCamiao.filter((a) => a.motoristaId === r.id),
    },
    atribuicoesFeitasPor: {
      target: "atribuicaoCamiao",
      type: "many",
      resolve: (s, r) => s.atribuicaoCamiao.filter((a) => a.atribuidoPorId === r.id),
    },
    respostas: {
      target: "respostaPrototipo",
      type: "many",
      resolve: (s, r) => s.respostaPrototipo.filter((rp) => rp.utilizadorId === r.id),
    },
  },
  veiculo: {
    condutor: {
      target: "utilizador",
      type: "one",
      resolve: (s, r) => s.utilizador.find((u) => u.id === r.condutorId) ?? null,
    },
    pedidos: {
      target: "pedido",
      type: "many",
      resolve: (s, r) => s.pedido.filter((p) => p.veiculoId === r.id),
    },
  },
  empresa: {
    utilizador: {
      target: "utilizador",
      type: "one",
      resolve: (s, r) => s.utilizador.find((u) => u.id === r.utilizadorId) ?? null,
    },
    camioes: {
      target: "camiao",
      type: "many",
      resolve: (s, r) => s.camiao.filter((c) => c.empresaId === r.id),
    },
    condutores: {
      target: "utilizador",
      type: "many",
      resolve: (s, r) => s.utilizador.filter((u) => u.empresaCondutorId === r.id),
    },
    precos: {
      target: "faixaPreco",
      type: "many",
      resolve: (s, r) => s.faixaPreco.filter((f) => f.empresaId === r.id),
    },
    pedidos: {
      target: "pedido",
      type: "many",
      resolve: (s, r) => s.pedido.filter((p) => p.empresaId === r.id),
    },
  },
  camiao: {
    empresa: {
      target: "empresa",
      type: "one",
      resolve: (s, r) => s.empresa.find((e) => e.id === r.empresaId) ?? null,
    },
    motorista: {
      target: "utilizador",
      type: "one",
      resolve: (s, r) =>
        r.motoristaId ? s.utilizador.find((u) => u.id === r.motoristaId) ?? null : null,
    },
    pedidos: {
      target: "pedido",
      type: "many",
      resolve: (s, r) => s.pedido.filter((p) => p.camiaoId === r.id),
    },
    atribuicoes: {
      target: "atribuicaoCamiao",
      type: "many",
      resolve: (s, r) => s.atribuicaoCamiao.filter((a) => a.camiaoId === r.id),
    },
  },
  atribuicaoCamiao: {
    camiao: {
      target: "camiao",
      type: "one",
      resolve: (s, r) => s.camiao.find((c) => c.id === r.camiaoId) ?? null,
    },
    motorista: {
      target: "utilizador",
      type: "one",
      resolve: (s, r) => s.utilizador.find((u) => u.id === r.motoristaId) ?? null,
    },
    atribuidoPor: {
      target: "utilizador",
      type: "one",
      resolve: (s, r) =>
        r.atribuidoPorId ? s.utilizador.find((u) => u.id === r.atribuidoPorId) ?? null : null,
    },
  },
  faixaPreco: {
    empresa: {
      target: "empresa",
      type: "one",
      resolve: (s, r) => s.empresa.find((e) => e.id === r.empresaId) ?? null,
    },
  },
  pedido: {
    condutor: {
      target: "utilizador",
      type: "one",
      resolve: (s, r) => s.utilizador.find((u) => u.id === r.condutorId) ?? null,
    },
    empresa: {
      target: "empresa",
      type: "one",
      resolve: (s, r) =>
        r.empresaId ? s.empresa.find((e) => e.id === r.empresaId) ?? null : null,
    },
    camiao: {
      target: "camiao",
      type: "one",
      resolve: (s, r) =>
        r.camiaoId ? s.camiao.find((c) => c.id === r.camiaoId) ?? null : null,
    },
    veiculo: {
      target: "veiculo",
      type: "one",
      resolve: (s, r) =>
        r.veiculoId ? s.veiculo.find((v) => v.id === r.veiculoId) ?? null : null,
    },
    eventos: {
      target: "pedidoEvento",
      type: "many",
      resolve: (s, r) => s.pedidoEvento.filter((ev) => ev.pedidoId === r.id),
    },
    avaliacao: {
      target: "avaliacao",
      type: "one",
      resolve: (s, r) => s.avaliacao.find((av) => av.pedidoId === r.id) ?? null,
    },
  },
  pedidoEvento: {
    pedido: {
      target: "pedido",
      type: "one",
      resolve: (s, r) => s.pedido.find((p) => p.id === r.pedidoId) ?? null,
    },
  },
  avaliacao: {
    pedido: {
      target: "pedido",
      type: "one",
      resolve: (s, r) => s.pedido.find((p) => p.id === r.pedidoId) ?? null,
    },
  },
  respostaPrototipo: {
    utilizador: {
      target: "utilizador",
      type: "one",
      resolve: (s, r) => s.utilizador.find((u) => u.id === r.utilizadorId) ?? null,
    },
  },
};

function isPlainObj(val: unknown): val is Record<string, unknown> {
  return (
    typeof val === "object" &&
    val !== null &&
    !(val instanceof Date) &&
    !Array.isArray(val)
  );
}

function comparableVal(v: unknown): number | string | boolean | null {
  if (v instanceof Date) return v.getTime();
  if (v === undefined) return null;
  return v as number | string | boolean | null;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date && typeof b === "string") return a.getTime() === new Date(b).getTime();
  if (typeof a === "string" && b instanceof Date) return new Date(a).getTime() === b.getTime();
  return a === b;
}

function matchesCondition(actual: unknown, cond: unknown): boolean {
  if (cond === undefined) return true;
  if (!isPlainObj(cond)) {
    return valuesEqual(actual, cond);
  }
  const c = cond as Record<string, unknown>;
  const act = comparableVal(actual);

  if ("equals" in c && c.equals !== undefined && !valuesEqual(actual, c.equals)) {
    return false;
  }
  if ("not" in c && c.not !== undefined) {
    if (isPlainObj(c.not)) {
      if (matchesCondition(actual, c.not)) return false;
    } else if (valuesEqual(actual, c.not)) {
      return false;
    }
  }
  if ("in" in c && Array.isArray(c.in)) {
    if (!c.in.some((item) => valuesEqual(actual, item))) return false;
  }
  if ("notIn" in c && Array.isArray(c.notIn)) {
    if (c.notIn.some((item) => valuesEqual(actual, item))) return false;
  }
  if ("gte" in c && c.gte !== undefined) {
    const target = comparableVal(c.gte);
    if (act === null || target === null || act < target) return false;
  }
  if ("gt" in c && c.gt !== undefined) {
    const target = comparableVal(c.gt);
    if (act === null || target === null || act <= target) return false;
  }
  if ("lte" in c && c.lte !== undefined) {
    const target = comparableVal(c.lte);
    if (act === null || target === null || act > target) return false;
  }
  if ("lt" in c && c.lt !== undefined) {
    const target = comparableVal(c.lt);
    if (act === null || target === null || act >= target) return false;
  }
  if ("contains" in c && typeof c.contains === "string") {
    if (typeof actual !== "string" || !actual.toLowerCase().includes(c.contains.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function matchesWhere(
  store: Store,
  model: ModelName,
  rec: Rec,
  where?: Record<string, unknown>
): boolean {
  if (!where) return true;
  const rels = RELATIONS[model];

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === "OR" && Array.isArray(val)) {
      if (!val.some((sub) => matchesWhere(store, model, rec, sub as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (key === "AND" && Array.isArray(val)) {
      if (!val.every((sub) => matchesWhere(store, model, rec, sub as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (key === "NOT") {
      const list = Array.isArray(val) ? val : [val];
      if (list.some((sub) => matchesWhere(store, model, rec, sub as Record<string, unknown>))) {
        return false;
      }
      continue;
    }

    const rel = rels[key];
    if (rel) {
      const related = rel.resolve(store, rec);
      if (rel.type === "one") {
        const item = related as Rec | null;
        if (val === null) {
          if (item !== null) return false;
          continue;
        }
        if (isPlainObj(val)) {
          if ("is" in val) {
            if (val.is === null) {
              if (item !== null) return false;
            } else if (!item || !matchesWhere(store, rel.target, item, val.is as Record<string, unknown>)) {
              return false;
            }
            continue;
          }
          if ("isNot" in val) {
            if (val.isNot === null) {
              if (item === null) return false;
            } else if (item && matchesWhere(store, rel.target, item, val.isNot as Record<string, unknown>)) {
              return false;
            }
            continue;
          }
          if (!item || !matchesWhere(store, rel.target, item, val)) {
            return false;
          }
        }
      } else {
        const list = (related as Rec[]) || [];
        if (isPlainObj(val)) {
          if ("some" in val) {
            const sub = (val.some ?? {}) as Record<string, unknown>;
            if (!list.some((item) => matchesWhere(store, rel.target, item, sub))) {
              return false;
            }
          }
          if ("every" in val) {
            const sub = (val.every ?? {}) as Record<string, unknown>;
            if (!list.every((item) => matchesWhere(store, rel.target, item, sub))) {
              return false;
            }
          }
          if ("none" in val) {
            const sub = (val.none ?? {}) as Record<string, unknown>;
            if (list.some((item) => matchesWhere(store, rel.target, item, sub))) {
              return false;
            }
          }
        }
      }
      continue;
    }

    if (!matchesCondition(rec[key], val)) {
      return false;
    }
  }

  return true;
}

function sortRecords(
  records: Rec[],
  orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[]
): Rec[] {
  if (!orderBy) return records;
  const rules = Array.isArray(orderBy) ? orderBy : [orderBy];
  if (rules.length === 0) return records;

  return [...records].sort((a, b) => {
    for (const rule of rules) {
      for (const [field, dir] of Object.entries(rule)) {
        const va = comparableVal(a[field]);
        const vb = comparableVal(b[field]);
        if (va === vb) continue;
        if (va === null) return dir === "asc" ? -1 : 1;
        if (vb === null) return dir === "asc" ? 1 : -1;
        if (va < vb) return dir === "asc" ? -1 : 1;
        if (va > vb) return dir === "asc" ? 1 : -1;
      }
    }
    return 0;
  });
}

type QueryOpts = {
  select?: Record<string, unknown>;
  include?: Record<string, unknown>;
  where?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[];
  take?: number;
};

function projectRecord(
  store: Store,
  model: ModelName,
  rec: Rec,
  opts?: { select?: Record<string, unknown>; include?: Record<string, unknown> }
): Record<string, unknown> {
  const rels = RELATIONS[model];
  const select = opts?.select;
  const include = opts?.include;

  const out: Record<string, unknown> = select ? {} : { ...rec };

  if (select) {
    for (const [key, spec] of Object.entries(select)) {
      if (!spec) continue;
      if (key === "_count" && isPlainObj(spec) && isPlainObj(spec.select)) {
        out._count = computeCount(store, model, rec, spec.select);
        continue;
      }
      const rel = rels[key];
      if (rel) {
        out[key] = resolveAndProjectRelation(store, rel, rec, spec);
      } else {
        out[key] = rec[key];
      }
    }
  }

  if (include) {
    for (const [key, spec] of Object.entries(include)) {
      if (!spec) continue;
      if (key === "_count" && isPlainObj(spec) && isPlainObj(spec.select)) {
        out._count = computeCount(store, model, rec, spec.select);
        continue;
      }
      const rel = rels[key];
      if (rel) {
        out[key] = resolveAndProjectRelation(store, rel, rec, spec);
      }
    }
  }

  return out;
}

function computeCount(
  store: Store,
  model: ModelName,
  rec: Rec,
  countSelect: Record<string, unknown>
): Record<string, number> {
  const rels = RELATIONS[model];
  const result: Record<string, number> = {};
  for (const [relName, spec] of Object.entries(countSelect)) {
    if (!spec) continue;
    const rel = rels[relName];
    if (!rel) {
      result[relName] = 0;
      continue;
    }
    const related = rel.resolve(store, rec);
    if (rel.type === "one") {
      result[relName] = related ? 1 : 0;
    } else {
      let list = (related as Rec[]) || [];
      if (isPlainObj(spec) && isPlainObj(spec.where)) {
        list = list.filter((item) =>
          matchesWhere(store, rel.target, item, spec.where as Record<string, unknown>)
        );
      }
      result[relName] = list.length;
    }
  }
  return result;
}

function resolveAndProjectRelation(
  store: Store,
  rel: RelationMeta,
  rec: Rec,
  spec: unknown
): unknown {
  const related = rel.resolve(store, rec);
  const subOpts = isPlainObj(spec) ? (spec as QueryOpts) : undefined;

  if (rel.type === "one") {
    if (!related) return null;
    return projectRecord(store, rel.target, related as Rec, subOpts);
  }

  let list = (related as Rec[]) || [];
  if (subOpts?.where) {
    list = list.filter((item) => matchesWhere(store, rel.target, item, subOpts.where));
  }
  if (subOpts?.orderBy) {
    list = sortRecords(list, subOpts.orderBy);
  }
  if (typeof subOpts?.take === "number") {
    list = list.slice(0, subOpts.take);
  }
  return list.map((item) => projectRecord(store, rel.target, item, subOpts));
}

function buildDefaults(store: Store, model: ModelName, data: Record<string, unknown>): Rec {
  const now = new Date();
  const base: Rec = {
    id: typeof data.id === "string" && data.id ? data.id : nextId(store, model.slice(0, 3)),
  };

  if (model === "utilizador") {
    base.email = null;
    base.activo = true;
    base.empresaCondutorId = null;
    base.criadoEm = now;
  } else if (model === "empresa") {
    base.raioKm = 15;
    base.disponivel = false;
    base.estadoAprovacao = "PENDENTE";
    base.consentimentoEm = null;
  } else if (model === "camiao") {
    base.motoristaId = null;
    base.marca = null;
    base.modelo = null;
    base.capacidade = null;
    base.motoristaNome = "";
    base.motoristaTelefone = "";
    base.lat = 0;
    base.lng = 0;
    base.activo = true;
    base.disponivel = false;
    base.partilhaLocalizacao = false;
    base.localizacaoActualizadaEm = null;
  } else if (model === "atribuicaoCamiao") {
    base.atribuidoPorId = null;
    base.inicioEm = now;
    base.fimEm = null;
    base.motivo = null;
  } else if (model === "pedido") {
    base.empresaId = null;
    base.camiaoId = null;
    base.veiculoId = null;
    base.destinoLat = null;
    base.destinoLng = null;
    base.destinoEndereco = null;
    base.observacoes = null;
    base.estado = "PENDENTE";
    base.motivoRecusa = null;
    base.metodoPagamento = null;
    base.pagamentoConfirmado = false;
    base.canceladoPor = null;
    base.criadoEm = now;
    base.actualizadoEm = now;
  } else if (model === "pedidoEvento") {
    base.nota = null;
    base.criadoEm = now;
  } else if (model === "avaliacao") {
    base.comentario = null;
  } else if (model === "respostaPrototipo") {
    base.comentario = null;
    base.criadoEm = now;
  }

  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && !(k in RELATIONS[model])) {
      base[k] = v;
    }
  }
  return base;
}

function createRecord(store: Store, model: ModelName, data: Record<string, unknown>): Rec {
  const rec = buildDefaults(store, model, data);
  store[model].push(rec);

  // Nested creates / connects
  if (model === "utilizador") {
    const emp = data.empresa as { create?: Record<string, unknown> } | undefined;
    if (emp?.create) {
      createRecord(store, "empresa", { ...emp.create, utilizadorId: rec.id });
    }
    const veic = data.veiculos as { create?: Record<string, unknown> | Record<string, unknown>[] } | undefined;
    if (veic?.create) {
      const items = Array.isArray(veic.create) ? veic.create : [veic.create];
      for (const item of items) {
        createRecord(store, "veiculo", { ...item, condutorId: rec.id });
      }
    }
    const cam = data.camiao as { connect?: { id?: string } } | undefined;
    if (cam?.connect?.id) {
      const targetCam = store.camiao.find((c) => c.id === cam.connect!.id);
      if (targetCam) targetCam.motoristaId = rec.id;
    }
  } else if (model === "pedido") {
    const evs = data.eventos as { create?: Record<string, unknown> | Record<string, unknown>[] } | undefined;
    if (evs?.create) {
      const items = Array.isArray(evs.create) ? evs.create : [evs.create];
      for (const item of items) {
        createRecord(store, "pedidoEvento", { ...item, pedidoId: rec.id });
      }
    }
  }

  return rec;
}

function deleteCascade(store: Store, model: ModelName, ids: Set<string>) {
  if (ids.size === 0) return;
  if (model === "utilizador") {
    const empIds = new Set(
      store.empresa.filter((e) => ids.has(String(e.utilizadorId))).map((e) => e.id)
    );
    deleteCascade(store, "empresa", empIds);
    const pedIds = new Set(
      store.pedido.filter((p) => ids.has(String(p.condutorId))).map((p) => p.id)
    );
    deleteCascade(store, "pedido", pedIds);
    store.veiculo = store.veiculo.filter((v) => !ids.has(String(v.condutorId)));
    store.respostaPrototipo = store.respostaPrototipo.filter(
      (r) => !ids.has(String(r.utilizadorId))
    );
    for (const c of store.camiao) {
      if (c.motoristaId && ids.has(String(c.motoristaId))) c.motoristaId = null;
    }
    store.atribuicaoCamiao = store.atribuicaoCamiao.filter(
      (a) => !ids.has(String(a.motoristaId))
    );
    for (const a of store.atribuicaoCamiao) {
      if (a.atribuidoPorId && ids.has(String(a.atribuidoPorId))) a.atribuidoPorId = null;
    }
  } else if (model === "empresa") {
    const camIds = new Set(
      store.camiao.filter((c) => ids.has(String(c.empresaId))).map((c) => c.id)
    );
    deleteCascade(store, "camiao", camIds);
    store.faixaPreco = store.faixaPreco.filter((f) => !ids.has(String(f.empresaId)));
    for (const u of store.utilizador) {
      if (u.empresaCondutorId && ids.has(String(u.empresaCondutorId))) {
        u.empresaCondutorId = null;
      }
    }
    for (const p of store.pedido) {
      if (p.empresaId && ids.has(String(p.empresaId))) p.empresaId = null;
    }
  } else if (model === "pedido") {
    store.pedidoEvento = store.pedidoEvento.filter((ev) => !ids.has(String(ev.pedidoId)));
    store.avaliacao = store.avaliacao.filter((av) => !ids.has(String(av.pedidoId)));
  } else if (model === "camiao") {
    store.atribuicaoCamiao = store.atribuicaoCamiao.filter(
      (a) => !ids.has(String(a.camiaoId))
    );
    for (const p of store.pedido) {
      if (p.camiaoId && ids.has(String(p.camiaoId))) p.camiaoId = null;
    }
  }
  store[model] = store[model].filter((r) => !ids.has(r.id));
}

function createModelDelegate(store: Store, model: ModelName) {
  return {
    async findMany(args: QueryOpts = {}) {
      refreshDemoKeepalive(store);
      let list = store[model].filter((r) => matchesWhere(store, model, r, args.where));
      list = sortRecords(list, args.orderBy);
      if (typeof args.take === "number") {
        list = list.slice(0, args.take);
      }
      return list.map((r) => projectRecord(store, model, r, args));
    },

    async findFirst(args: QueryOpts = {}) {
      refreshDemoKeepalive(store);
      let list = store[model].filter((r) => matchesWhere(store, model, r, args.where));
      list = sortRecords(list, args.orderBy);
      const hit = list[0];
      return hit ? projectRecord(store, model, hit, args) : null;
    },

    async findUnique(args: QueryOpts = {}) {
      refreshDemoKeepalive(store);
      const hit = store[model].find((r) => matchesWhere(store, model, r, args.where));
      return hit ? projectRecord(store, model, hit, args) : null;
    },

    async create(args: { data: Record<string, unknown>; select?: Record<string, unknown>; include?: Record<string, unknown> }) {
      const rec = createRecord(store, model, args.data);
      return projectRecord(store, model, rec, args);
    },

    async createMany(args: { data: Record<string, unknown>[] }) {
      for (const item of args.data) {
        createRecord(store, model, item);
      }
      return { count: args.data.length };
    },

    async update(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
      select?: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) {
      const rec = store[model].find((r) => matchesWhere(store, model, r, args.where));
      if (!rec) {
        throw new Error(`Record to update not found in ${model}`);
      }
      for (const [k, v] of Object.entries(args.data)) {
        if (v !== undefined && !(k in RELATIONS[model])) {
          rec[k] = v;
        }
      }
      if (model === "pedido") {
        rec.actualizadoEm = new Date();
      }
      return projectRecord(store, model, rec, args);
    },

    async updateMany(args: { where?: Record<string, unknown>; data: Record<string, unknown> }) {
      const matches = store[model].filter((r) => matchesWhere(store, model, r, args.where));
      for (const rec of matches) {
        for (const [k, v] of Object.entries(args.data)) {
          if (v !== undefined && !(k in RELATIONS[model])) {
            rec[k] = v;
          }
        }
        if (model === "pedido") {
          rec.actualizadoEm = new Date();
        }
      }
      return { count: matches.length };
    },

    async upsert(args: {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
      select?: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) {
      const hit = store[model].find((r) => matchesWhere(store, model, r, args.where));
      if (hit) {
        for (const [k, v] of Object.entries(args.update)) {
          if (v !== undefined && !(k in RELATIONS[model])) {
            hit[k] = v;
          }
        }
        return projectRecord(store, model, hit, args);
      }
      const rec = createRecord(store, model, args.create);
      return projectRecord(store, model, rec, args);
    },

    async delete(args: { where: Record<string, unknown> }) {
      const hit = store[model].find((r) => matchesWhere(store, model, r, args.where));
      if (!hit) {
        throw new Error(`Record to delete not found in ${model}`);
      }
      const snap = { ...hit };
      deleteCascade(store, model, new Set([hit.id]));
      return snap;
    },

    async deleteMany(args?: { where?: Record<string, unknown> }) {
      const matches = store[model].filter((r) => matchesWhere(store, model, r, args?.where));
      deleteCascade(store, model, new Set(matches.map((m) => m.id)));
      return { count: matches.length };
    },

    async count(args?: { where?: Record<string, unknown> }) {
      refreshDemoKeepalive(store);
      return store[model].filter((r) => matchesWhere(store, model, r, args?.where)).length;
    },

    async aggregate(args: {
      where?: Record<string, unknown>;
      _avg?: Record<string, boolean>;
      _sum?: Record<string, boolean>;
      _count?: boolean | Record<string, boolean>;
    }) {
      refreshDemoKeepalive(store);
      const matches = store[model].filter((r) => matchesWhere(store, model, r, args.where));
      const res: Record<string, unknown> = {};

      if (args._avg) {
        const avgObj: Record<string, number | null> = {};
        for (const [field, on] of Object.entries(args._avg)) {
          if (!on) continue;
          const nums = matches
            .map((m) => m[field])
            .filter((v): v is number => typeof v === "number");
          avgObj[field] = nums.length
            ? nums.reduce((acc, n) => acc + n, 0) / nums.length
            : null;
        }
        res._avg = avgObj;
      }

      if (args._sum) {
        const sumObj: Record<string, number | null> = {};
        for (const [field, on] of Object.entries(args._sum)) {
          if (!on) continue;
          const nums = matches
            .map((m) => m[field])
            .filter((v): v is number => typeof v === "number");
          sumObj[field] = nums.length ? nums.reduce((acc, n) => acc + n, 0) : null;
        }
        res._sum = sumObj;
      }

      if (args._count === true) {
        res._count = matches.length;
      } else if (isPlainObj(args._count)) {
        const countObj: Record<string, number> = {};
        for (const [field, on] of Object.entries(args._count)) {
          if (on) countObj[field] = matches.filter((m) => m[field] !== null && m[field] !== undefined).length;
        }
        res._count = countObj;
      }

      return res;
    },

    async groupBy(args: {
      by: string[];
      where?: Record<string, unknown>;
      _count?: boolean | Record<string, boolean>;
    }) {
      refreshDemoKeepalive(store);
      const matches = store[model].filter((r) => matchesWhere(store, model, r, args.where));
      const groups = new Map<string, { keys: Record<string, unknown>; count: number }>();

      for (const row of matches) {
        const keys: Record<string, unknown> = {};
        for (const k of args.by) {
          keys[k] = row[k];
        }
        const sig = JSON.stringify(keys);
        const existing = groups.get(sig);
        if (existing) {
          existing.count += 1;
        } else {
          groups.set(sig, { keys, count: 1 });
        }
      }

      return Array.from(groups.values()).map((g) => ({
        ...g.keys,
        ...(args._count === true ? { _count: g.count } : {}),
      }));
    },
  };
}

export function getMockPrismaClient(): PrismaClient {
  if (globalForMock.__rjMockPrisma) {
    return globalForMock.__rjMockPrisma;
  }

  console.warn("[ReboqueJá] Base de dados PostgreSQL não configurada — a usar armazenamento em memória pré-semeado.");
  const store = getStore();

  const delegates: Record<ModelName, ReturnType<typeof createModelDelegate>> = {
    utilizador: createModelDelegate(store, "utilizador"),
    veiculo: createModelDelegate(store, "veiculo"),
    empresa: createModelDelegate(store, "empresa"),
    camiao: createModelDelegate(store, "camiao"),
    atribuicaoCamiao: createModelDelegate(store, "atribuicaoCamiao"),
    faixaPreco: createModelDelegate(store, "faixaPreco"),
    pedido: createModelDelegate(store, "pedido"),
    pedidoEvento: createModelDelegate(store, "pedidoEvento"),
    avaliacao: createModelDelegate(store, "avaliacao"),
    respostaPrototipo: createModelDelegate(store, "respostaPrototipo"),
  };

  const client = {
    ...delegates,
    async $transaction(arg: unknown) {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      if (typeof arg === "function") {
        return (arg as (tx: unknown) => Promise<unknown>)(client);
      }
      return [];
    },
    async $connect() {},
    async $disconnect() {},
  } as unknown as PrismaClient;

  globalForMock.__rjMockPrisma = client;
  return client;
}
