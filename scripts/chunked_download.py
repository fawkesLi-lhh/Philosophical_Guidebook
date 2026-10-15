#!/usr/bin/env python3
"""分块下载器：大文件按 Range 续传拼装（单次连接窗口有限的环境）。
用法：python3 scripts/chunked_download.py <url> <输出文件>
"""
import io
import subprocess
import sys
import time


def have_size(path: str) -> int:
    try:
        return io.open(path, "rb").read().__len__()
    except FileNotFoundError:
        return 0


def main() -> None:
    url, dst = sys.argv[1], sys.argv[2]
    total = None
    for attempt in range(60):
        cur = have_size(dst)
        if total is None:
            r = subprocess.run(
                ["curl", "-sI", "--max-time", "20", url],
                capture_output=True, text=True)
            for ln in r.stdout.splitlines():
                if ln.lower().startswith("content-length:"):
                    total = int(ln.split(":")[1].strip())
        if total and cur >= total:
            d = io.open(dst, "rb").read()
            print(f"done {len(d)} bytes (expected {total})")
            print("ends EOF:", d.rstrip().endswith(b"%%EOF"))
            return
        start = cur
        r = subprocess.run(
            ["curl", "-s", "--max-time", "60", "-r", f"{start}-", url,
             "-o", "logs/_chunk.tmp", "-w", "%{http_code} %{size_download}"],
            capture_output=True, text=True)
        got = 0
        try:
            got = io.open("logs/_chunk.tmp", "rb").read().__len__()
        except FileNotFoundError:
            got = 0
        if got > 0:
            with io.open(dst, "ab") as f:
                f.write(io.open("logs/_chunk.tmp", "rb").read())
        print(f"chunk {attempt}: from {start} +{got} (now {have_size(dst)}/{total})")
        if got == 0:
            time.sleep(2)
    print("FAILED after 60 chunks")


if __name__ == "__main__":
    main()
