import re
import os


def capitalize_words(text):
    # "#{1,}space{0,}word"
    pattern = r"(#{1,})\s+([a-z]+)"

    # use regex to replace
    result = re.sub(
        pattern,
        lambda match: f"{match.group(1)}{' ' * (len(match.group(0)) - len(match.group(1)) - len(match.group(2)))}{match.group(2).capitalize()}",
        text,
    )

    return result


def process_md_files(file_path):
    # read file
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # ignore codeblocks
    lines = content.split("\n")
    in_code_block = False
    new_lines = []

    for line in lines:
        if line.strip().startswith("```"):
            in_code_block = not in_code_block

        if not in_code_block:
            if not re.search(r"\b[a-z]+\.[a-z]+\b", line):
                # deal it
                line = capitalize_words(line)

        new_lines.append(line)

    new_content = "\n".join(new_lines)

    # write back
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)


# travel all doc files
def travel(root_path: str):
    for root, dirs, files in os.walk(root_path):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                md_file_path = os.path.join(root, file)
                process_md_files(md_file_path)


if __name__ == "__main__":
    # for these three directories
    travel("docs")
    travel("i18n")
    travel("versioned_docs")
