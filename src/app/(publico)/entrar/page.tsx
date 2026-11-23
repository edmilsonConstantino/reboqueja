"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Car,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
import { AvisoErro } from "@/components/ui";

const CONTACTO_GUARDADO_KEY = "rj-lembrar-contacto";

const CONTAS_DEMO = [
  {
    papel: "Cliente",
    nome: "João Macuácua",
    contacto: "+258841111111",
    contactoLabel: "+258 84 111 1111",
    senha: "teste123",
    icone: Car,
  },
  {
    papel: "Condutor",
    nome: "Alberto Nhaca",
    contacto: "+258875000001",
    contactoLabel: "+258 87 500 0001",
    senha: "teste123",
    icone: Truck,
  },
  {
    papel: "Empresa",
    nome: "Reboque Machava",
    contacto: "+258865000001",
    contactoLabel: "+258 86 500 0001",
    senha: "teste123",
    icone: Building2,
  },
  {
    papel: "Admin",
    nome: "Administrador",
    contacto: "admin@reboqueja.co.mz",
    contactoLabel: "admin@reboqueja.co.mz",
    senha: "admin123",
    icone: Shield,
  },
] as const;

export default function Entrar() {
  return (
    <Suspense>
      <FormularioEntrar />
    </Suspense>
  );
}

