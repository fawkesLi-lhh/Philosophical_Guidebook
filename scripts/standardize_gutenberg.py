#!/usr/bin/env python3
"""标准化脚本：Gutenberg 纯文本 → texts/<位次>-<哲学家>-<书名>.md

用法：python3 scripts/standardize_gutenberg.py <源.txt> <哲学家> <书名> <位次> <成书年> <语言> [来源URL]
段落规则：空行分隔的自然段，剥除 Gutenberg 头尾许可声明，P 编号全局连续写行首。
frontmatter 缺项即失败退出，不输出半成品。
"""
import io
import re
import sys
from pathlib import Path

START_MARKERS = ["*** START OF", "*END*THE SMALL PRINT", "***START OF"]
END_MARKERS = ["*** END OF", "End of the Project Gutenberg", "***END OF"]


def strip_gutenberg_boilerplate(text: str) -> str:
    lines = text.splitlines()
    start = 0
    end = len(lines)
    for i, ln in enumerate(lines):
        for m in START_MARKERS:
            if m in ln:
                start = max(start, i + 1)
        for m in END_MARKERS:
            if m in ln and i > start:
                end = min(end, i)
                break
    return "\n".join(lines[start:end])


def paragraphs(text: str) -> list[str]:
    blocks = re.split(r"\n\s*\n", text)
    out = []
    for b in blocks:
        p = " ".join(b.split())
        if len(p) >= 20:
            out.append(p)
    return out


def main() -> None:
    if len(sys.argv) < 7:
        sys.exit(__doc__)
    src, philosopher, work, seq, year, lang = sys.argv[1:7]
    url = sys.argv[7] if len(sys.argv) > 7 else ""
    raw = io.open(src, encoding="utf-8", errors="strict").read()
    body = strip_gutenberg_boilerplate(raw)
    paras = paragraphs(body)
    if len(paras) < 5:
        sys.exit(f"FAIL: only {len(paras)} paragraphs — boilerplate strip or split broken")
    lines = [
        "---",
        f"philosopher: {philosopher}",
        f"work: {work}",
        f"sequence_in_diagram: {seq}",
        f"composed_year: {year}",
        f"source_url: {url}",
        "source_edition: Project Gutenberg plain text (translator/edition see source)",
        f"language: {lang}",
        f"paragraph_count: {len(paras)}",
        "---",
    ]
    for i, p in enumerate(paras, 1):
        lines.append(f"P{i:04d} {p}")
    out = Path("texts") / f"{seq}-{philosopher}-{work}.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK {out} paragraphs={len(paras)}")


if __name__ == "__main__":
    main()
