"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type Mensagem = {
  id: string;
  papel: "user" | "assistant";
  conteudo: string;
};

const SUGESTOES_RAPIDAS = [
  "Não sei que tipo de veículo escolher",
  "Quanto custa um reboque na Matola?",
  "O meu carro parou na estrada, o que faço?",
  "Como acompanho o camião em tempo real?",
] as const;

export function ChatAssistente() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [aResponder, setAResponder] = useState(false);
  const [erro, setErro] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      fimRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [aberto, mensagens.length]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const enviarPergunta = async (textoBruto: string) => {
    const texto = textoBruto.trim();
    if (!texto || aResponder) return;

    setErro("");
    setEntrada("");

    const msgUser: Mensagem = {
      id: `u_${Date.now()}`,
      papel: "user",
      conteudo: texto,
    };
    const msgBotId = `a_${Date.now() + 1}`;
    const historicoEnvio = [...mensagens, msgUser].map((m) => ({
      papel: m.papel,
      conteudo: m.conteudo,
    }));

    setMensagens((prev) => [
      ...prev,
      msgUser,
      { id: msgBotId, papel: "assistant", conteudo: "" },
    ]);
    setAResponder(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagens: historicoEnvio.slice(-20),
          rota: pathname,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.erro || "Não foi possível obter resposta.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n");
        buffer = linhas.pop() ?? "";

        for (const linhaRaw of linhas) {
          const linha = linhaRaw.trim();
          if (!linha.startsWith("data:")) continue;
          const payload = linha.slice(5).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { delta?: string };
            if (parsed.delta) {
              setMensagens((prev) =>
                prev.map((m) =>
                  m.id === msgBotId
                    ? { ...m, conteudo: m.conteudo + parsed.delta }
                    : m
                )
              );
              fimRef.current?.scrollIntoView({ behavior: "auto" });
            }
          } catch {
            // ignora fragmentos parciais
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Erro ao comunicar com o chat.";
      setErro(msg);
      setMensagens((prev) => prev.filter((m) => m.id !== msgBotId || m.conteudo.length > 0));
    } finally {
      setAResponder(false);
      abortRef.current = null;
    }
  };

  const submeter = (e: FormEvent) => {
    e.preventDefault();
    void enviarPergunta(entrada);
  };

  const limparConversa = () => {
    abortRef.current?.abort();
    setAResponder(false);
    setErro("");
    setMensagens([]);
  };

  return (
    <div className="fixed bottom-[76px] md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
      {aberto && (
        <section
          aria-label="Assistente inteligente ReboqueJá"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[390px] h-[min(520px,72vh)] flex flex-col rounded-3xl overflow-hidden border border-[#E4D3BC] dark:border-[#492C19] bg-[#FFFDF9] dark:bg-[#140B06] shadow-[0_24px_60px_-20px_rgba(68,36,10,0.45)] dark:shadow-[0_24px_60px_-18px_rgba(0,0,0,0.9)]"
        >
          {/* Cabeçalho */}
          <header className="px-4 py-3.5 bg-gradient-to-r from-[#241309] via-[#3A1F0D] to-[#7C3B0B] text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-2xl bg-[#FFC300] text-[#1A100A] grid place-items-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </span>
              <div className="min-w-0 leading-tight">
                <h2 className="text-sm font-extrabold truncate flex items-center gap-1.5">
                  Assistente ReboqueJá
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Online em tempo real" />
                </h2>
                <p className="text-[11px] text-[#EADCCF] truncate">
                  Respostas em tempo real · Matola
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {mensagens.length > 0 && (
                <button
                  type="button"
                  onClick={limparConversa}
                  title="Nova conversa"
                  aria-label="Limpar conversa"
                  className="w-8 h-8 rounded-full grid place-items-center text-[#EADCCF] hover:text-white hover:bg-white/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar chat"
                className="w-8 h-8 rounded-full grid place-items-center text-[#EADCCF] hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3 bg-[#FAF5ED]/70 dark:bg-[#0D0603]/80">
            {mensagens.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-[#1E120A] border border-[#E8D9C5] dark:border-[#3D2414] px-3.5 py-3 text-xs sm:text-sm text-[#2C1C12] dark:text-[#F2E7DA] shadow-sm">
                  <p className="font-bold flex items-center gap-1.5 text-[#9A4D0D] dark:text-[#FFC300] mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Olá! Como posso ajudar?
                  </p>
                  <p className="leading-relaxed text-[#594637] dark:text-[#C8B4A0]">
                    Pode tirar dúvidas sobre tipos de veículo (incluindo a opção <b>Outro</b>), preços na Matola, ou o que fazer em caso de avaria.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A624D] dark:text-[#A9927D] px-1">
                    Perguntas rápidas
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGESTOES_RAPIDAS.map((sugestao) => (
                      <button
                        key={sugestao}
                        type="button"
                        onClick={() => void enviarPergunta(sugestao)}
                        className="text-left text-xs font-medium px-3 py-2 rounded-xl border border-[#E4D3BC] dark:border-[#492C19] bg-white dark:bg-[#1A0F08] hover:border-[#C8741D] dark:hover:border-[#FFC300] text-[#3B2616] dark:text-[#EDE0D1] transition"
                      >
                        {sugestao}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              mensagens.map((m) => {
                const eUtilizador = m.papel === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex ${eUtilizador ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        eUtilizador
                          ? "rounded-tr-sm bg-gradient-to-r from-[#C8741D] to-[#9E4F0D] text-white shadow-sm"
                          : "rounded-tl-sm bg-white dark:bg-[#1E120A] border border-[#E8D9C5] dark:border-[#3D2414] text-[#1A100A] dark:text-[#F5EDE4] shadow-sm"
                      }`}
                    >
                      {m.conteudo || (
                        <span className="inline-flex items-center gap-1.5 text-[#7A624D] dark:text-[#B9A490]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          A responder…
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {erro && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                {erro}
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {/* Campo de envio */}
          <form
            onSubmit={submeter}
            className="p-2.5 bg-white dark:bg-[#140B06] border-t border-[#E6D6C2] dark:border-[#3A2212] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escreva a sua questão…"
              maxLength={1500}
              disabled={aResponder}
              className="flex-1 min-h-[42px] px-4 rounded-full border border-[#DFCEB9] dark:border-[#492C19] bg-[#FAF7F2] dark:bg-[#1E120A] text-sm text-[#1A100A] dark:text-white placeholder:text-[#8E7865] outline-none focus:border-[#C8741D] dark:focus:border-[#FFC300] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={aResponder || !entrada.trim()}
              aria-label="Enviar mensagem"
              className="w-10 h-10 rounded-full bg-[#FFC300] hover:bg-[#FFD033] text-[#1A100A] grid place-items-center shrink-0 transition shadow-sm disabled:opacity-45 disabled:pointer-events-none"
            >
              {aResponder ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </section>
      )}

      {/* Botão flutuante */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar assistente inteligente" : "Abrir assistente inteligente"}
        className="group inline-flex items-center gap-2.5 h-12 pl-3.5 pr-4 rounded-full bg-gradient-to-r from-[#241309] via-[#592A0B] to-[#9E4F0D] hover:from-[#2E190C] hover:to-[#B55A10] text-white border border-[#FFC300]/50 shadow-[0_14px_30px_-10px_rgba(92,50,15,0.7)] transition active:scale-[0.98]"
      >
        <span className="w-7 h-7 rounded-full bg-[#FFC300] text-[#1A100A] grid place-items-center shrink-0">
          {aberto ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        </span>
        <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
          {aberto ? "Fechar chat" : "Assistente IA"}
        </span>
      </button>
    </div>
  );
}
