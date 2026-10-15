#!/usr/bin/env python3
"""标准化脚本：已提取纯文本(pdf→txt 或其他) → texts/<位次>-<哲学家>-<书名>.md
用法：python3 scripts/standardize_plaintext.py <源.txt> <哲学家> <书名> <位次> <成书年> <语言> [来源URL]
与 Gutenberg 版差异：无头尾许可声明可剥，直接分段。
"""
import io
import re
import sys
from pathlib import Path

def clean_line(l: str) -> str:
    return re.sub(r"-\s*$", "", l)

def paragraphs(text: str) -> list[str]:
    out = []
    for b in re.split(r"\n\s*\n", text):
        b2 = "\n".join(clean_line(l) for l in b.splitlines())
        p = " ".join(b2.split())
        if len(p) >= 20:
            out.append(p)
    return out

def main() -> None:
    if len(sys.argv) < 7:
        sys.exit(__doc__)
    src, philosopher, work, seq, year, lang = sys.argv[1:7]
    url = sys.argv[7] if len(sys.argv) > 7 else ""
    raw = io.open(src, encoding="utf-8", errors="replace").read()
    paras = paragraphs(raw)
    if len(paras) < 5:
        sys.exit(f"FAIL: only {len(paras)} paragraphs")
    lines = ["---", f"philosopher: {philosopher}", f"work: {work}", f"sequence_in_diagram: {seq}",
             f"composed_year: {year}", f"source_url: {url}",
             "source_edition: PDF→text (pdftotext -layout)", f"language: {lang}",
             f"paragraph_count: {len(paras)}", "---"]
    for i, p in enumerate(paras, 1):
        lines.append(f"P{i:04d} {p}")
    out = Path("texts") / f"{seq}-{philosopher}-{work}.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK {out} paragraphs={len(paras)}")

if __name__ == "__main__":
    main()
