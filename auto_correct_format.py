import os
import sys
import subprocess

def list_files(directory):
    """Recursively traverse the directory and print all .md and .mdx file names, then run autocorrect"""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.md', '.mdx')):
                file_path = os.path.join(root, file)
                print(file_path)
                subprocess.run(["autocorrect", "--fix", file_path], check=True)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <directory_path>")
        sys.exit(1)
    
    dir_path = sys.argv[1]
    if os.path.isdir(dir_path):
        list_files(dir_path)
    else:
        print("The entered path is invalid. Please enter a valid directory path.")

