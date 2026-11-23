"""Converte a fonte Markdown em .docx formatado (títulos, listas e tabelas reais).

Uso:  python documentacao/gerar_docx.py
Entrada: documentacao/ReboqueJa-Explicacao-do-Sistema.md
Saída:   documentacao/ReboqueJa-Explicacao-do-Sistema.docx
"""

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parent
SRC = RAIZ / "ReboqueJa-Explicacao-do-Sistema.md"
OUT = RAIZ / "ReboqueJa-Explicacao-do-Sistema.docx"

AZUL = RGBColor(0x1F, 0x3B, 0x57)
CINZA = RGBColor(0x44, 0x4E, 0x5A)
HEADER_FILL = "1F3B57"

INLINE = re.compile(r"(\*\*.+?\*\*|`[^`]+`)")


# ----------------------------------------------------------------- utilidades
def limpar_md(texto: str) -> str:
    """Remove marcações de ênfase/código de um texto curto (títulos)."""
    return texto.replace("**", "").replace("`", "")


def add_inline(par, texto: str, tamanho: float | None = None) -> None:
    """Escreve texto no parágrafo, tratando **negrito** e `código`."""
    for parte in INLINE.split(texto):
        if not parte:
            continue
        if parte.startswith("**") and parte.endswith("**") and len(parte) > 4:
            run = par.add_run(parte[2:-2])
            run.bold = True
        elif parte.startswith("`") and parte.endswith("`") and len(parte) > 2:
            run = par.add_run(parte[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt((tamanho or 11) - 1)
        else:
            run = par.add_run(parte)
        if tamanho:
            run.font.size = Pt(tamanho)


def sombrear(celula, cor: str) -> None:
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), cor)
    celula._tc.get_or_add_tcPr().append(shd)


def repetir_cabecalho(linha) -> None:
    trPr = linha._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    trPr.append(el)


def numero_pagina(par) -> None:
    run = par.add_run()
    run.font.size = Pt(9)
    run.font.color.rgb = CINZA
    inicio = OxmlElement("w:fldChar")
    inicio.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    fim = OxmlElement("w:fldChar")
    fim.set(qn("w:fldCharType"), "end")
    run._r.append(inicio)
    run._r.append(instr)
    run._r.append(fim)


# --------------------------------------------------------------------- doc
doc = Document()

seccao = doc.sections[0]
seccao.page_width = Cm(21)
seccao.page_height = Cm(29.7)
seccao.top_margin = Cm(2.5)
seccao.bottom_margin = Cm(2.5)
seccao.left_margin = Cm(2.5)
seccao.right_margin = Cm(2.5)

base = doc.styles["Normal"]
base.font.name = "Calibri"
base.font.size = Pt(11)
base.paragraph_format.space_after = Pt(6)
base.paragraph_format.line_spacing = 1.15
try:
    base.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
except Exception:
    pass


def configurar_titulo(nome, tamanho, cor, antes, depois, negrito=True):
    est = doc.styles[nome]
    est.font.name = "Calibri"
    est.font.size = Pt(tamanho)
    est.font.bold = negrito
    est.font.color.rgb = cor
    est.paragraph_format.space_before = Pt(antes)
    est.paragraph_format.space_after = Pt(depois)
    est.paragraph_format.keep_with_next = True
    est.paragraph_format.line_spacing = 1.1


configurar_titulo("Title", 24, AZUL, 0, 18)
configurar_titulo("Heading 1", 16, AZUL, 18, 8)
configurar_titulo("Heading 2", 12.5, AZUL, 12, 4)

# rodapé com número de página
rodape = seccao.footer.paragraphs[0]
rodape.alignment = WD_ALIGN_PARAGRAPH.CENTER
numero_pagina(rodape)

TITULO_TABELA = "Table Grid"


