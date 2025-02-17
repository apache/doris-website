import os
import sys
import re
from collections import namedtuple

# 定义结构体存储信息，新增 sed_str 字段
FileInfo = namedtuple('FileInfo', ['target_file', 'url_line', 'url_path', 'url_count', 'relative_url', 'log_error', 'origin_url', 'sed_str'])

def find_file(file_str, search_dir, line_content):
    # 初始化结果列表
    results = []

    print(f"Processing file string: {file_str}")  # 添加调试输出

    # 提取第二个文件路径（包含行号部分）
    match = re.search(r"in file '([^']+)'", file_str)
    if match:
        base_file = match.group(1)  # 例如 "versioned_docs/version-3.0/sql-manual/sql-data-types/data-type-overview.md:67"
        parts = base_file.split(":")
        base_file_path = parts[0]        # 去掉行号部分，得到文件路径
        line_number = parts[1] if len(parts) > 1 else ""  # 冒号后的部分

        print(f"Found base file: {base_file_path}, Line: {line_number}")  # 添加调试输出

        # 从第二个文件路径获取其所在目录作为 root_dir
        root_dir = os.path.dirname(base_file_path)

        # 提取第一个文件路径
        match = re.search(r"'\.\.\/([^']+)'", file_str)
        if match:
            filename = match.group(1)
            # 获取文件名称部分（去除路径部分）
            file_base_name = os.path.basename(filename)
            # 创建目标文件名，检查是否已经有 .md 后缀
            if not file_base_name.endswith(".md"):
                target_filename = f"{file_base_name}.md"
            else:
                target_filename = file_base_name

            # 查找目录下是否有此文件，并统计文件个数
            found_files = []
            for root, dirs, files in os.walk(search_dir):
                if target_filename in files:
                    file_path = os.path.join(root, target_filename)
                    found_files.append(file_path)

            # 存储到结构体数组中
            if found_files:
                url_count = 0
                relative_url = ""
                for file in found_files:
                    # 计算文件的相对路径
                    url_path = os.path.relpath(file, os.getcwd())
                    url_count += 1

                # 如果只找到了一个 URL，输出相对于 file 目录的相对路径
                if url_count == 1:
                    relative_url = os.path.relpath(found_files[0], os.path.dirname(base_file_path))

                    # 处理 relative_url，如果不是以 ../ 开头，则加上 ./，并去掉 .md 后缀
                    if not relative_url.startswith("../"):
                        relative_url = "./" + relative_url
                    if relative_url.endswith(".md"):
                        relative_url = relative_url[:-3]

                # 提取 origin_url（从 log_error 中提取紧跟在 'link' 后并用引号括起来的路径）
                origin_url_match = re.search(r"link '([^']+)'", line_content)  # 查找 link 后面的引号内容
                origin_url = origin_url_match.group(1) if origin_url_match else ""

                # 创建 sed_str 命令
                sed_str = f"sed -i '{line_number}s|({origin_url})|({relative_url})|' {base_file_path}"

                # 将结果存储到结构体数组
                file_info = FileInfo(
                    target_file=base_file_path,
                    url_line=line_number,
                    url_path=url_path,
                    url_count=url_count,
                    relative_url=relative_url,
                    log_error=line_content,  # 存储当前行的内容
                    origin_url=origin_url,   # 存储 origin_url
                    sed_str=sed_str          # 存储 sed 命令
                )
                results.append(file_info)

            else:
                print(f"No file named {target_filename} found in {search_dir}.")
        else:
            print("No valid file path found in the input string.")
    else:
        print("No valid base file path found in the input string.")

    return results

# 新增函数：读取文件并调用 find_file
def get_deadlink(file_path, search_dir):
    results = []
    if os.path.isfile(file_path):  # 检查是否是文件
        print(f"Processing file: {file_path}")
        with open(file_path, 'r') as file:
            for line in file:
                line = line.strip()  # 去掉可能的空格和换行符
                print(f"Processing line: {line}")  # 添加调试输出
                # 调用 find_file 处理每一行，并传递当前行内容
                results.extend(find_file(line, search_dir, line))  # 将每一行的结果追加到结果列表中
    else:
        print(f"{file_path} is not a valid file.")

    return results

# 打印结构体数组中的结果
def print_results(results):
    for result in results:
        print(f"target_file >> {result.target_file}")
        print(f"url_line >> {result.url_line}")
        print(f"url_path >> {result.url_path}")
        print(f"url_count >> {result.url_count}")
        print(f"relative_url >> {result.relative_url}")
        print(f"log_error >> {result.log_error}")  # 打印 log_error
        print(f"origin_url >> {result.origin_url}")  # 打印 origin_url
        print(f"sed_str >> {result.sed_str}")  # 打印 sed_str
        print("----------------------------------------------------------------")


if __name__ == "__main__":
    # 获取输入参数
    if len(sys.argv) != 3:
        print("Usage: python find_file.py '<file_with_logs>' <search_dir>")
        sys.exit(1)

    file_with_logs = sys.argv[1]
    search_dir = sys.argv[2]

    # 处理文件并获取结果
    results = get_deadlink(file_with_logs, search_dir)

    # 打印结构体数组中的结果
    print_results(results)

