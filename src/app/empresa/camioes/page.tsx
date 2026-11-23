"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Truck,
  User,
  UserX,
} from "lucide-react";
import {
  ModalAdicionarCamiao,
  ModalDetalhesCamiao,
  type EmpresaResumo,
} from "@/components/AdminGestaoCamioesModal";
import {
  AvisoErro,
  Botao,
  Carregando,
  Cartao,
  Etiqueta,
  Vazio,
} from "@/components/ui";
import { LABEL_ESTADO, LABEL_VEICULO } from "@/lib/constants-client";
import { formatarDataHora, formatarTelefone } from "@/lib/format";

type CamiaoEmpresa = {
  id: string;
  matricula: string;
  marca: string | null;
  modelo: string | null;
  tipo: string;
  capacidade: string | null;
  motoristaNome: string;
  motoristaTelefone: string;
  activo: boolean;
  disponivel: boolean;
  localizacaoValida: boolean;
  gpsActivo: boolean;
  localizacaoActualizadaEm: string | null;
  estadoDisponibilidade:
    | "DISPONIVEL"
    | "EM_SERVICO"
    | "INDISPONIVEL"
    | "GPS_EXPIRADO"
    | "SEM_CONDUTOR"
    | "INACTIVO";
  totalAtribuicoes: number;
  pedidoActivo: {
    id: string;
    estado: string;
    clienteNome: string;
  } | null;
  motorista: {
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
    activo: boolean;
  } | null;
};

const LABEL_DISPONIBILIDADE: Record<
  CamiaoEmpresa["estadoDisponibilidade"],
  { texto: string; cor: "verde" | "azul" | "amarelo" | "cinza" | "vermelho" }
> = {
  DISPONIVEL: { texto: "Disponível", cor: "verde" },
  EM_SERVICO: { texto: "Em serviço", cor: "azul" },
  SEM_CONDUTOR: { texto: "Sem condutor", cor: "amarelo" },
  GPS_EXPIRADO: { texto: "GPS expirado", cor: "amarelo" },
  INDISPONIVEL: { texto: "Indisponível", cor: "cinza" },
  INACTIVO: { texto: "Inactivo", cor: "vermelho" },
};

