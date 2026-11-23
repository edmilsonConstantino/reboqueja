"""Gera uma versão em texto corrido: cada parágrafo numa só linha, para colar no Word."""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent
SRC = RAIZ / "ReboqueJa-Explicacao-do-Sistema.md"
OUT = RAIZ / "ReboqueJa-Explicacao-do-Sistema-corrido.txt"

INLINE = re.compile(r"(\*\*.+?\*\*|`[^`]+`)")


def limpo(texto):
    return texto.replace("**", "").replace("`", "").strip()


linhas = SRC.read_text(encoding="utf-8").split("\n")
saida = []
i = 0
while i < len(linhas):
    crua = linhas[i].strip()
    if not crua:
        i += 1
        continue

    # tabela -> uma linha por registo, campos separados por " — "
    if crua.startswith("|"):
        while i < len(linhas) and linhas[i].strip().startswith("|"):
            bruta = linhas[i].strip()
            i += 1
            if re.match(r"^\|[\s:\-|]+\|$", bruta):
                continue
            campos = [limpo(c) for c in bruta.strip("|").split("|")]
            # ignora células vazias e traços soltos (células sem conteúdo)
            campos = [c for c in campos if c and c != "—"]
            saida.append(" — ".join(campos))
        saida.append("")
        continue

    if crua.startswith("### "):
        saida.append(limpo(crua[4:]).upper())
        saida.append("")
        i += 1
        continue
    if crua.startswith("## "):
        saida.append("")
        saida.append(limpo(crua[3:]).upper())
        saida.append("")
        i += 1
        continue
    if crua.startswith("# "):
        saida.append(limpo(crua[2:]).upper())
        saida.append("")
        i += 1
        continue

    if re.match(r"^[-*] ", crua):
        saida.append("• " + limpo(crua[2:]))
        saida.append("")
        i += 1
        continue

    m = re.match(r"^(\d+)\. (.*)$", crua)
    if m:
        saida.append(f"{m.group(1)}. " + limpo(m.group(2)))
        saida.append("")
        i += 1
        continue

    partes = [crua]
    i += 1
    while i < len(linhas):
        seguinte = linhas[i].strip()
        if not seguinte or seguinte.startswith(("#", "|", "- ", "* ")) or re.match(r"^\d+\. ", seguinte):
            break
        partes.append(seguinte)
        i += 1
    saida.append(limpo(" ".join(partes)))
    saida.append("")

# sem linhas em branco a mais no início/fim
texto = "\n".join(saida).strip() + "\n"
texto = re.sub(r"\n{3,}", "\n\n", texto)
OUT.write_text(texto, encoding="utf-8")

linhas_ok = [l for l in texto.split("\n") if l.strip()]
print("escrito:", OUT)
print("linhas com conteúdo:", len(linhas_ok))
print("maior linha:", max(len(l) for l in linhas_ok), "caracteres")
print("linhas que não são título e não acabam em pontuação (possíveis cortes):")
maus = [l for l in linhas_ok if len(l) > 60 and not l.rstrip().endswith((".", ":", "!", "?", "»", "”", ")"))]
for l in maus:
    print("   -", l[:80], "...")
print("maus:", len(maus))
