"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Tema = "claro" | "escuro";

const TemaContext = createContext<{
  tema: Tema;
  alternar: () => void;
  definir: (t: Tema) => void;
}>({ tema: "claro", alternar: () => {}, definir: () => {} });

export function ProvedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    const guardado = localStorage.getItem("rj-tema") as Tema | null;
    const preferido: Tema =
      guardado === "claro" || guardado === "escuro"
        ? guardado
        : document.documentElement.classList.contains("dark") ||
            window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "escuro"
          : "claro";
    setTema(preferido);
    aplicar(preferido);
  }, []);

  const aplicar = (t: Tema) => {
    document.documentElement.classList.toggle("dark", t === "escuro");
  };

  const alternar = useCallback(() => {
    setTema((t) => {
      const novo = t === "claro" ? "escuro" : "claro";
      try {
        localStorage.setItem("rj-tema", novo);
      } catch {}
      aplicar(novo);
      return novo;
    });
  }, []);

  const definir = useCallback((t: Tema) => {
    try {
      localStorage.setItem("rj-tema", t);
    } catch {}
    aplicar(t);
    setTema(t);
  }, []);

  return (
    <TemaContext.Provider value={{ tema, alternar, definir }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  return useContext(TemaContext);
}

export const usarTema = useTema;
