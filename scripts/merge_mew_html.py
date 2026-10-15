#!/usr/bin/env python3
"""合并 MARX-EBOOKS MEW html 分章 → texts 标准化 md
用法：python3 scripts/merge_mew_html.py <目录> <起始页> <结束页> <哲学家> <书名> <成书年> <语言> <来源说明>
"""
import io
import re
import sys
from pathlib import Path

def html_to_text(html: str) -> str:
    html = re.sub(r"(?is)<(script|style|head)[^>]*>.*?</\1>", " ", html)
    html = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</h[1-6]>|</li>", "\n\n", html)
    text = re.sub(r"<[^>]+>", "", html)
    for k, v in {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
                 "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&auml;": "ä",
                 "&ouml;": "ö", "&uuml;": "ü", "&szlig;": "ß"}.items():
        text = text.replace(k, v)
    return re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)

def main() -> None:
    if len(sys.argv) < 9:
        sys.exit(__doc__)
    src_dir, lo_s, hi_s, philosopher, work, year, lang, edition = sys.argv[1:9]
    lo, hi = int(lo_s), int(hi_s)
    files = []
    for f in Path(src_dir).glob("*.html"):
        m = re.search(r"-(\d+)\.html$", f.name)
        if m and lo <= int(m.group(1)) <= hi:
            files.append((int(m.group(1)), f))
    files.sort()
    if not files:
        sys.exit(f"FAIL: no html files in page range {lo}-{hi}")
    paras = []
    for _, f in files:
        txt = html_to_text(io.open(f, encoding="utf-8", errors="replace").read())
        for b in re.split(r"\n\s*\n", txt):
            p = " ".join(b.split())
            if len(p) >= 20:
                paras.append(p)
    if len(paras) < 20:
        sys.exit(f"FAIL: only {len(paras)} paragraphs")
    lines = ["---", f"philosopher: {philosopher}", f"work: {work}",
             "diagram_source: 261014-日记3-哲学演化图谱", f"composed_year: {year}",
             "source_url: https://github.com/MARX-EBOOKS/marx-ebooks.github.io",
             f"source_edition: {edition}", f"language: {lang}",
             f"paragraph_count: {len(paras)}", "---"]
    for i, p in enumerate(paras, 1):
        lines.append(f"P{i:04d} {p}")
    out = Path("texts") / f"{year.split('-')[0]}-{philosopher}-{work}.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK {out} paragraphs={len(paras)} files={len(files)}")

if __name__ == "__main__":
    main()
