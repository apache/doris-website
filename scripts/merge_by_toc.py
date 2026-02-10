#!/usr/bin/env python3
# coding: utf8



from __future__ import print_function, unicode_literals

import re
import os

followups = []
in_toc = False
contents = []

# 定义正则表达式模式
hyper_link_pattern = re.compile(r'\[(.*?)\]\((.*?)(#.*?)?\)')  # 匹配Markdown中的超链接
toc_line_pattern = re.compile(r'([\-\+]+)\s\[(.*?)\]\((.*?)(#.*?)?\)')  # 匹配TOC中的行
image_link_pattern = re.compile(r'!\[(.*?)\]\((.*?)\)')  # 匹配Markdown中的图片链接
level_pattern = re.compile(r'(\s*[\-\+]+)\s')  # 匹配TOC中的层级
heading_patthern = re.compile(r'(^#+|\n#+)\s')  # 匹配Markdown中的标题
copyable_snippet_pattern = re.compile(r'{{< copyable .* >}}')  # 匹配可复制的代码段

entry_file = "TOC.md"  # 入口文件

# 第1步，解析TOC文件
with open(entry_file) as fp:  # 打开TOC文件
    level = 0  # 初始化层级
    current_level = ""  # 初始化当前层级
    for line in fp:  # 逐行读取文件内容
        if not in_toc and not line.startswith("<!-- "):  # 判断是否进入TOC部分
            in_toc = True  # 设置标志，表示进入TOC部分
        elif in_toc and not line.startswith('#') and line.strip():  # 处理TOC中的有效行
            level_space_str = level_pattern.findall(line)[0][:-1]  # 获取行的层级字符串
            level = len(level_space_str) // 2 + 1  # 计算层级

            matches = toc_line_pattern.findall(line)  # 查找匹配的TOC行
            if matches:  # 如果有匹配的行
                for match in matches:  # 处理每一个匹配
                    fpath = match[2]  # 获取文件路径
                    if fpath.endswith('.md'):  # 如果是Markdown文件
                        fpath = fpath[1:]  # 移除路径开头的斜杠
                        key = ('FILE', level, fpath)  # 创建键
                        if key not in followups:  # 如果键不在followups中
                            followups.append(key)  # 添加键到followups
                    elif fpath.startswith('http'):  # 如果是HTTP链接
                        followups.append(('TOC', level, line.strip()[2:]))  # 添加HTTP链接到followups
            else:  # 如果没有匹配的行
                name = line.strip().split(None, 1)[-1]  # 获取目录项名称
                key = ('TOC', level, name)  # 创建键
                if key not in followups:  # 如果键不在followups中
                    followups.append(key)  # 添加键到followups

        else:
            pass  # 忽略其他行

# 第2步，获取文件标题
file_link_name = {}  # 用于存储文件链接名称
title_pattern = re.compile(r'(^#+)\s.*')  # 匹配标题
title_json_pattern = re.compile(r'"title":\s*"(.*?)"')  # 匹配JSON中的title
for tp, lv, f in followups:  # 遍历followups
    if tp != 'FILE':  # 如果类型不是文件，跳过
        continue
    try:
        with open(f) as file:  # 打开文件
            lines = file.readlines()  # 读取文件所有行
            json_str = lines[2].strip()  # 读取第三行的JSON字符串
            print(f"json_str: {json_str}")
            title_match = title_json_pattern.search(json_str)  # 匹配JSON中的title
            if title_match:
                title = title_match.group(1)  # 提取title
                file_link_name[f] = title.lower().replace(' ', '-')  # 存储标题链接名称
                print(f"File: {f}, Title: {title}")  # 打印文件名和标题
    except Exception as e:  # 捕获异常
        print(e)  # 打印异常

# 替换链接
def replace_link_wrap(chapter, name):
    def replace_link(match):
        full = match.group(0)  # 获取完整的匹配
        link_name = match.group(1)  # 获取链接名称
        link = match.group(2)  # 获取链接地址
        frag = match.group(3)  # 获取链接片段
        if link.startswith('http'):  # 如果是HTTP链接
            return full  # 返回完整匹配
        elif link.endswith('.md') or '.md#' in link:  # 如果是Markdown文件链接
            if not frag:  # 如果没有片段
                link = link[1:]  # 去掉开头的斜杠
                for fpath in file_link_name:  # 遍历文件链接名称
                    if link == fpath:  # 如果链接匹配
                        frag = '#' + file_link_name[fpath]  # 添加片段
            return '[%s](%s)' % (link_name, frag)  # 返回替换后的链接
        elif link.endswith('.png') or link.endswith('.jpeg') or link.endswith('.svg') or link.endswith('.gif') or link.endswith('.jpg'):  # 如果是图片链接
            img_link = re.sub(r'[\.\/]*images\/', 'static/images/', link, count=0, flags=0)  # 替换图片路径
            return '[%s](%s)' % (link_name, img_link)  # 返回替换后的图片链接
        else:
            return full  # 返回完整匹配

    return hyper_link_pattern.sub(replace_link, chapter)  # 替换章节中的链接

# 替换标题级别
def replace_heading_func(diff_level=0):
    def replace_heading(match):
        if diff_level == 0:  # 如果没有级别差异
            return match.group(0)  # 返回原始匹配
        else:
            return '\n' + '#' * (match.group(0).count('#') + diff_level) + ' '  # 返回调整后的标题

    return replace_heading  # 返回替换函数

# 移除可复制代码段
def remove_copyable(match):
    return ''  # 返回空字符串，移除代码段

# 处理特殊字符的函数
def handle_special_characters(chapter):
    chapter = chapter.replace("\\", "\\textbackslash{}")  # 替换反斜杠
    chapter = chapter.replace("~", "\\textasciitilde{}")  # 替换波浪号
    chapter = chapter.replace("^", "\\textasciicircum{}")  # 替换脱字符
    return chapter  # 返回处理后的章节

# 第3步，合并文件
for type_, level, name in followups:  # 遍历followups
    if type_ == 'TOC':  # 如果类型是TOC
        contents.append("\n{} {}\n".format('#' * level, name))  # 添加目录项到内容
    elif type_ == 'RAW':  # 如果类型是RAW
        contents.append(name)  # 添加原始内容
    elif type_ == 'FILE':  # 如果类型是文件
        try:
            with open(name) as fp:  # 打开文件
                chapter = fp.read()  # 读取文件内容
                chapter = replace_link_wrap(chapter, name)  # 替换链接
                chapter = copyable_snippet_pattern.sub(remove_copyable, chapter)  # 移除可复制代码段

                # 处理特殊字符
                chapter = handle_special_characters(chapter)

                # 修正标题级别
                diff_level = level - heading_patthern.findall(chapter)[0].count('#')
                chapter = heading_patthern.sub(replace_heading_func(diff_level), chapter)  # 替换标题级别
                
                # 查找第二个---的位置
                second_dash_pos = chapter.find('---', chapter.find('---') + 1)

                if second_dash_pos != -1:
                    # 在第二个---之后插入一级标题
                    chapter = chapter[:second_dash_pos + 3] + f"\n\n# {file_link_name[name]}\n\n" + chapter[second_dash_pos + 3:]

                contents.append(chapter)  # 添加章节到内容
        except Exception as e:  # 捕获异常
            print(e)  # 打印异常

# 第4步，生成最终文档
target_doc_file = 'doc.md'  # 目标文档文件名
with open(target_doc_file, 'w') as fp:  # 打开目标文档文件
    fp.write('\n'.join(contents))  # 写入内容到文件