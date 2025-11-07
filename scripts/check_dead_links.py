# Detect global dead links (no auto fix)
#
# Core logic:
# Traverse all documents, match the links in the documents, and determine whether it is a dead link by the link address.
# If it is a dead link, print:
#   ❌ 目标文档 xxxx/xxxx.md
#   Broken link ${target_link}
#
# This version:
#   - skips inline and code block links
#   - ignores anchors (#xxx)
#   - checks .md and .mdx variants
#   - never modifies files
#   - counts and prints total broken links at the end

import argparse
import os
import re
import sys
from urllib.parse import urlparse

search_dirs = ["docs", "i18n", "versioned_docs", "community"]
broken_count = 0  # 全局死链计数

def process_md_file(file_path):
    global broken_count

    # 匹配 Markdown 链接：[text](link)
    link_pattern = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
    # 匹配代码块（包括 ``` 多行代码块 和 `行内代码`）
    code_block_pattern = re.compile(r"(```.*?```|`[^`]*`)", re.DOTALL)

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 提取所有代码块范围
    code_blocks = []
    for match in code_block_pattern.finditer(content):
        code_blocks.append((match.start(), match.end()))

    def is_inside_code_block(pos):
        """判断该位置是否位于代码块或行内代码中"""
        for start, end in code_blocks:
            if start <= pos < end:
                return True
        return False

    links = list(link_pattern.finditer(content))
    for match in links:
        link_target = match.group(2).strip()
        start_pos = match.start()

        # 跳过在代码块或反引号中的链接
        if is_inside_code_block(start_pos):
            continue

        # 跳过外部链接（http/https/mailto等）
        if urlparse(link_target).scheme or os.path.isabs(link_target):
            continue

        # 去掉锚点部分（#xxx）
        link_target_path = link_target.split("#", 1)[0]

        # 如果链接为空或只是锚点（如 #section），跳过
        if link_target_path == "" or link_target_path.startswith("#"):
            continue

        # 构造相对路径
        full_path = os.path.normpath(os.path.join(os.path.dirname(file_path), link_target_path))

        # 检查文件是否存在（允许省略 .md / .mdx）
        if not os.path.exists(full_path):
            md_path = full_path + ".md"
            mdx_path = full_path + ".mdx"
            if not os.path.exists(md_path) and not os.path.exists(mdx_path):
                print(f"目标文档 {file_path}\nBroken link {link_target}\n")
                broken_count += 1

def travel(root_path: str):
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                process_md_file(os.path.join(root, file))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Detect broken md links (no auto fix)")
    parser.add_argument("--commit-id", type=str, help="Optional Git commit id (ignored for now)", default=None)
    args = parser.parse_args()

    print("🔍 Scanning for broken links...\n")

    for dir in search_dirs:
        if os.path.exists(dir):
            travel(dir)

    if broken_count > 0:
        print(f"❗ 共发现 {broken_count} 个死链")
    else:
        print("✅ 未发现死链")

    print("✅ Scan complete.")