function FormularioEntrar() {
  const params = useSearchParams();
  const [tipoEmpresa, setTipoEmpresa] = useState(params.get("tipo") === "empresa");
  const [contacto, setContacto] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [ajudaSenha, setAjudaSenha] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const [aEntrar, setAEntrar] = useState(false);

  useEffect(() => {
    setTipoEmpresa(params.get("tipo") === "empresa");
  }, [params]);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CONTACTO_GUARDADO_KEY);
      if (guardado) {
        setContacto(guardado);
        setLembrar(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const entrar = async (c: string, s: string, guardar = lembrar) => {
    setAEntrar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contacto: c, senha: s }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErroMsg(dados.erro || "Não foi possível entrar.");
        return;
      }

      try {
        if (guardar && c.trim()) {
          localStorage.setItem(CONTACTO_GUARDADO_KEY, c.trim());
        } else {
          localStorage.removeItem(CONTACTO_GUARDADO_KEY);
        }
      } catch {
        // ignore storage errors
      }

      const proximo = params.get("proximo");
      const destinos: Record<string, string> = {
        CLIENTE: "/app",
        CONDUTOR: "/condutor",
        EMPRESA: "/empresa",
        ADMIN: "/admin",
      };
      const destino =
        proximo && destinos[dados.papel] && proximo.startsWith(destinos[dados.papel])
          ? proximo
          : destinos[dados.papel] || "/";
      window.location.assign(destino);
    } catch {
      setErroMsg("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setAEntrar(false);
    }
  };

  const submeter = async (e?: FormEvent) => {
    e?.preventDefault();
    await entrar(contacto, senha, lembrar);
  };

  const entrarDemo = (demoContacto: string, demoSenha: string) => {
    setContacto(demoContacto);
    setSenha(demoSenha);
    void entrar(demoContacto, demoSenha, false);
  };

  return (
    <div className="relative overflow-hidden bg-[#FAF3E8] dark:bg-[#0C0603] py-6 sm:py-10 transition-colors duration-200">
      {/* Brilho ambiental suave */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-400/20 dark:bg-amber-600/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-orange-400/15 dark:bg-orange-700/10 blur-3xl"
      />

      <div className="relative max-w-[1140px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.06fr_1fr] rounded-[28px] overflow-hidden border border-[#E6D6C2] dark:border-[#492C19]/90 shadow-[0_28px_70px_-28px_rgba(92,50,15,0.32)] dark:shadow-[0_28px_70px_-24px_rgba(0,0,0,0.85)] bg-[#FFFDF9] dark:bg-[#160D07]">
          {/* ===== Coluna Esquerda: Hero Visual + Escolha de Acesso ===== */}
          <aside className="relative flex flex-col justify-between min-h-[540px] lg:min-h-[640px] p-6 sm:p-8 lg:p-10 text-white overflow-hidden bg-[#1A0E06]">
            {/* Imagem de fundo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-reboque.png"
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02]"
            />
            {/* Degradês para contraste e profundidade */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-[#140A04]/95 via-[#1C0E06]/78 to-[#1A0D05]/30"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#120803]/95 via-transparent to-[#140A04]/70"
            />

            {/* Topo: Marca + Headline + Vantagens */}
            <div className="relative z-10 max-w-md">
              <Link
                href="/"
                className="inline-flex items-center gap-3.5 group"
                aria-label="ReboqueJá — início"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.svg"
                  alt=""
                  className="w-12 h-12 rounded-2xl shadow-[0_8px_20px_-6px_rgba(255,195,0,0.45)] transition group-hover:scale-105"
                />
                <span className="leading-tight">
                  <span className="block font-extrabold text-2xl tracking-tight text-white">
                    Reboque<span className="text-[#FFC300]">Já</span>
                  </span>
                  <span className="block text-[10px] font-semibold tracking-[0.2em] text-[#E9D9C6] uppercase mt-0.5">
                    Assistência na Matola
                  </span>
                </span>
              </Link>

              <div className="w-11 h-[3px] rounded-full bg-[#FFC300] mt-4 mb-6" />

              <h1 className="text-3xl sm:text-[38px] font-extrabold tracking-tight leading-[1.12]">
                A sua segurança
                <span className="block text-[#FFC300]">em primeiro lugar!</span>
              </h1>

              <p className="mt-3.5 text-sm sm:text-[15px] leading-relaxed text-[#EADCCF] max-w-[360px]">
                Solicite assistência, encontre empresas credenciadas e acompanhe o seu pedido em tempo real.
              </p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-[#F7ECE0]">
                  <span className="w-7 h-7 rounded-full bg-[#FFC300]/20 border border-[#FFC300]/35 text-[#FFC300] grid place-items-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                  Serviço confiável
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#F7ECE0]">
                  <span className="w-7 h-7 rounded-full bg-[#FFC300]/20 border border-[#FFC300]/35 text-[#FFC300] grid place-items-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                  Atendimento rápido
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#F7ECE0]">
                  <span className="w-7 h-7 rounded-full bg-[#FFC300]/20 border border-[#FFC300]/35 text-[#FFC300] grid place-items-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  Na Cidade da Matola
                </li>
              </ul>
            </div>

            {/* Base: Escolha o seu acesso */}
            <div className="relative z-10 mt-8 rounded-2xl bg-[#1A0D05]/80 backdrop-blur-md border border-white/15 p-3.5 sm:p-4 shadow-xl">
              <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#F3E6D8] mb-2.5">
                Escolha o seu acesso
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoEmpresa(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition border ${
                    !tipoEmpresa
                      ? "bg-[#FFC300] text-[#1A100A] border-[#FFD23F] shadow-[0_10px_22px_-10px_rgba(255,195,0,0.85)]"
                      : "bg-white/[0.06] text-white border-white/15 hover:bg-white/[0.12]"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                      !tipoEmpresa
                        ? "bg-[#1A100A]/12 text-[#1A100A]"
                        : "bg-white/10 text-[#F5EDE4]"
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-xs font-extrabold truncate">Sou cliente</span>
                    <span
                      className={`block text-[11px] truncate ${
                        !tipoEmpresa ? "text-[#4D3008] font-medium" : "text-[#D4C3B0]"
                      }`}
                    >
                      Peça um reboque
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoEmpresa(true)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition border ${
                    tipoEmpresa
                      ? "bg-[#FFC300] text-[#1A100A] border-[#FFD23F] shadow-[0_10px_22px_-10px_rgba(255,195,0,0.85)]"
                      : "bg-white/[0.06] text-white border-white/15 hover:bg-white/[0.12]"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                      tipoEmpresa
                        ? "bg-[#1A100A]/12 text-[#1A100A]"
                        : "bg-white/10 text-[#F5EDE4]"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-xs font-extrabold truncate">Sou empresa</span>
                    <span
                      className={`block text-[11px] truncate ${
                        tipoEmpresa ? "text-[#4D3008] font-medium" : "text-[#D4C3B0]"
                      }`}
                    >
                      Receba pedidos
                    </span>
                  </span>
                </button>

                <Link
                  href="/empresas"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition border bg-white/[0.06] text-white border-white/15 hover:bg-white/[0.12]"
                >
                  <span className="w-8 h-8 rounded-full bg-white/10 text-[#F5EDE4] grid place-items-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-xs font-extrabold truncate">Ver empresas</span>
                    <span className="block text-[11px] text-[#D4C3B0] truncate">
                      Compare opções
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          </aside>

          {/* ===== Coluna Direita: Área de Acesso + Acesso Rápido Demo ===== */}
          <section className="relative flex flex-col justify-center p-6 sm:p-10 lg:px-12 lg:py-10 bg-[#FFFDF9] dark:bg-[#160D07]">
            {/* Marca d'água subtil do reboque no canto superior direito */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 w-72 h-56 overflow-hidden opacity-[0.14] dark:opacity-[0.09]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/login.jpg"
                alt=""
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF9] via-transparent to-transparent dark:from-[#160D07]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFFDF9] via-transparent to-transparent dark:from-[#160D07]" />
            </div>

            {/* Acento geométrico no canto inferior direito */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -right-12 w-56 h-36 rounded-full bg-gradient-to-tl from-[#2C1608] via-[#B45309]/70 to-[#FFC300]/80 opacity-85 dark:opacity-55 blur-[1px]"
            />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F7E8CF] dark:bg-[#2F1B0E] text-[#6B3A0E] dark:text-[#FBBF24] text-[11px] font-extrabold tracking-[0.08em] uppercase">
                <Lock className="w-3.5 h-3.5" />
                Área de Acesso
              </span>

              <header className="mt-4 mb-6">
                <h2 className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-[#1A100A] dark:text-white leading-tight">
                  Entrar na plataforma
                </h2>
                <p className="text-sm text-[#5E4938] dark:text-[#C4B09C] mt-1.5">
                  Bem-vindo de volta ao{" "}
                  <span className="font-bold text-[#1A100A] dark:text-white">
                    Reboque<span className="text-[#9A4D0D] dark:text-[#FFC300]">Já</span>
                  </span>
                </p>
              </header>

              <form onSubmit={submeter} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-contacto"
                    className="block text-sm font-bold text-[#1A100A] dark:text-[#F5EDE4] mb-1.5 pl-12"
                  >
                    Telefone ou email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-full bg-[#F7E6CA] dark:bg-[#2A180D] text-[#7A3B0E] dark:text-[#FFC300] grid place-items-center shrink-0 border border-[#E9D4B4] dark:border-[#492C19]">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      id="login-contacto"
                      value={contacto}
                      onChange={(e) => setContacto(e.target.value)}
                      placeholder="+258 84 123 4567"
                      autoComplete="username"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                      className={campoPill}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-senha"
                    className="block text-sm font-bold text-[#1A100A] dark:text-[#F5EDE4] mb-1.5 pl-12"
                  >
                    Palavra-passe <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-full bg-[#F7E6CA] dark:bg-[#2A180D] text-[#7A3B0E] dark:text-[#FFC300] grid place-items-center shrink-0 border border-[#E9D4B4] dark:border-[#492C19]">
                      <Lock className="w-4 h-4" />
                    </span>
                    <div className="relative flex-1">
                      <input
                        id="login-senha"
                        type={mostrarSenha ? "text" : "password"}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Digite a sua palavra-passe"
                        autoComplete="current-password"
                        required
                        className={`${campoPill} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((v) => !v)}
                        aria-label={mostrarSenha ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full grid place-items-center text-[#786352] hover:text-[#1A100A] dark:text-[#B9A490] dark:hover:text-white transition"
                      >
                        {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-0.5 text-xs sm:text-sm">
                  <label className="inline-flex items-center gap-2 text-[#4A3728] dark:text-[#D1C0AE] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={lembrar}
                      onChange={(e) => setLembrar(e.target.checked)}
                      className="w-4 h-4 rounded border-[#CBB69D] text-[#9E4F0D] focus:ring-[#D97706]"
                    />
                    <span>Lembrar-me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setAjudaSenha((v) => !v)}
                    className="font-semibold text-[#9A4D0D] dark:text-[#FBBF24] hover:underline"
                  >
                    Esqueceu-se da palavra-passe?
                  </button>
                </div>

                {ajudaSenha && (
                  <p className="rounded-xl border border-[#E6D3B8] dark:border-[#492C19] bg-[#FAF2E6] dark:bg-[#221309] px-3.5 py-2.5 text-xs text-[#5E432C] dark:text-[#DFCBB7]">
                    Para recuperar a palavra-passe, contacte o suporte da sua empresa ou utilize uma das contas de acesso rápido abaixo para testar a plataforma.
                  </p>
                )}

                <AvisoErro>{erroMsg}</AvisoErro>

                <button
                  type="submit"
                  disabled={aEntrar}
                  className="w-full min-h-[48px] px-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C8741D] via-[#9E4F0D] to-[#6E3107] hover:from-[#D67E22] hover:via-[#AD5810] hover:to-[#7E3909] text-white font-bold text-sm sm:text-base transition shadow-[0_12px_28px_-10px_rgba(146,64,14,0.7)] active:scale-[0.99] disabled:opacity-55 disabled:pointer-events-none"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{aEntrar ? "A entrar…" : "Entrar"}</span>
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-[#5E4938] dark:text-[#B9A490]">
                Não tem conta?{" "}
                <Link
                  href={tipoEmpresa ? "/registar/empresa" : "/registar"}
                  className="font-bold text-[#9A4D0D] dark:text-[#FFC300] hover:underline"
                >
                  Registe-se
                </Link>
              </p>

              {/* Acesso rápido / Contas demo */}
              <div className="mt-5 pt-4 border-t border-[#EADBC8] dark:border-[#3A2212]">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#7A4415] dark:text-[#FBBF24]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Acesso rápido · Demo
                  </span>
                  <span className="text-[11px] text-[#7D6652] dark:text-[#A9927D]">
                    Entrar com 1 clique
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CONTAS_DEMO.map((conta) => {
                    const Icone = conta.icone;
                    return (
                      <button
                        key={conta.papel}
                        type="button"
                        disabled={aEntrar}
                        onClick={() => entrarDemo(conta.contacto, conta.senha)}
                        className="group flex items-center gap-2.5 rounded-xl border border-[#E5D5C0] dark:border-[#492C19]/85 bg-[#FAF4EB] dark:bg-[#1F120A] hover:border-[#C26D1A] dark:hover:border-[#F59E0B] hover:bg-[#F5E8D5] dark:hover:bg-[#2A180D] px-3 py-2 text-left transition disabled:opacity-50"
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#F1D8B3] dark:bg-[#331D0F] text-[#8B430C] dark:text-[#FFC300] grid place-items-center shrink-0 group-hover:scale-105 transition">
                          <Icone className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 leading-tight">
                          <span className="block text-xs font-extrabold text-[#1A100A] dark:text-white truncate">
                            {conta.papel}
                          </span>
                          <span className="block text-[10px] text-[#6B5440] dark:text-[#B9A490] truncate">
                            {conta.contactoLabel}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const campoPill =
  "w-full min-h-[44px] px-4 rounded-full border border-[#DFCEB9] dark:border-[#492C19] bg-white dark:bg-[#120A05] text-[#1A100A] dark:text-[#F5EDE4] placeholder:text-[#9A8572] dark:placeholder:text-[#7D6856] text-sm outline-none transition focus:border-[#C8741D] dark:focus:border-[#F59E0B] focus:ring-2 focus:ring-[#D97706]/25";
