"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Tema = "claro" | "escuro";

const TemaContext = createContext<{
  tema: Tema;
  alternar: () => void;
}>({ tema: "claro", alternar: () => {} });

export function ProvedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    const guardado = localStorage.getItem("rj-tema") as Tema | null;
    const preferido =
      guardado ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "escuro"
        : "claro");
    setTema(preferido);
    aplicar(preferido);
  }, []);

  const aplicar = (t: Tema) => {
    document.documentElement.classList.toggle("dark", t === "escuro");
  };

  const alternar = useCallback(() => {
    setTema((t) => {
      const novo = t === "claro" ? "escuro" : "claro";
      localStorage.setItem("rj-tema", novo);
      aplicar(novo);
      return novo;
    });
  }, []);

  return (
    <TemaContext.Provider value={{ tema, alternar }}>
      {children}
    </TemaContext.Provider>
  );
}

export function usarTema() {
  return useContext(TemaContext);
}
