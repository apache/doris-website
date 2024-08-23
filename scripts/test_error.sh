#!/bin/bash

# pdf纠错脚本 bash scripts/test_error.sh inputFilePath outputFilePath

# 脚本在遇到错误时不会退出
set +e

# 设置字体
MAINFONT="WenQuanYi Micro Hei"
MONOFONT="WenQuanYi Micro Hei Mono"

# 版本标签
_version_tag="$(date '+%Y%m%d')"

# 检查是否提供了两个参数
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <directory_path> <output_directory>"
    exit 1
fi

# 获取输入的目录路径和输出目录
INPUT_DIRECTORY=$1
OUTPUT_DIRECTORY=$2

# 检查输入的目录是否存在
if [ ! -d "$INPUT_DIRECTORY" ]; then
    echo "Error: Directory $INPUT_DIRECTORY does not exist."
    exit 1
fi

# 创建输出目录（如果不存在）
mkdir -p "$OUTPUT_DIRECTORY"

# 遍历目录下的所有 Markdown 文件
find "$INPUT_DIRECTORY" -type f -name "*.md" | while read -r FILE; do
    # 获取文件名（不带路径和扩展名）
    filename=$(basename -- "$FILE")
    filename="${filename%.*}"

    # 生成输出文件路径
    output_file="${OUTPUT_DIRECTORY}/${filename}.pdf"

    echo "Processing $FILE..."

    # 尝试转换文件
    pandoc -N --toc --smart --latex-engine=xelatex \
    --template=templates/template.tex \
    --listings \
    --columns=80 \
    -V title="${filename}" \
    -V date="${_version_tag}" \
    -V CJKmainfont="${MAINFONT}" \
    -V mainfont="${MAINFONT}" \
    -V sansfont="${MAINFONT}" \
    -V monofont="${MONOFONT}" \
    -V geometry:margin=1in \
    -V include-after="\\input{templates/copyright.tex}" \
    "$FILE" -s -o "$output_file"

    # 检查是否有错误
    if [ $? -ne 0 ]; then
        echo "Error processing $FILE"
    else
        echo "Successfully"
    fi
done

echo "All markdown files processed."