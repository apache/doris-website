import argparse
import subprocess
import re
import os
import sys
from typing import AnyStr, List
from urllib.parse import urlparse

move_pairs = []
deletes = []
change_detected = False
search_dirs = ["docs", "i18n", "versioned_docs", "community"]

def is_same_file(path1, path2):
    return os.path.normpath(path1) == os.path.normpath(path2)

def remove_suffix(text: str, suffix: str):
    if text.endswith(suffix):
        return text[: -len(suffix)]
    return text

def find_nearest_file(file_base, start_dir):
    """
    在 start_dir 向上查找最近的 file_base(.md/.mdx)，否则全局搜索
    """
    cur_dir = start_dir
    # 向上搜索最多 10 层，避免卡死
    for _ in range(10):
        for ext in [".md", ".mdx"]:
            candidate = os.path.join(cur_dir, file_base + ext)
            if os.path.exists(candidate):
                return candidate
        parent = os.path.dirname(cur_dir)
        if parent == cur_dir:
            break
        cur_dir = parent

    # 全局搜索
    for base_dir in search_dirs:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if (file == file_base + ".md") or (file == file_base + ".mdx"):
                    return os.path.join(root, file)
    return None

def process_md_file(file_path):
    global change_detected

    link_pattern = re.compile(r"\[.*?\]\((.*?)\)")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    links = link_pattern.findall(content)
    new_content = content

    for link in links:
        if not urlparse(link).scheme and not os.path.isabs(link):
            full_path = os.path.normpath(os.path.join(os.path.dirname(file_path), link))
            if not full_path.endswith(".md") and not full_path.endswith(".mdx"):
                full_path += ".md"

            # 处理 rename 情况
            for [from_path, to_path] in move_pairs:
                from_base, from_ext = os.path.splitext(from_path)
                to_base, to_ext = os.path.splitext(to_path)
                if (from_ext in [".md", ".mdx", ""] or to_ext in [".md", ".mdx", ""]) and (from_base == to_base):
                    continue

                if is_same_file(full_path, from_path):
                    relative_to_path = os.path.relpath(to_path, os.path.dirname(file_path))
                    relative_to_path = remove_suffix(relative_to_path, ".md")
                    relative_to_path = remove_suffix(relative_to_path, ".mdx")
                    print(f"🔄 {file_path}: Updated moved link {link} -> {relative_to_path}")
                    new_content = new_content.replace(f"({link})", f"({relative_to_path})")
                    change_detected = True

            # 处理 delete 情况
            for deleted_path in deletes:
                if is_same_file(full_path, deleted_path):
                    print(f"⚠️ {file_path}: Link to deleted file {link}")
                    change_detected = True

            # 处理死链修复
            if not os.path.exists(full_path):
                # 说明当前 link 是坏的
                file_base = os.path.basename(link)
                file_base = remove_suffix(file_base, ".md")
                file_base = remove_suffix(file_base, ".mdx")

                found_path = find_nearest_file(file_base, os.path.dirname(file_path))
                if found_path:
                    relative_to_path = os.path.relpath(found_path, os.path.dirname(file_path))
                    relative_to_path = remove_suffix(relative_to_path, ".md")
                    relative_to_path = remove_suffix(relative_to_path, ".mdx")
                    print(f"🛠️ {file_path}: Fixed broken link {link} -> {relative_to_path}")
                    new_content = new_content.replace(f"({link})", f"({relative_to_path})")
                    change_detected = True
                else:
                    print(f"❌ {file_path}: Could not fix broken link {link}")
                    change_detected = True

    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

def extract_file_changes(git_show_output: List[AnyStr]):
    print(f"Parsing commit lines...")
    content = b"".join(git_show_output).decode()

    move_pattern = r"rename from (.+?)\nrename to (.+?)\n"
    move_matches = re.findall(move_pattern, content, re.DOTALL | re.MULTILINE)
    print(f"Moved files detected: {len(move_matches)}")

    delete_pattern = r"diff --git a/(\S+) b/\1\ndeleted file mode \d+\nindex .+"
    delete_matches = re.findall(delete_pattern, content, re.DOTALL | re.MULTILINE)
    print(f"Deleted files detected: {len(delete_matches)}")

    global move_pairs
    global deletes
    move_pairs = move_matches
    deletes = delete_matches

def travel(root_path: str):
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                process_md_file(os.path.join(root, file))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix moved/deleted/broken md links for a commit")
    parser.add_argument("commit_id", type=str, help="Git commit id to check")
    args = parser.parse_args()

    p = subprocess.Popen(
        "git show " + args.commit_id,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    extract_file_changes(p.stdout.readlines())

    for dir in search_dirs:
        travel(dir)

    if change_detected:
        print("❗ Link issues detected and/or fixed.")
        sys.exit(1)
    else:
        print("✅ No issues detected.")
