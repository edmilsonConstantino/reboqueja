"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usarTema, type Tema } from "@/components/ProvedorTema";

type Sessao = { logado: boolean; nome?: string; telefone?: string; papel?: string };

const ROTULO_PAPEL: Record<string, string> = {
  CLIENTE: "Cliente",
  CONDUTOR: "Condutor",
  EMPRESA: "Empresa",
  ADMIN: "Administrador",
};

export default function AdminDefinicoes() {
  const { tema, definir } = usarTema();
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);

  const [actual, setActual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [aGravar, setAGravar] = useState(false);
  const [aSair, setASair] = useState(false);

  useEffect(() => {
    fetch("/api/sessao", { cache: "no-store" })
      .then((r) => r.json())
      .then(setSessao)
      .catch(() => setSessao({ logado: false }));
  }, []);

  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg("");
    setSucesso("");

    if (nova.length < 4) {
      setErroMsg("A nova palavra-passe deve ter pelo menos 4 caracteres.");
      return;
    }
    if (nova !== confirmar) {
      setErroMsg("A confirmação não corresponde à nova palavra-passe.");
      return;
    }

    setAGravar(true);
    try {
      const res = await fetch("/api/minha-conta/senha", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nova }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível alterar a palavra-passe.");
        return;
      }
      setSucesso(d.mensagem || "Palavra-passe alterada com sucesso.");
      setActual("");
      setNova("");
      setConfirmar("");
    } catch {
      setErroMsg("Erro de rede. Tente novamente.");
    } finally {
      setAGravar(false);
    }
  };

  const sair = async () => {
    setASair(true);
    try {
      await fetch("/api/sair", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setASair(false);
    }
  };

  const opcoesTema: { valor: Tema; rotulo: string; detalhe: string; icone: React.ReactNode }[] = [
    {
      valor: "claro",
      rotulo: "Modo claro",
      detalhe: "Fundo claro, ideal para ambientes bem iluminados.",
      icone: <IconeSol className="w-5 h-5" />,
    },
    {
      valor: "escuro",
      rotulo: "Modo escuro",
      detalhe: "Fundo escuro, mais confortável à noite.",
      icone: <IconeLua className="w-5 h-5" />,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <span className="w-14 h-14 shrink-0 rounded-2xl bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center ring-1 ring-primary-400/25">
          <IconeEngrenagem className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Definições</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Aparência do painel, dados da conta e segurança.
          </p>
        </div>
      </div>

      {/* Aparência */}
      <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] p-5">
        <h2 className="font-bold">Aparência</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Escolha o tema do painel. A preferência fica guardada neste dispositivo.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {opcoesTema.map((o) => {
            const activo = tema === o.valor;
            return (
              <button
                key={o.valor}
                type="button"
                onClick={() => definir(o.valor)}
                aria-pressed={activo}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition min-h-[76px] ${
                  activo
                    ? "border-primary-400 bg-primary-400/10"
                    : "border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                }`}
              >
                <span
                  className={`w-9 h-9 shrink-0 rounded-lg grid place-items-center ${
                    activo
                      ? "bg-primary-400 text-neutral-950"
                      : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {o.icone}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    {o.rotulo}
                    {activo && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                        activo
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {o.detalhe}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Conta */}
      <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] p-5">
        <h2 className="font-bold">A minha conta</h2>
        <dl className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
          <Campo rotulo="Nome" valor={sessao?.nome || "…"} />
          <Campo rotulo="Perfil" valor={sessao?.papel ? ROTULO_PAPEL[sessao.papel] ?? sessao.papel : "…"} />
          <Campo rotulo="Telefone" valor={sessao?.telefone || "—"} />
          <Campo rotulo="Acesso" valor="Painel de administração" />
        </dl>
      </section>

      {/* Segurança */}
      <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] p-5">
        <h2 className="font-bold">Alterar palavra-passe</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Use pelo menos 4 caracteres. A nova palavra-passe passa a valer no próximo início de sessão.
        </p>

        <form onSubmit={alterarSenha} className="mt-4 space-y-4">
          <CampoPassword
            rotulo="Palavra-passe actual"
            value={actual}
            onChange={setActual}
            autoComplete="current-password"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <CampoPassword
              rotulo="Nova palavra-passe"
              value={nova}
              onChange={setNova}
              autoComplete="new-password"
            />
            <CampoPassword
              rotulo="Repetir nova palavra-passe"
              value={confirmar}
              onChange={setConfirmar}
              autoComplete="new-password"
            />
          </div>

          {erroMsg && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-300">
              {erroMsg}
            </p>
          )}
          {sucesso && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
              ✅ {sucesso}
            </p>
          )}

          <button
            type="submit"
            disabled={aGravar || !actual || !nova || !confirmar}
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-primary-400 text-neutral-950 text-sm font-bold hover:bg-primary-300 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {aGravar ? "A guardar…" : "Guardar nova palavra-passe"}
          </button>
        </form>
      </section>

      {/* Sessão */}
      <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Sessão</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Terminar sessão neste dispositivo.
          </p>
        </div>
        <button
          onClick={sair}
          disabled={aSair}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-500/10 transition disabled:opacity-50"
        >
          <IconeSair className="w-4 h-4" />
          {aSair ? "A sair…" : "Terminar sessão"}
        </button>
      </section>
    </div>
  );
}

/* ===== Auxiliares ===== */

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {rotulo}
      </dt>
      <dd className="text-sm font-semibold mt-0.5 truncate">{valor}</dd>
    </div>
  );
}

function CampoPassword({
  rotulo,
  value,
  onChange,
  autoComplete,
}: {
  rotulo: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
        {rotulo}
      </span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full min-h-[48px] px-4 rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
      />
    </label>
  );
}

/* ===== Ícones ===== */

type P = React.SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconeEngrenagem(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15.1 4.7a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.1c0 .68.4 1.3 1.03 1.56H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.34Z" />
    </svg>
  );
}
function IconeSol(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function IconeLua(props: P) {
  return (
    <svg aria-hidden {...base} {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function IconeSair(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
