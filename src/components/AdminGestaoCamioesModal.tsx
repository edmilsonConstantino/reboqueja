"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  History,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { AvisoErro, Botao, Carregando, Entrada, Etiqueta, Selector } from "@/components/ui";
import { TIPOS_VEICULO } from "@/lib/constants";
import { LABEL_VEICULO } from "@/lib/constants-client";
import { formatarData, formatarDataHora, formatarTelefone } from "@/lib/format";

export type EmpresaResumo = {
  id: string;
  nome: string;
  estadoAprovacao: string;
};

type CondutorEmpresa = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  activo: boolean;
  criadoEm: string;
  empresaCondutorId: string | null;
  camiao: { id: string; matricula: string } | null;
  disponivelParaAtribuir: boolean;
};

type AtribuicaoHistorico = {
  id: string;
  inicioEm: string;
  fimEm: string | null;
  motivo: string | null;
  motorista: {
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
    activo: boolean;
  };
  atribuidoPor: { id: string; nome: string } | null;
};

type DetalheCamiaoResposta = {
  camiao: {
    id: string;
    empresaId: string;
    matricula: string;
    marca: string | null;
    modelo: string | null;
    tipo: string;
    capacidade: string | null;
    activo: boolean;
    disponivel: boolean;
    partilhaLocalizacao: boolean;
    localizacaoValida: boolean;
    gpsActivo: boolean;
    lat: number | null;
    lng: number | null;
    localizacaoActualizadaEm: string | null;
    estadoDisponibilidade:
      | "DISPONIVEL"
      | "EM_SERVICO"
      | "INDISPONIVEL"
      | "GPS_EXPIRADO"
      | "SEM_CONDUTOR"
      | "INACTIVO";
    empresa: {
      id: string;
      nome: string;
      bairro: string;
      telefone: string;
      estadoAprovacao: string;
    };
    condutorActual: {
      id: string;
      nome: string;
      telefone: string;
      email: string | null;
      activo: boolean;
      criadoEm: string;
    } | null;
    pedidoActivo: {
      id: string;
      estado: string;
      origemEndereco: string;
      destinoEndereco: string | null;
      clienteNome: string;
      criadoEm: string;
    } | null;
    resumoPedidos: {
      total: number;
      concluidos: number;
      recusados: number;
      cancelados: number;
    };
    atribuicoes: AtribuicaoHistorico[];
  };
  condutoresEmpresa: CondutorEmpresa[];
};

const LABEL_ESTADO_CAMIAO: Record<
  DetalheCamiaoResposta["camiao"]["estadoDisponibilidade"],
  { texto: string; cor: "verde" | "azul" | "amarelo" | "cinza" | "vermelho" }
> = {
  DISPONIVEL: { texto: "Disponível", cor: "verde" },
  EM_SERVICO: { texto: "Em serviço", cor: "azul" },
  SEM_CONDUTOR: { texto: "Sem condutor", cor: "amarelo" },
  GPS_EXPIRADO: { texto: "GPS expirado", cor: "amarelo" },
  INDISPONIVEL: { texto: "Indisponível", cor: "cinza" },
  INACTIVO: { texto: "Inactivo", cor: "vermelho" },
};

export type ApiBaseGestaoCamioes = "/api/admin" | "/api/empresa";

const EMPRESAS_VAZIO: EmpresaResumo[] = [];

/* ============================================================================
 * Sub-formulário reutilizável para criar novo condutor sem perder dados do camião
 * ========================================================================== */
