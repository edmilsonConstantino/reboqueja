"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Eye,
  MapPin,
  Plus,
  Power,
  RefreshCw,
  Search,
  Truck,
  User,
  UserX,
} from "lucide-react";
import { Mapa, type MarcadorMapa } from "@/components/Mapa";
import { usarTema } from "@/components/ProvedorTema";
import {
  ModalAdicionarCamiao,
  ModalDetalhesCamiao,
} from "@/components/AdminGestaoCamioesModal";
import { AvisoErro, Cartao, Carregando, Etiqueta, Selector, Vazio } from "@/components/ui";
import { CENTRO_MATOLA, ESTADOS_PEDIDO } from "@/lib/constants";
import { LABEL_ESTADO, LABEL_VEICULO } from "@/lib/constants-client";
import { formatarDataHora, formatarTelefone } from "@/lib/format";

type VeiculoFrota = {
  id: string;
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
  empresa: { id: string; nome: string; estadoAprovacao: string };
  condutor: {
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
    activo: boolean;
  } | null;
  totalAtribuicoes: number;
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
};

type RespostaFrota = {
  veiculos: VeiculoFrota[];
  resumo: {
    totalVeiculos: number;
    disponiveis: number;
    emServico: number;
    semCondutor: number;
    indisponiveis: number;
    comLocalizacaoActiva: number;
  };
  empresas: { id: string; nome: string; estadoAprovacao: string }[];
};

const LABEL_DISPONIBILIDADE: Record<
  VeiculoFrota["estadoDisponibilidade"],
  { texto: string; cor: "verde" | "azul" | "amarelo" | "cinza" | "vermelho" }
> = {
  DISPONIVEL: { texto: "Disponível", cor: "verde" },
  EM_SERVICO: { texto: "Em serviço", cor: "azul" },
  SEM_CONDUTOR: { texto: "Sem condutor", cor: "amarelo" },
  GPS_EXPIRADO: { texto: "GPS expirado", cor: "amarelo" },
  INDISPONIVEL: { texto: "Indisponível", cor: "cinza" },
  INACTIVO: { texto: "Inactivo", cor: "vermelho" },
};