def nova_tabela(linhas):
    cabecalho, corpo = linhas[0], linhas[1:]
    colunas = max(len(c) for c in linhas)
    tabela = doc.add_table(rows=1, cols=colunas)
    tabela.style = TITULO_TABELA
    tabela.alignment = WD_TABLE_ALIGNMENT.CENTER
    tabela.autofit = True

    for i, texto in enumerate(cabecalho):
        celula = tabela.rows[0].cells[i]
        par = celula.paragraphs[0]
        par.paragraph_format.space_after = Pt(2)
        par.paragraph_format.keep_with_next = True
        add_inline(par, texto, tamanho=10)
        for run in par.runs:
            run.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        sombrear(celula, HEADER_FILL)
    repetir_cabecalho(tabela.rows[0])

    for linha in corpo:
        celulas = tabela.add_row().cells
        for i, texto in enumerate(linha):
            if i >= colunas:
                break
            par = celulas[i].paragraphs[0]
            par.paragraph_format.space_after = Pt(2)
            add_inline(par, texto, tamanho=10)

    # respiro depois da tabela
    respiro = doc.add_paragraph()
    respiro.paragraph_format.space_after = Pt(4)


# ------------------------------------------------------------------- parser
texto = SRC.read_text(encoding="utf-8")
linhas = texto.split("\n")
i = 0
while i < len(linhas):
    linha = linhas[i].rstrip()
    crua = linha.strip()

    if not crua:
        i += 1
        continue

    # tabela
    if crua.startswith("|"):
        bloco = []
        while i < len(linhas) and linhas[i].strip().startswith("|"):
            bloco.append(linhas[i].strip())
            i += 1
        registos = []
        for bruta in bloco:
            if re.match(r"^\|[\s:\-|]+\|$", bruta):
                continue
            celulas = [c.strip() for c in bruta.strip("|").split("|")]
            registos.append(celulas)
        if registos:
            nova_tabela(registos)
        continue

    # títulos
    if crua.startswith("### "):
        par = doc.add_paragraph(style="Heading 2")
        add_inline(par, limpar_md(crua[4:]))
        i += 1
        continue
    if crua.startswith("## "):
        par = doc.add_paragraph(style="Heading 1")
        add_inline(par, limpar_md(crua[3:]))
        i += 1
        continue
    if crua.startswith("# "):
        par = doc.add_paragraph(style="Title")
        add_inline(par, limpar_md(crua[2:]))
        i += 1
        continue

    # listas com marcas
    if re.match(r"^[-*] ", crua):
        par = doc.add_paragraph(style="List Bullet")
        par.paragraph_format.space_after = Pt(3)
        add_inline(par, crua[2:])
        i += 1
        continue

    # listas numeradas: número literal, para cada lista recomeçar em 1
    m = re.match(r"^(\d+)\. (.*)$", crua)
    if m:
        par = doc.add_paragraph()
        par.paragraph_format.left_indent = Cm(0.9)
        par.paragraph_format.first_line_indent = Cm(-0.6)
        par.paragraph_format.space_after = Pt(3)
        add_inline(par, f"{m.group(1)}. {m.group(2)}")
        i += 1
        continue

    # parágrafo (junta linhas até ao próximo bloco)
    partes = [crua]
    i += 1
    while i < len(linhas):
        seguinte = linhas[i].strip()
        if (
            not seguinte
            or seguinte.startswith(("#", "|", "- ", "* "))
            or re.match(r"^\d+\. ", seguinte)
        ):
            break
        partes.append(seguinte)
        i += 1

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    add_inline(par, " ".join(partes))

doc.save(OUT)

# ------------------------------------------------------------------ resumo
print(f"escrito: {OUT}")
print(f"parágrafos: {len(doc.paragraphs)}")
print(f"tabelas: {len(doc.tables)}")
for n, tab in enumerate(doc.tables, 1):
    print(f"  tabela {n}: {len(tab.rows)} linhas x {len(tab.columns)} colunas")
