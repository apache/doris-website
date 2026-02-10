#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
脚本功能：
1. 遍历 i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x 目录下的所有 md/mdx 文件
2. 如果 frontMatter 中的 title 中包含 |，则在 frontMatter 中添加 sidebar_label 属性
3. sidebar_label 的值是 title 中 | 的前面部分
4. 如果 frontMatter 中已经有 sidebar_label 了，则不修改
"""

import re
import json
import sys
from pathlib import Path


def parse_frontmatter(content):
    """解析frontMatter，支持JSON格式"""
    # 匹配frontMatter，格式为 ---\n{...}\n---
    frontmatter_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
    match = frontmatter_pattern.match(content)
    
    if not match:
        return None, content, None
    
    frontmatter_str = match.group(1).strip()
    body = content[match.end():]
    
    # 尝试解析为JSON
    try:
        frontmatter = json.loads(frontmatter_str)
        return frontmatter, body, frontmatter_str
    except json.JSONDecodeError as e:
        print(f"⚠️  无法解析 frontMatter 为 JSON: {e}")
        return None, content, None


def process_file(file_path):
    """处理单个文件"""
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"⚠️  文件不存在：{file_path}")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"⚠️  无法读取文件 {file_path}：{e}")
        return False
    
    # 解析frontMatter
    result = parse_frontmatter(content)
    if result[0] is None:
        print(f"⚠️  {file_path} 没有有效的 frontMatter，跳过")
        return False
    
    frontmatter, body, frontmatter_str = result
    
    # 检查是否已有 sidebar_label
    if 'sidebar_label' in frontmatter:
        print(f"✓  {file_path} 已有 sidebar_label，跳过")
        return False
    
    # 检查是否有 title
    title = frontmatter.get('title')
    if not title:
        print(f"⚠️  {file_path} 没有 title 属性，跳过")
        return False
    
    # 检查 title 中是否包含 |
    if '|' not in title:
        print(f"✓  {file_path} title 中不包含 |，跳过")
        return False
    
    # 提取 | 前面的部分作为 sidebar_label
    sidebar_label = title.split('|')[0].strip()
    
    # 添加 sidebar_label
    frontmatter['sidebar_label'] = sidebar_label
    
    # 重新构建内容
    # 保持原有的 JSON 格式（缩进等）
    try:
        # 尝试保持原有的格式
        new_frontmatter_str = json.dumps(frontmatter, indent=4, ensure_ascii=False)
        new_content = f"---\n{new_frontmatter_str}\n---\n\n{body}"
        
        # 写回文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓  已处理：{file_path}，添加 sidebar_label: {sidebar_label}")
        return True
    except Exception as e:
        print(f"❌ 无法写入文件 {file_path}：{e}")
        return False


def find_md_files(root_dir):
    """递归查找所有 md/mdx 文件"""
    root_path = Path(root_dir)
    md_files = []
    
    for file_path in root_path.rglob('*.md'):
        md_files.append(file_path)
    
    for file_path in root_path.rglob('*.mdx'):
        md_files.append(file_path)
    
    return md_files


def main():
    root_dir = "versioned_docs/version-2.1"
    
    if not Path(root_dir).exists():
        print(f"错误：目录 {root_dir} 不存在")
        sys.exit(1)
    
    print(f"正在查找 {root_dir} 目录下的所有 md/mdx 文件...")
    md_files = find_md_files(root_dir)
    
    if not md_files:
        print("没有找到 md/mdx 文件")
        return
    
    print(f"找到 {len(md_files)} 个 md/mdx 文件\n")
    
    processed_count = 0
    for file_path in md_files:
        if process_file(file_path):
            processed_count += 1
    
    print(f"\n处理完成！共处理 {processed_count} 个文件")


if __name__ == '__main__':
    main()

