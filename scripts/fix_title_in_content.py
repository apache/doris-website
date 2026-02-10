#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
脚本功能：
1. 获取指定commit修改的md/mdx文件
2. 如果frontMatter的title属性是 "${title} | xxxx" 格式
3. 检查文档内容中是否已有任何一级标题（# xxx 格式）
4. 如果文档中没有一级标题，则在文档开头添加 "# ${title}"（| 之前的内容）
"""

import re
import json
import subprocess
import sys
from pathlib import Path


def get_modified_files(commit_hash):
    """获取指定commit修改的md/mdx文件"""
    try:
        # 获取该commit修改的文件列表
        result = subprocess.run(
            ['git', 'diff-tree', '--no-commit-id', '--name-only', '-r', commit_hash],
            capture_output=True,
            text=True,
            check=True
        )
        
        files = result.stdout.strip().split('\n')
        # 过滤出md和mdx文件
        md_files = [f for f in files if f.endswith(('.md', '.mdx'))]
        return md_files
    except subprocess.CalledProcessError as e:
        print(f"错误：无法获取commit {commit_hash} 的信息")
        print(f"错误信息：{e.stderr}")
        sys.exit(1)
    except Exception as e:
        print(f"错误：{e}")
        sys.exit(1)


def parse_frontmatter(content):
    """解析frontMatter，支持JSON和YAML格式"""
    # 匹配frontMatter，格式为 ---\n{...}\n--- 或 ---\n...\n---
    frontmatter_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
    match = frontmatter_pattern.match(content)
    
    if not match:
        return None, content
    
    frontmatter_str = match.group(1).strip()
    body = content[match.end():]
    
    # 尝试解析为JSON
    try:
        frontmatter = json.loads(frontmatter_str)
        return frontmatter, body
    except json.JSONDecodeError:
        # 如果不是JSON，尝试解析为YAML（简单处理）
        # 这里只处理简单的key: value格式
        frontmatter = {}
        for line in frontmatter_str.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                frontmatter[key] = value
        return frontmatter, body


def check_title_format(title):
    """检查title格式是否为 "${title} | xxxx" """
    if not title or not isinstance(title, str):
        return None, None
    
    pattern = r'^(.+?)\s*\|\s*(.+)$'
    match = re.match(pattern, title)
    if match:
        main_title = match.group(1).strip()
        suffix = match.group(2).strip()
        return main_title, suffix
    return None, None


def has_heading_in_content(content, heading_text):
    """检查文档内容中是否有 "# heading_text" """
    # 匹配markdown标题，格式为 # heading_text 或 ## heading_text 等
    # 需要精确匹配，考虑标题可能在行首或行中
    pattern = r'^#{1,6}\s+' + re.escape(heading_text) + r'(?:\s|$|#)'
    return bool(re.search(pattern, content, re.MULTILINE))


def has_any_level1_heading(content):
    """检查文档内容中是否有任何一级标题（# xxx 格式）"""
    # 匹配一级标题，格式为 # 后面跟非空内容
    pattern = r'^#\s+[^\s#]'
    return bool(re.search(pattern, content, re.MULTILINE))


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
    frontmatter, body = parse_frontmatter(content)
    if not frontmatter:
        print(f"⚠️  {file_path} 没有frontMatter，跳过")
        return False
    
    # 检查title
    title = frontmatter.get('title')
    if not title:
        print(f"⚠️  {file_path} 没有title属性，跳过")
        return False
    
    # 检查title格式
    main_title, suffix = check_title_format(title)
    if not main_title or not suffix:
        print(f"⚠️  {file_path} title格式不符合要求：{title}")
        return False
    
    # 检查文档内容中是否已有任何一级标题（# xxx 格式）
    if has_any_level1_heading(body):
        print(f"✓  {file_path} 文档中已包含一级标题，跳过")
        return False
    
    # 在文档开头添加标题
    # 在frontMatter之后，body之前添加
    # 添加的是 | 之前的内容（main_title）
    new_title_line = f"# {main_title}\n\n"
    
    # 重新构建内容
    frontmatter_str = json.dumps(frontmatter, indent=4, ensure_ascii=False)
    new_content = f"---\n{frontmatter_str}\n---\n\n{new_title_line}{body}"
    
    # 写回文件
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓  已处理：{file_path}，添加标题 '# {main_title}'")
        return True
    except Exception as e:
        print(f"❌ 无法写入文件 {file_path}：{e}")
        return False


def main():
    commit_hash = "c402aa049343c669dbbb0e57c193b7957627dbef"
    
    print(f"正在获取commit {commit_hash} 修改的md/mdx文件...")
    modified_files = get_modified_files(commit_hash)
    
    if not modified_files:
        print("没有找到修改的md/mdx文件")
        return
    
    print(f"找到 {len(modified_files)} 个修改的md/mdx文件\n")
    
    processed_count = 0
    for file_path in modified_files:
        if process_file(file_path):
            processed_count += 1
        print()
    
    print(f"处理完成！共处理 {processed_count} 个文件")


if __name__ == '__main__':
    main()

