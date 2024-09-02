#!/bin/bash

# bash scripts/test_error.sh inputFilePath outputFilePath

set +e

MAINFONT="WenQuanYi Micro Hei"
MONOFONT="WenQuanYi Micro Hei Mono"

_version_tag="$(date '+%Y%m%d')"

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <directory_path> <output_directory>"
    exit 1
fi

INPUT_DIRECTORY=$1
OUTPUT_DIRECTORY=$2

if [ ! -d "$INPUT_DIRECTORY" ]; then
    echo "Error: Directory $INPUT_DIRECTORY does not exist."
    exit 1
fi

mkdir -p "$OUTPUT_DIRECTORY"

find "$INPUT_DIRECTORY" -type f -name "*.md" | while read -r FILE; do

    filename=$(basename -- "$FILE")
    filename="${filename%.*}"

    output_file="${OUTPUT_DIRECTORY}/${filename}.pdf"

    echo "Processing $FILE..."

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

    if [ $? -ne 0 ]; then
        echo "Error processing $FILE"
    else
        echo "Successfully"
    fi
done

echo "All markdown files processed."