#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import hashlib

def md5_of_file(path, chunk_size=8192):
    md5 = hashlib.md5()
    with open(path, "rb") as f:
        while True:
            data = f.read(chunk_size)
            if not data:
                break
            md5.update(data)
    return md5.hexdigest()

def build_file_map(base_dir):
    """
    返回 {相对路径: 绝对路径}，只包含文件
    """
    base_dir = os.path.abspath(base_dir)
    file_map = {}
    for root, dirs, files in os.walk(base_dir):
        for name in files:
            abs_path = os.path.join(root, name)
            rel_path = os.path.relpath(abs_path, base_dir)
            file_map[rel_path] = abs_path
    return file_map

def main(dir1, dir2):
    dir1_files = build_file_map(dir1)
    dir2_files = build_file_map(dir2)

    # 两个目录中都存在的同名（相对路径相同）文件
    common_rel_paths = sorted(set(dir1_files.keys()) & set(dir2_files.keys()))

    print(f"目录1: {os.path.abspath(dir1)}")
    print(f"目录2: {os.path.abspath(dir2)}")
    print(f"共同文件数: {len(common_rel_paths)}")
    print("-" * 60)

    same_files = []
    diff_files = []

    for rel in common_rel_paths:
        path1 = dir1_files[rel]
        path2 = dir2_files[rel]

        md5_1 = md5_of_file(path1)
        md5_2 = md5_of_file(path2)

        if md5_1 == md5_2:
            same_files.append(rel)
            result = "相同"
        else:
            diff_files.append(rel)
            result = "不同"

        print(f"{rel}: {result}")

    print("-" * 60)
    print(f"内容相同的文件数: {len(same_files)}")
    print(f"内容不同的文件数: {len(diff_files)}")

    # 如需详细列表可再打印
    # print("相同文件列表:", same_files)
    # print("不同文件列表:", diff_files)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"用法: {sys.argv[0]} <目录1> <目录2>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])