export default function Camioes() {
  const [empresa, setEmpresa] = useState<EmpresaResumo | null>(null);
  const [camioes, setCamioes] = useState<CamiaoEmpresa[] | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [camiaoDetalhesId, setCamiaoDetalhesId] = useState<string | null>(null);
  const [aAlternarId, setAAlternarId] = useState<string | null>(null);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null);
  const [aEliminarId, setAEliminarId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/empresa/camioes", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível carregar os camiões.");
        return;
      }
      setEmpresa(d.empresa ?? null);
      setCamioes(d.camioes || []);
    } catch {
      setErroMsg("Erro de rede ao carregar camiões.");
    }
  }, []);

  useEffect(() => {
    carregar();
    if (modalAdicionarAberto || camiaoDetalhesId || confirmarEliminarId) return;
    const t = setInterval(carregar, 12000);
    return () => clearInterval(t);
  }, [carregar, modalAdicionarAberto, camiaoDetalhesId, confirmarEliminarId]);

  const alternarActivo = async (c: CamiaoEmpresa) => {
    setErroMsg("");
    setAAlternarId(c.id);
    try {
      const res = await fetch("/api/empresa/camioes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, activo: !c.activo }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível alterar o estado do camião.");
        return;
      }
      await carregar();
    } catch {
      setErroMsg("Erro de rede ao actualizar estado do camião.");
    } finally {
      setAAlternarId(null);
    }
  };

  const eliminar = async (id: string) => {
    setErroMsg("");
    setAEliminarId(id);
    try {
      const res = await fetch(`/api/empresa/camioes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível eliminar o camião.");
        return;
      }
      setConfirmarEliminarId(null);
      await carregar();
    } catch {
      setErroMsg("Erro de rede ao eliminar camião.");
    } finally {
      setAEliminarId(null);
    }
  };

  if (!camioes) {
    return (
      <div className="p-6">
        {erroMsg ? <AvisoErro>{erroMsg}</AvisoErro> : <Carregando />}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Cabeçalho com botão Adicionar Camião */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="w-11 h-11 shrink-0 rounded-2xl bg-primary-400/15 text-amber-700 dark:text-primary-400 grid place-items-center ring-1 ring-primary-400/25">
            <Truck className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Camiões
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {empresa?.nome ? `${empresa.nome} · ` : ""}
              {camioes.length} camião(ões) registado(s) na frota.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={carregar}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] text-sm font-semibold hover:border-amber-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <Botao
            type="button"
            onClick={() => {
              setErroMsg("");
              setModalAdicionarAberto(true);
            }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar Camião</span>
          </Botao>
        </div>
      </div>

      <AvisoErro>{erroMsg}</AvisoErro>

      {/* Listagem */}
      <Cartao className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-sm text-slate-900 dark:text-white">
            Frota da empresa ({camioes.length})
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clique em <b>Detalhes</b> para gerir o condutor, consultar o histórico de atribuições ou editar o veículo.
          </p>
        </div>

        {camioes.length === 0 ? (
          <Vazio
            titulo="Ainda não tem camiões registados"
            descricao="Adicione o primeiro camião da sua empresa e associe um condutor activo para começar a receber pedidos."
            accao={
              <Botao
                type="button"
                onClick={() => {
                  setErroMsg("");
                  setModalAdicionarAberto(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Camião
              </Botao>
            }
          />
        ) : (
          <>
            {/* Cabeçalho desktop */}
            <div className="hidden md:grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.07]">
              <span>Matrícula</span>
              <span>Marca e modelo</span>
              <span>Estado</span>
              <span>Condutor associado</span>
              <span className="text-right">Acções</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-white/[0.07]">
              {camioes.map((c) => {
                const disp = LABEL_DISPONIBILIDADE[c.estadoDisponibilidade];
                const marcaModelo = [c.marca, c.modelo].filter(Boolean).join(" ");
                const temPedidoActivo = Boolean(c.pedidoActivo);

                return (
                  <div
                    key={c.id}
                    className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-x-4 gap-y-3 items-center px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition"
                  >
                    {/* Matrícula e tipo */}
                    <div className="min-w-0">
                      <p className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                        {c.matricula}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {LABEL_VEICULO[c.tipo] || c.tipo}
                        {c.capacidade ? ` · ${c.capacidade}` : ""}
                      </p>
                    </div>

                    {/* Marca e modelo */}
                    <div className="min-w-0">
                      <span className="md:hidden text-[11px] uppercase tracking-wide text-slate-400 block">
                        Marca e modelo
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {marcaModelo || "Marca/modelo por definir"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {c.gpsActivo
                          ? `GPS activo${c.localizacaoActualizadaEm ? ` · ${formatarDataHora(c.localizacaoActualizadaEm)}` : ""}`
                          : "Sem GPS activo"}
                      </p>
                    </div>

                    {/* Estado */}
                    <div>
                      <span className="md:hidden text-[11px] uppercase tracking-wide text-slate-400 block mb-1">
                        Estado
                      </span>
                      <Etiqueta cor={disp.cor}>{disp.texto}</Etiqueta>
                      {c.pedidoActivo && (
                        <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-1 truncate">
                          {LABEL_ESTADO[c.pedidoActivo.estado] || c.pedidoActivo.estado}:{" "}
                          {c.pedidoActivo.clienteNome}
                        </p>
                      )}
                    </div>

                    {/* Condutor actualmente associado */}
                    <div className="min-w-0">
                      <span className="md:hidden text-[11px] uppercase tracking-wide text-slate-400 block">
                        Condutor associado
                      </span>
                      {c.motorista ? (
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1.5 truncate max-w-full">
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{c.motorista.nome}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {formatarTelefone(c.motorista.telefone)}
                            {!c.motorista.activo
                              ? " · Conta inactiva"
                              : c.estadoDisponibilidade === "EM_SERVICO"
                                ? " · Em serviço"
                                : c.disponivel && c.localizacaoValida
                                  ? " · Disponível"
                                  : c.disponivel
                                    ? " · GPS expirado"
                                    : " · Indisponível"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1.5">
                          <UserX className="w-3.5 h-3.5 shrink-0" />
                          <span>Sem condutor associado</span>
                        </p>
                      )}
                    </div>

                    {/* Acções */}
                    <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCamiaoDetalhesId(c.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1120] hover:border-amber-400 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-primary-400" />
                        <span>Detalhes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => alternarActivo(c)}
                        disabled={
                          aAlternarId === c.id ||
                          c.estadoDisponibilidade === "EM_SERVICO" ||
                          (c.activo && temPedidoActivo)
                        }
                        title={c.activo ? "Desactivar camião" : "Activar camião"}
                        aria-label={c.activo ? "Desactivar camião" : "Activar camião"}
                        className={`w-9 h-9 rounded-xl grid place-items-center border transition disabled:opacity-40 ${
                          c.activo
                            ? "border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                            : "border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {confirmarEliminarId === c.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => eliminar(c.id)}
                            disabled={aEliminarId === c.id}
                            className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition disabled:opacity-50"
                          >
                            {aEliminarId === c.id ? "…" : "Confirmar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmarEliminarId(null)}
                            className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-semibold"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmarEliminarId(c.id)}
                          disabled={temPedidoActivo}
                          title="Eliminar camião"
                          aria-label="Eliminar camião"
                          className="w-9 h-9 rounded-xl grid place-items-center border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Cartao>

      {/* Modal Adicionar Camião */}
      <ModalAdicionarCamiao
        aberto={modalAdicionarAberto}
        empresaFixa={empresa}
        apiBase="/api/empresa"
        aoFechar={() => setModalAdicionarAberto(false)}
        aoGuardar={carregar}
      />

      {/* Modal Detalhes, Condutor e Histórico */}
      <ModalDetalhesCamiao
        camiaoId={camiaoDetalhesId}
        apiBase="/api/empresa"
        aoFechar={() => setCamiaoDetalhesId(null)}
        aoActualizarLista={carregar}
      />
    </div>
  );
}
