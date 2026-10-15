#!/usr/bin/env python3
"""标准化脚本：Gutenberg HTML → texts/<位次>-<哲学家>-<书名>.md
用法：python3 scripts/standardize_html.py <源.html> <哲学家> <书名> <位次> <成书年> <语言> [来源URL]
剥标签取正文，空行分段，其余规则同 standardize_gutenberg.py。
"""
import io
import re
import sys
from pathlib import Path

def html_to_text(html: str) -> str:
    html = re.sub(r"(?is)<(script|style|head)[^>]*>.*?</\1>", " ", html)
    html = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</h[1-6]>|</li>", "\n\n", html)
    html = re.sub(r"(?i)<li[^>]*>", "\n- ", html)
    text = re.sub(r"<[^>]+>", "", html)
    reps = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ",
            "&mdash;": "—", "&ndash;": "–", "&hellip;": "…", "&rsquo;": "’", "&lsquo;": "‘",
            "&ldquo;": "“", "&rdquo;": "”", "&eacute;": "é", "&egrave;": "è", "&auml;": "ä",
            "&ouml;": "ö", "&uuml;": "ü", "&szlig;": "ß", "&aacute;": "á"}
    for k, v in reps.items():
        text = text.replace(k, v)
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    return text

def paragraphs(text: str) -> list[str]:
    out = []
    for b in re.split(r"\n\s*\n", text):
        p = " ".join(b.split())
        if len(p) >= 20:
            out.append(p)
    return out

def main() -> None:
    if len(sys.argv) < 7:
        sys.exit(__doc__)
    src, philosopher, work, seq, year, lang = sys.argv[1:7]
    url = sys.argv[7] if len(sys.argv) > 7 else ""
    raw = io.open(src, encoding="cp1252", errors="replace").read()
    m = re.search(r"(?i)\*\*\*\s*START OF.*?\*\*\*", raw)
    if m:
        e = re.search(r"(?i)\*\*\*\s*END OF", raw)
        raw = raw[m.end(): e.start() if e else len(raw)]
    paras = paragraphs(html_to_text(raw))
    if len(paras) < 5:
        sys.exit(f"FAIL: only {len(paras)} paragraphs")
    lines = ["---", f"philosopher: {philosopher}", f"work: {work}", f"sequence_in_diagram: {seq}",
             f"composed_year: {year}", f"source_url: {url}",
             "source_edition: Project Gutenberg HTML", f"language: {lang}",
             f"paragraph_count: {len(paras)}", "---"]
    for i, p in enumerate(paras, 1):
        lines.append(f"P{i:04d} {p}")
    out = Path("texts") / f"{seq}-{philosopher}-{work}.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK {out} paragraphs={len(paras)}")

if __name__ == "__main__":
    main()