export default function AdminFrota() {
  const { tema } = usarTema();
  const [dados, setDados] = useState<RespostaFrota | null>(null);
  const [empresaId, setEmpresaId] = useState("");
  const [estadoDisp, setEstadoDisp] = useState("");
  const [estadoServ, setEstadoServ] = useState("");
  const [termo, setTermo] = useState("");
  const [focoId, setFocoId] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [camiaoDetalhesId, setCamiaoDetalhesId] = useState<string | null>(null);
  const [aAlternarId, setAAlternarId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (empresaId) qs.set("empresaId", empresaId);
      if (estadoDisp) qs.set("estadoDisponibilidade", estadoDisp);
      if (estadoServ) qs.set("estadoServico", estadoServ);
      const res = await fetch(`/api/admin/frota?${qs.toString()}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar gestão de camiões.");
        return;
      }
      setErroMsg("");
      setDados(d);
    } catch {
      setErroMsg("Erro de rede.");
    }
  }, [empresaId, estadoDisp, estadoServ]);

  useEffect(() => {
    carregar();
    if (modalAdicionarAberto || camiaoDetalhesId) return;
    const t = setInterval(carregar, 10000);
    return () => clearInterval(t);
  }, [carregar, modalAdicionarAberto, camiaoDetalhesId]);

  const veiculosVisiveis = useMemo(() => {
    const lista = dados?.veiculos ?? [];
    const t = termo.trim().toLowerCase();
    if (!t) return lista;
    return lista.filter((v) =>
      [
        v.matricula,
        v.marca ?? "",
        v.modelo ?? "",
        v.empresa.nome,
        v.condutor?.nome ?? "",
        v.condutor?.telefone ?? "",
      ].some((campo) => campo.toLowerCase().includes(t))
    );
  }, [dados, termo]);

  const marcadores = useMemo<MarcadorMapa[]>(() => {
    return veiculosVisiveis
      .filter(
        (v): v is VeiculoFrota & { lat: number; lng: number } =>
          v.gpsActivo && v.lat !== null && v.lng !== null
      )
      .map((v) => ({
        id: v.id,
        pos: { lat: v.lat, lng: v.lng },
        emoji: "🚚",
        cor:
          v.estadoDisponibilidade === "EM_SERVICO"
            ? "#0EA5E9"
            : v.estadoDisponibilidade === "DISPONIVEL"
              ? "#10B981"
              : "#F59E0B",
        pulso: v.id === focoId || v.estadoDisponibilidade === "DISPONIVEL",
        titulo: `${v.matricula} · ${v.condutor?.nome ?? "Sem condutor"} (${v.empresa.nome})`,
        aoClicar: () => setFocoId(v.id),
      }));
  }, [veiculosVisiveis, focoId]);

  const focado = useMemo(
    () => veiculosVisiveis.find((v) => v.id === focoId) ?? null,
    [veiculosVisiveis, focoId]
  );

  const alternarActivo = async (v: VeiculoFrota) => {
    setAAlternarId(v.id);
    setErroMsg("");
    try {
      const res = await fetch(`/api/admin/camioes/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !v.activo }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao alterar o estado do camião.");
        return;
      }
      await carregar();
    } finally {
      setAAlternarId(null);
    }
  };

  if (!dados) {
    return (
      <div className="p-6">
        {erroMsg ? <Vazio titulo="Erro" descricao={erroMsg} /> : <Carregando />}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-primary-400/15 text-amber-700 dark:text-primary-400 grid place-items-center ring-1 ring-primary-400/25">
            <Truck className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Gestão de Camiões
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Registo de frota, associação de condutores, histórico de atribuições e localização em tempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={carregar}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] text-sm font-semibold hover:border-amber-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            onClick={() => setModalAdicionarAberto(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-400 hover:bg-primary-300 text-slate-950 text-sm font-extrabold shadow-card transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar Camião</span>
          </button>
        </div>
      </div>

      <AvisoErro>{erroMsg}</AvisoErro>

      {/* Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Cartao className="p-4">
          <p className="text-xs text-neutral-500">Total de camiões</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {dados.resumo.totalVeiculos}
          </p>
        </Cartao>
        <Cartao className="p-4">
          <p className="text-xs text-neutral-500">Disponíveis</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {dados.resumo.disponiveis}
          </p>
        </Cartao>
        <Cartao className="p-4">
          <p className="text-xs text-neutral-500">Em serviço</p>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
            {dados.resumo.emServico}
          </p>
        </Cartao>
        <Cartao className="p-4">
          <p className="text-xs text-neutral-500">Sem condutor</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {dados.resumo.semCondutor}
          </p>
        </Cartao>
        <Cartao className="p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-neutral-500">Com GPS activo</p>
          <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">
            {dados.resumo.comLocalizacaoActiva}
          </p>
        </Cartao>
      </div>

      {/* Filtros e Pesquisa */}
      <Cartao className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
            Pesquisar camião ou condutor
          </span>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Matrícula, marca, modelo ou condutor…"
              className="w-full min-h-[48px] pl-10 pr-3 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </label>

        <Selector rotulo="Empresa" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
          <option value="">Todas as empresas</option>
          {dados.empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </Selector>

        <Selector
          rotulo="Estado operacional"
          value={estadoDisp}
          onChange={(e) => setEstadoDisp(e.target.value)}
        >
          <option value="">Todos os estados</option>
          <option value="DISPONIVEL">Disponível</option>
          <option value="EM_SERVICO">Em serviço</option>
          <option value="SEM_CONDUTOR">Sem condutor</option>
          <option value="INDISPONIVEL">Indisponível</option>
          <option value="GPS_EXPIRADO">GPS expirado</option>
          <option value="INACTIVO">Inactivo</option>
        </Selector>

        <Selector
          rotulo="Serviço activo"
          value={estadoServ}
          onChange={(e) => setEstadoServ(e.target.value)}
        >
          <option value="">Todos</option>
          {ESTADOS_PEDIDO.filter((s) =>
            ["PENDENTE", "ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"].includes(s)
          ).map((s) => (
            <option key={s} value={s}>
              {LABEL_ESTADO[s] || s}
            </option>
          ))}
        </Selector>
      </Cartao>

      {/* Listagem estruturada de camiões */}
      <Cartao className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-sm text-slate-900 dark:text-white">
            Frota registada ({veiculosVisiveis.length})
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clique em <b>Detalhes</b> para ver o condutor associado, substituir condutor ou consultar o histórico.
          </p>
        </div>

        {veiculosVisiveis.length === 0 ? (
          <Vazio
            titulo="Sem camiões correspondentes"
            descricao="Ajuste os filtros ou adicione um novo camião à frota."
            accao={
              <button
                type="button"
                onClick={() => setModalAdicionarAberto(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-400 hover:bg-primary-300 text-slate-950 text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                Adicionar Camião
              </button>
            }
          />
        ) : (
          <>
            {/* Cabeçalho desktop */}
            <div className="hidden lg:grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.07]">
              <span>Matrícula</span>
              <span>Marca e modelo</span>
              <span>Empresa</span>
              <span>Estado</span>
              <span>Condutor associado</span>
              <span className="text-right">Acções</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-white/[0.07]">
              {veiculosVisiveis.map((v) => {
                const disp = LABEL_DISPONIBILIDADE[v.estadoDisponibilidade];
                const marcaModelo = [v.marca, v.modelo].filter(Boolean).join(" ");
                return (
                  <div
                    key={v.id}
                    className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-x-4 gap-y-3 items-center px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition"
                  >
                    {/* Matrícula */}
                    <div className="min-w-0">
                      <p className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                        {v.matricula}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {LABEL_VEICULO[v.tipo] || v.tipo}
                        {v.capacidade ? ` · ${v.capacidade}` : ""}
                      </p>
                    </div>

                    {/* Marca e modelo */}
                    <div className="min-w-0">
                      <span className="lg:hidden text-[11px] uppercase tracking-wide text-slate-400 block">
                        Marca e modelo
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {marcaModelo || "Marca/modelo por definir"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {v.gpsActivo && v.lat !== null && v.lng !== null
                          ? `GPS activo · ${v.localizacaoActualizadaEm ? formatarDataHora(v.localizacaoActualizadaEm) : ""}`
                          : "Sem GPS activo"}
                      </p>
                    </div>

                    {/* Empresa */}
                    <div className="min-w-0">
                      <span className="lg:hidden text-[11px] uppercase tracking-wide text-slate-400 block">
                        Empresa
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 truncate max-w-full">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{v.empresa.nome}</span>
                      </p>
                    </div>

                    {/* Estado */}
                    <div>
                      <span className="lg:hidden text-[11px] uppercase tracking-wide text-slate-400 block mb-1">
                        Estado
                      </span>
                      <Etiqueta cor={disp.cor}>{disp.texto}</Etiqueta>
                      {v.pedidoActivo && (
                        <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mt-1 truncate">
                          {LABEL_ESTADO[v.pedidoActivo.estado] || v.pedidoActivo.estado}: {v.pedidoActivo.clienteNome}
                        </p>
                      )}
                    </div>

                    {/* Condutor actualmente associado */}
                    <div className="min-w-0">
                      <span className="lg:hidden text-[11px] uppercase tracking-wide text-slate-400 block">
                        Condutor associado
                      </span>
                      {v.condutor ? (
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1.5 truncate max-w-full">
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{v.condutor.nome}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {formatarTelefone(v.condutor.telefone)}
                            {!v.condutor.activo
                              ? " · Conta inactiva"
                              : v.estadoDisponibilidade === "EM_SERVICO"
                                ? " · Em serviço"
                                : v.disponivel && v.localizacaoValida
                                  ? " · Disponível"
                                  : v.disponivel
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

                    {/* Acções disponíveis */}
                    <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCamiaoDetalhesId(v.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#0B1120] hover:border-amber-400 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-primary-400" />
                        <span>Detalhes</span>
                      </button>

                      {v.gpsActivo && (
                        <button
                          type="button"
                          onClick={() => setFocoId(v.id)}
                          title="Localizar no mapa"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-400/40 text-amber-700 dark:text-primary-300 text-xs font-semibold hover:bg-primary-400/10 transition"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Mapa</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => alternarActivo(v)}
                        disabled={aAlternarId === v.id || v.estadoDisponibilidade === "EM_SERVICO"}
                        title={v.activo ? "Desactivar camião" : "Activar camião"}
                        aria-label={v.activo ? "Desactivar camião" : "Activar camião"}
                        className={`w-9 h-9 rounded-xl grid place-items-center border transition disabled:opacity-40 ${
                          v.activo
                            ? "border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                            : "border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Cartao>

      {/* Mapa ao vivo */}
      <Cartao className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-sm">
            Mapa de localização activa ({marcadores.length} camião(ões) com GPS activo)
          </p>
          {focado && (
            <p className="text-xs text-neutral-500">
              Seleccionado: <b>{focado.matricula}</b> ·{" "}
              {focado.condutor?.nome ?? "Sem condutor"} ({focado.empresa.nome})
            </p>
          )}
        </div>
        <div className="relative h-[320px]">
          <Mapa
            centro={
              focado?.gpsActivo && focado.lat !== null && focado.lng !== null
                ? { lat: focado.lat, lng: focado.lng }
                : CENTRO_MATOLA
            }
            zoom={12}
            marcadores={marcadores}
            encaixarEm={marcadores.length > 0 && !focado}
            poligonoMatola
            escuro={tema === "escuro"}
            controlos
            className="absolute inset-0"
          />
          {marcadores.length === 0 && (
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 sm:right-auto rounded-xl bg-white/95 dark:bg-neutral-900/95 px-3 py-2 text-xs font-medium shadow">
              Nenhum camião está a partilhar localização activa neste momento.
            </div>
          )}
        </div>
      </Cartao>

      {/* Modais */}
      <ModalAdicionarCamiao
        aberto={modalAdicionarAberto}
        empresas={dados.empresas}
        empresaInicialId={empresaId || undefined}
        aoFechar={() => setModalAdicionarAberto(false)}
        aoGuardar={carregar}
      />

      <ModalDetalhesCamiao
        camiaoId={camiaoDetalhesId}
        aoFechar={() => setCamiaoDetalhesId(null)}
        aoActualizarLista={carregar}
      />
    </div>
  );
}