function SubFormularioNovoCondutor({
  empresaId,
  empresaNome,
  apiBase = "/api/admin",
  aoCriar,
  aoCancelar,
}: {
  empresaId: string;
  empresaNome?: string;
  apiBase?: ApiBaseGestaoCamioes;
  aoCriar: (novo: CondutorEmpresa) => void;
  aoCancelar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  const submeter = async () => {
    setErroMsg("");
    setAGuardar(true);
    try {
      const payload =
        apiBase === "/api/admin"
          ? {
              empresaId,
              nome,
              telefone,
              email: email.trim() || null,
              senha,
            }
          : {
              nome,
              telefone,
              email: email.trim() || null,
              senha,
            };

      const res = await fetch(`${apiBase}/condutores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível registar o condutor.");
        return;
      }
      aoCriar(d.condutor);
    } catch {
      setErroMsg("Erro de rede ao registar condutor.");
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300/80 dark:border-primary-400/30 bg-amber-50/70 dark:bg-primary-400/[0.06] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-amber-500/20 dark:bg-primary-400/20 text-amber-700 dark:text-primary-300 grid place-items-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Registar novo condutor
            </p>
            {empresaNome && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                Empresa vinculada: <b>{empresaNome}</b> · Os dados do camião serão mantidos
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={aoCancelar}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-1"
        >
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Entrada
          rotulo="Nome completo *"
          placeholder="Ex.: Mateus Mondlane"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Entrada
          rotulo="Telefone *"
          placeholder="+258 84 000 0000"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <Entrada
          rotulo="Email (opcional)"
          type="email"
          placeholder="condutor@empresa.co.mz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Entrada
          rotulo="Palavra-passe inicial *"
          type="password"
          placeholder="Mínimo 4 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <AvisoErro>{erroMsg}</AvisoErro>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={aoCancelar}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.06] transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submeter}
          disabled={aGuardar}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary-400 hover:bg-primary-300 text-slate-950 transition disabled:opacity-50"
        >
          <UserCheck className="w-3.5 h-3.5" />
          {aGuardar ? "A registar…" : "Registar e seleccionar"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * Modal 1: Adicionar Camião (com associação de condutor e sub-form inline)
 * ========================================================================== */
export function ModalAdicionarCamiao({
  aberto,
  empresas = EMPRESAS_VAZIO,
  empresaInicialId,
  empresaFixa = null,
  apiBase = "/api/admin",
  aoFechar,
  aoGuardar,
}: {
  aberto: boolean;
  empresas?: EmpresaResumo[];
  empresaInicialId?: string;
  empresaFixa?: EmpresaResumo | null;
  apiBase?: ApiBaseGestaoCamioes;
  aoFechar: () => void;
  aoGuardar: () => Promise<void> | void;
}) {
  const [empresaId, setEmpresaId] = useState("");
  const [matricula, setMatricula] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [tipo, setTipo] = useState("LIGEIRO");
  const [capacidade, setCapacidade] = useState("");
  const [activo, setActivo] = useState(true);
  const [motoristaId, setMotoristaId] = useState("");
  const [motivo, setMotivo] = useState("");

  const [condutores, setCondutores] = useState<CondutorEmpresa[]>([]);
  const [aCarregarCondutores, setACarregarCondutores] = useState(false);
  const [mostrarNovoCondutor, setMostrarNovoCondutor] = useState(false);
  const [sucessoCondutorMsg, setSucessoCondutorMsg] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  const abertoAnteriorRef = useRef(false);

  // Inicializa formulário apenas na transição de fechado -> aberto (não limpa dados ao actualizar lista)
  useEffect(() => {
    const acabouDeAbrir = aberto && !abertoAnteriorRef.current;
    abertoAnteriorRef.current = aberto;
    if (!acabouDeAbrir) return;

    const inicial =
      empresaFixa?.id ||
      empresaInicialId ||
      empresas.find((e) => e.estadoAprovacao === "APROVADA")?.id ||
      empresas[0]?.id ||
      "";
    setEmpresaId(inicial);
    setMatricula("");
    setMarca("");
    setModelo("");
    setTipo("LIGEIRO");
    setCapacidade("");
    setActivo(true);
    setMotoristaId("");
    setMotivo("");
    setMostrarNovoCondutor(false);
    setSucessoCondutorMsg("");
    setErroMsg("");
  }, [aberto, empresaFixa, empresaInicialId, empresas]);

  const carregarCondutoresEmpresa = useCallback(
    async (empId: string) => {
      if (!empId && apiBase === "/api/admin") {
        setCondutores([]);
        return;
      }
      setACarregarCondutores(true);
      try {
        const url =
          apiBase === "/api/admin"
            ? `/api/admin/condutores?empresaId=${encodeURIComponent(empId)}`
            : `/api/empresa/condutores`;
        const res = await fetch(url, { cache: "no-store" });
        const d = await res.json();
        if (res.ok) setCondutores(d.condutores || []);
      } finally {
        setACarregarCondutores(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    if (aberto && (empresaId || apiBase === "/api/empresa")) {
      carregarCondutoresEmpresa(empresaId);
    }
  }, [aberto, empresaId, apiBase, carregarCondutoresEmpresa]);

  if (!aberto) return null;

  const empresaSeleccionada =
    empresaFixa ?? empresas.find((e) => e.id === empresaId);
  const empresaEfectivaId = empresaFixa?.id || empresaId;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg("");
    setAGuardar(true);
    try {
      const payload = {
        ...(apiBase === "/api/admin" ? { empresaId: empresaEfectivaId } : {}),
        matricula,
        marca,
        modelo,
        tipo,
        capacidade: capacidade.trim() || null,
        activo,
        motoristaId: motoristaId || null,
        motivo: motivo.trim() || null,
      };

      const res = await fetch(`${apiBase}/camioes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao registar o camião.");
        return;
      }
      await aoGuardar();
      aoFechar();
    } catch {
      setErroMsg("Erro de rede ao registar camião.");
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-camiao-titulo"
    >
      <div className="w-full max-w-2xl my-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary-400/15 text-amber-700 dark:text-primary-400 grid place-items-center">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 id="modal-add-camiao-titulo" className="text-lg font-extrabold text-slate-900 dark:text-white">
                Adicionar Camião
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {empresaFixa
                  ? `${empresaFixa.nome} · Registe os dados do veículo e associe um condutor.`
                  : "Registe os dados do veículo e associe um condutor da mesma empresa."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar modal"
            className="w-9 h-9 rounded-xl grid place-items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submeter} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Dados do camião */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Dados do camião
            </p>

            {!empresaFixa && (
              <Selector
                rotulo="Empresa proprietária *"
                value={empresaId}
                onChange={(e) => {
                  setEmpresaId(e.target.value);
                  setMotoristaId("");
                  setMostrarNovoCondutor(false);
                  setSucessoCondutorMsg("");
                }}
                required
              >
                <option value="">— Seleccionar empresa —</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome}
                    {emp.estadoAprovacao !== "APROVADA" ? ` (${emp.estadoAprovacao})` : ""}
                  </option>
                ))}
              </Selector>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Entrada
                rotulo="Matrícula *"
                placeholder="Ex.: RBM-401-MC"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                required
              />
              <Selector
                rotulo="Tipo de camião *"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {TIPOS_VEICULO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Selector>
              <Entrada
                rotulo="Marca *"
                placeholder="Ex.: Volvo, Isuzu, Scania"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                required
              />
              <Entrada
                rotulo="Modelo *"
                placeholder="Ex.: FH 460, NQR 500"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                required
              />
              <Entrada
                rotulo="Capacidade técnica (opcional)"
                placeholder="Ex.: Até 3,5 t · Plataforma"
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
              />
              <div className="flex items-end pb-1">
                <label className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Camião activo na frota
                  </span>
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Associação de condutor */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Associação de condutor
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Apenas condutores activos da empresa seleccionada e livres de outro camião podem ser atribuídos.
                </p>
              </div>
              {(empresaEfectivaId || apiBase === "/api/empresa") && (
                <button
                  type="button"
                  onClick={() => setMostrarNovoCondutor((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-400/50 bg-amber-50 dark:bg-primary-400/10 text-amber-800 dark:text-primary-300 hover:bg-amber-100 dark:hover:bg-primary-400/20 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {mostrarNovoCondutor ? "Ocultar formulário" : "Adicionar novo condutor"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Selector
                rotulo={
                  aCarregarCondutores
                    ? "Condutor (a carregar…)"
                    : "Condutor associado (opcional)"
                }
                value={motoristaId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__NOVO__") {
                    setMostrarNovoCondutor(true);
                    return;
                  }
                  setMotoristaId(val);
                }}
                disabled={(!empresaEfectivaId && apiBase === "/api/admin") || aCarregarCondutores}
              >
                <option value="">— Sem condutor por agora —</option>
                {condutores.map((c) => {
                  const motivoBloqueio = !c.activo
                    ? "Inactivo"
                    : c.camiao
                      ? `Ocupado em ${c.camiao.matricula}`
                      : null;
                  return (
                    <option key={c.id} value={c.id} disabled={Boolean(motivoBloqueio)}>
                      {c.nome} · {formatarTelefone(c.telefone)}
                      {motivoBloqueio ? ` (${motivoBloqueio})` : " (Disponível)"}
                    </option>
                  );
                })}
                {(empresaEfectivaId || apiBase === "/api/empresa") && (
                  <option value="__NOVO__">+ Adicionar novo condutor…</option>
                )}
              </Selector>

              <Entrada
                rotulo="Nota / motivo da atribuição (opcional)"
                placeholder="Ex.: Escala inicial da frota"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={!motoristaId}
              />
            </div>

            {sucessoCondutorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sucessoCondutorMsg}</span>
              </div>
            )}

            {mostrarNovoCondutor && (empresaEfectivaId || apiBase === "/api/empresa") && (
              <SubFormularioNovoCondutor
                empresaId={empresaEfectivaId}
                empresaNome={empresaSeleccionada?.nome}
                apiBase={apiBase}
                aoCancelar={() => setMostrarNovoCondutor(false)}
                aoCriar={(novoCondutor) => {
                  setCondutores((prev) =>
                    [...prev.filter((item) => item.id !== novoCondutor.id), novoCondutor].sort(
                      (a, b) => a.nome.localeCompare(b.nome)
                    )
                  );
                  setMotoristaId(novoCondutor.id);
                  setMostrarNovoCondutor(false);
                  setSucessoCondutorMsg(
                    `Condutor ${novoCondutor.nome} registado e seleccionado automaticamente.`
                  );
                }}
              />
            )}

            {!motoristaId && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1120] px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Um camião registado sem condutor permanece na frota, mas{" "}
                  <b>não pode receber solicitações de serviço</b> até ter um condutor activo associado.
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nota: A atribuição administrativa nunca activa automaticamente a disponibilidade nem a partilha de GPS do condutor.
            </p>
          </div>

          <AvisoErro>{erroMsg}</AvisoErro>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
            <Botao type="button" variante="contorno" onClick={aoFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={aGuardar || (apiBase === "/api/admin" && !empresaEfectivaId)}>
              <Plus className="w-4 h-4" />
              {aGuardar ? "A registar…" : "Guardar Camião"}
            </Botao>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
 * Modal 2: Detalhes do Camião, Condutor Actual, Substituição e Histórico
 * ========================================================================== */
export function ModalDetalhesCamiao({
  camiaoId,
  apiBase = "/api/admin",
  aoFechar,
  aoActualizarLista,
}: {
  camiaoId: string | null;
  apiBase?: ApiBaseGestaoCamioes;
  aoFechar: () => void;
  aoActualizarLista: () => Promise<void> | void;
}) {
  const [detalhes, setDetalhes] = useState<DetalheCamiaoResposta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [aba, setAba] = useState<"condutor" | "tecnicos" | "historico">("condutor");
  const [erroMsg, setErroMsg] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");

  // Estado de edição dos dados técnicos
  const [matricula, setMatricula] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [tipo, setTipo] = useState("LIGEIRO");
  const [capacidade, setCapacidade] = useState("");
  const [activo, setActivo] = useState(true);
  const [aGuardarTecnicos, setAGuardarTecnicos] = useState(false);

  // Estado de atribuição/substituição de condutor
  const [motoristaEscolhidoId, setMotoristaEscolhidoId] = useState<string>("");
  const [motivoAtribuicao, setMotivoAtribuicao] = useState("");
  const [aAtribuir, setAAtribuir] = useState(false);
  const [mostrarNovoCondutor, setMostrarNovoCondutor] = useState(false);
  const [confirmarDesassociar, setConfirmarDesassociar] = useState(false);

  const carregarDetalhes = useCallback(async () => {
    if (!camiaoId) return;
    setCarregando(true);
    setErroMsg("");
    try {
      const res = await fetch(`${apiBase}/camioes/${camiaoId}`, { cache: "no-store" });
      const d = (await res.json()) as DetalheCamiaoResposta & { erro?: string };
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar os detalhes do camião.");
        return;
      }
      setDetalhes(d);
      setMatricula(d.camiao.matricula);
      setMarca(d.camiao.marca || "");
      setModelo(d.camiao.modelo || "");
      setTipo(d.camiao.tipo);
      setCapacidade(d.camiao.capacidade || "");
      setActivo(d.camiao.activo);
      setMotoristaEscolhidoId(d.camiao.condutorActual?.id ?? "");
      setConfirmarDesassociar(false);
    } catch {
      setErroMsg("Erro de rede ao carregar detalhes.");
    } finally {
      setCarregando(false);
    }
  }, [camiaoId, apiBase]);

  useEffect(() => {
    if (!camiaoId) {
      setDetalhes(null);
      return;
    }
    setAba("condutor");
    setSucessoMsg("");
    setMotivoAtribuicao("");
    setMostrarNovoCondutor(false);
    carregarDetalhes();
  }, [camiaoId, carregarDetalhes]);

  if (!camiaoId) return null;

  const guardarDadosTecnicos = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg("");
    setSucessoMsg("");
    setAGuardarTecnicos(true);
    try {
      const res = await fetch(`${apiBase}/camioes/${camiaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricula,
          marca,
          modelo,
          tipo,
          capacidade: capacidade.trim() || null,
          activo,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao actualizar dados do camião.");
        return;
      }
      setSucessoMsg("Dados do camião actualizados com sucesso.");
      await Promise.all([carregarDetalhes(), aoActualizarLista()]);
    } finally {
      setAGuardarTecnicos(false);
    }
  };

  const aplicarAtribuicao = async (novoMotoristaId: string | null) => {
    setErroMsg("");
    setSucessoMsg("");
    setAAtribuir(true);
    try {
      const res = await fetch(`${apiBase}/camioes/${camiaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motoristaId: novoMotoristaId,
          motivo: motivoAtribuicao.trim() || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível atribuir o condutor.");
        return;
      }
      setMotivoAtribuicao("");
      setConfirmarDesassociar(false);
      setSucessoMsg(
        novoMotoristaId
          ? "Condutor atribuído ao camião. O histórico anterior foi preservado e a disponibilidade permanece desligada até o condutor activar na sua área."
          : "Condutor desassociado do camião com histórico preservado."
      );
      await Promise.all([carregarDetalhes(), aoActualizarLista()]);
    } finally {
      setAAtribuir(false);
    }
  };

  const c = detalhes?.camiao;
  const dispInfo = c ? LABEL_ESTADO_CAMIAO[c.estadoDisponibilidade] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalhes-camiao-titulo"
    >
      <div className="w-full max-w-3xl my-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-primary-400/15 text-amber-700 dark:text-primary-400 grid place-items-center shrink-0">
              <Truck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="modal-detalhes-camiao-titulo"
                  className="text-lg font-extrabold text-slate-900 dark:text-white truncate"
                >
                  {c ? c.matricula : "Detalhes do Camião"}
                </h2>
                {dispInfo && <Etiqueta cor={dispInfo.cor}>{dispInfo.texto}</Etiqueta>}
              </div>
              {c && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {[c.marca, c.modelo].filter(Boolean).join(" ") || LABEL_VEICULO[c.tipo]} ·{" "}
                  {c.empresa.nome}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar detalhes"
            className="w-9 h-9 rounded-xl grid place-items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação de separadores */}
        {c && (
          <div className="px-6 pt-3 border-b border-slate-200 dark:border-white/10 flex items-center gap-2 overflow-x-auto">
            {(
              [
                { id: "condutor", rotulo: "Condutor & Atribuição", icone: UserCheck },
                { id: "tecnicos", rotulo: "Dados do Camião", icone: Edit3 },
                {
                  id: "historico",
                  rotulo: `Histórico de Atribuições (${c.atribuicoes.length})`,
                  icone: History,
                },
              ] as const
            ).map(({ id, rotulo, icone: Icone }) => {
              const activa = aba === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAba(id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
                    activa
                      ? "border-amber-500 dark:border-primary-400 text-amber-700 dark:text-primary-300"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icone className="w-4 h-4" />
                  <span>{rotulo}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Corpo */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {carregando && !c ? (
            <Carregando texto="A carregar detalhes do camião…" />
          ) : !c ? (
            <AvisoErro>{erroMsg || "Não foi possível carregar o camião."}</AvisoErro>
          ) : (
            <>
              {sucessoMsg && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{sucessoMsg}</span>
                </div>
              )}

              <AvisoErro>{erroMsg}</AvisoErro>

              {/* ================= ABA 1: CONDUTOR & ATRIBUIÇÃO ================= */}
              {aba === "condutor" && (
                <div className="space-y-5">
                  {/* Cartão do condutor actual */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1120] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Condutor actualmente associado
                      </p>
                      {c.condutorActual && (
                        <Etiqueta cor={c.condutorActual.activo ? "verde" : "vermelho"}>
                          {c.condutorActual.activo ? "Conta activa" : "Conta inactiva"}
                        </Etiqueta>
                      )}
                    </div>

                    {c.condutorActual ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-base font-extrabold text-slate-900 dark:text-white">
                              {c.condutorActual.nome}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {formatarTelefone(c.condutorActual.telefone)}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {c.condutorActual.email || "Sem email"}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {c.empresa.nome}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                              Conta criada em {formatarData(c.condutorActual.criadoEm)} ·{" "}
                              {c.estadoDisponibilidade === "EM_SERVICO"
                                ? "Em serviço activo neste momento"
                                : c.disponivel && c.localizacaoValida
                                  ? "Disponível para serviços (GPS activo)"
                                  : c.disponivel
                                    ? "Disponível com GPS expirado (aguarda actualização)"
                                    : "Disponibilidade do condutor desligada"}
                            </p>
                            {(!c.activo || !c.condutorActual.activo || c.empresa.estadoAprovacao !== "APROVADA") && (
                              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                                {!c.activo
                                  ? "Camião desactivado na frota — não recebe solicitações."
                                  : !c.condutorActual.activo
                                    ? "Conta do condutor desactivada — não pode operar."
                                    : "Empresa sem aprovação activa — não recebe solicitações."}
                              </p>
                            )}
                          </div>

                          {!confirmarDesassociar ? (
                            <button
                              type="button"
                              onClick={() => setConfirmarDesassociar(true)}
                              disabled={Boolean(c.pedidoActivo)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 transition"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Desassociar
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => aplicarAtribuicao(null)}
                                disabled={aAtribuir}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition disabled:opacity-50"
                              >
                                {aAtribuir ? "A remover…" : "Confirmar desassociação"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmarDesassociar(false)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-semibold"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Este camião não tem condutor associado neste momento. Permanece registado na empresa{" "}
                          <b>{c.empresa.nome}</b>, mas <b>não recebe solicitações de serviço</b> até ter um condutor atribuído.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Atribuir / Substituir condutor */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {c.condutorActual ? "Atribuir outro condutor" : "Atribuir condutor"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ao substituir, o histórico anterior é encerrado sem eliminar os dados do condutor anterior.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMostrarNovoCondutor((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-400/50 bg-amber-50 dark:bg-primary-400/10 text-amber-800 dark:text-primary-300 hover:bg-amber-100 dark:hover:bg-primary-400/20 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {mostrarNovoCondutor ? "Ocultar formulário" : "Adicionar novo condutor"}
                      </button>
                    </div>

                    {c.pedidoActivo && (
                      <div className="rounded-xl border border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-800 dark:text-sky-300">
                        Este camião tem um serviço activo ({c.pedidoActivo.estado}). Conclua ou cancele o pedido antes de alterar o condutor.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Selector
                        rotulo="Seleccionar condutor da empresa"
                        value={motoristaEscolhidoId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "__NOVO__") {
                            setMostrarNovoCondutor(true);
                            return;
                          }
                          setMotoristaEscolhidoId(val);
                        }}
                        disabled={Boolean(c.pedidoActivo)}
                      >
                        <option value="">— Seleccionar condutor —</option>
                        {detalhes.condutoresEmpresa.map((cond) => {
                          const ocupadoOutro =
                            cond.camiao && cond.camiao.id !== c.id ? cond.camiao.matricula : null;
                          const inactivo = !cond.activo;
                          const bloqueado = inactivo || Boolean(ocupadoOutro);
                          return (
                            <option key={cond.id} value={cond.id} disabled={bloqueado}>
                              {cond.nome} · {formatarTelefone(cond.telefone)}
                              {inactivo
                                ? " (Inactivo)"
                                : ocupadoOutro
                                  ? ` (Ocupado em ${ocupadoOutro})`
                                  : cond.id === c.condutorActual?.id
                                    ? " (Actual)"
                                    : " (Livre)"}
                            </option>
                          );
                        })}
                        <option value="__NOVO__">+ Adicionar novo condutor…</option>
                      </Selector>

                      <Entrada
                        rotulo="Motivo da atribuição / substituição"
                        placeholder="Ex.: Troca de turno ou nova escala"
                        value={motivoAtribuicao}
                        onChange={(e) => setMotivoAtribuicao(e.target.value)}
                        disabled={Boolean(c.pedidoActivo)}
                      />
                    </div>

                    {mostrarNovoCondutor && (
                      <SubFormularioNovoCondutor
                        empresaId={c.empresaId}
                        empresaNome={c.empresa.nome}
                        apiBase={apiBase}
                        aoCancelar={() => setMostrarNovoCondutor(false)}
                        aoCriar={(novoCondutor) => {
                          setDetalhes((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  condutoresEmpresa: [
                                    ...prev.condutoresEmpresa.filter((item) => item.id !== novoCondutor.id),
                                    novoCondutor,
                                  ].sort((a, b) => a.nome.localeCompare(b.nome)),
                                }
                              : prev
                          );
                          setMotoristaEscolhidoId(novoCondutor.id);
                          setMostrarNovoCondutor(false);
                          setSucessoMsg(
                            `Condutor ${novoCondutor.nome} registado. Clique em "Confirmar atribuição" para associá-lo ao camião.`
                          );
                        }}
                      />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        Disponibilidade do novo condutor permanece desligada até ele activar o GPS.
                      </span>
                      <Botao
                        type="button"
                        onClick={() => aplicarAtribuicao(motoristaEscolhidoId || null)}
                        disabled={
                          aAtribuir ||
                          Boolean(c.pedidoActivo) ||
                          !motoristaEscolhidoId ||
                          motoristaEscolhidoId === (c.condutorActual?.id ?? "")
                        }
                      >
                        <RefreshCw className="w-4 h-4" />
                        {aAtribuir ? "A atribuir…" : "Confirmar atribuição"}
                      </Botao>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= ABA 2: DADOS TÉCNICOS ================= */}
              {aba === "tecnicos" && (
                <form onSubmit={guardarDadosTecnicos} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Entrada
                      rotulo="Matrícula *"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                      required
                    />
                    <Selector
                      rotulo="Tipo de camião *"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                    >
                      {TIPOS_VEICULO.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Selector>
                    <Entrada
                      rotulo="Marca *"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      required
                    />
                    <Entrada
                      rotulo="Modelo *"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      required
                    />
                    <Entrada
                      rotulo="Capacidade técnica"
                      value={capacidade}
                      onChange={(e) => setCapacidade(e.target.value)}
                      placeholder="Ex.: Até 3,5 t"
                    />
                    <div className="flex flex-col justify-end pb-1 gap-1">
                      <label
                        className={`w-full min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-between gap-3 ${
                          c.pedidoActivo ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Camião activo
                        </span>
                        <input
                          type="checkbox"
                          checked={activo}
                          disabled={Boolean(c.pedidoActivo && activo)}
                          onChange={(e) => setActivo(e.target.checked)}
                          className="w-4 h-4 accent-amber-500"
                        />
                      </label>
                      {c.pedidoActivo && activo && (
                        <span className="text-[11px] text-sky-600 dark:text-sky-400">
                          Não pode desactivar enquanto há um pedido activo ({c.pedidoActivo.estado}).
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1120] p-3.5 text-xs">
                    <div>
                      <p className="text-slate-500">Total de pedidos</p>
                      <p className="text-base font-extrabold">{c.resumoPedidos.total}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Concluídos</p>
                      <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {c.resumoPedidos.concluidos}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Recusados</p>
                      <p className="text-base font-extrabold">{c.resumoPedidos.recusados}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Cancelados</p>
                      <p className="text-base font-extrabold">{c.resumoPedidos.cancelados}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Botao type="submit" disabled={aGuardarTecnicos}>
                      {aGuardarTecnicos ? "A guardar…" : "Guardar alterações do camião"}
                    </Botao>
                  </div>
                </form>
              )}

              {/* ================= ABA 3: HISTÓRICO DE ATRIBUIÇÕES ================= */}
              {aba === "historico" && (
                <div className="space-y-3">
                  {c.atribuicoes.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center text-sm text-slate-500">
                      Ainda não existem registos de atribuição para este camião.
                    </div>
                  ) : (
                    c.atribuicoes.map((item) => {
                      const vigente = !item.fimEm;
                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-4 space-y-1.5 ${
                            vigente
                              ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20"
                              : "border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#0B1120]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.motorista.nome}
                              </span>
                              <Etiqueta cor={vigente ? "verde" : "cinza"}>
                                {vigente ? "Em vigor" : "Encerrada"}
                              </Etiqueta>
                              {!item.motorista.activo && (
                                <Etiqueta cor="vermelho">Condutor inactivo</Etiqueta>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatarTelefone(item.motorista.telefone)}
                              {item.motorista.email ? ` · ${item.motorista.email}` : ""}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Início: {formatarDataHora(item.inicioEm)}
                            </span>
                            <span>
                              Fim: {item.fimEm ? formatarDataHora(item.fimEm) : "Actualmente atribuído"}
                            </span>
                            {item.atribuidoPor && (
                              <span>Atribuído por: {item.atribuidoPor.nome}</span>
                            )}
                          </div>

                          {item.motivo && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Motivo: {item.motivo}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
