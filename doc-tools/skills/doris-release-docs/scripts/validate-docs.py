#!/usr/bin/env python3
"""Static checks for changed doris-website docs. No yarn build — this is the
only verification the doc trees get, so run it before every commit.

usage:
  validate-docs.py <website-repo> [--base <git-ref>] [--forbidden <file>]

Checks every .md/.mdx that differs from --base (default: working tree vs
index+HEAD via `git status`) under docs/, versioned_docs/ and i18n/:
  1. JSON front matter parses; "language" matches the tree (en / zh-CN)
  2. every relative markdown link resolves to an existing .md/.mdx
  3. .mdx files: no bare <tag> outside code fences / inline code that is not
     a known component (MDX would treat it as JSX and fail the build)
  4. no CJK characters in lines ADDED to English trees
  5. added lines contain none of the forbidden identifiers (--forbidden:
     one pattern per line, e.g. unreleased-feature config names)
  6. markdown tables in added lines keep a consistent column count within
     each table block (a row with a blockquote between rows splits a table)
Exit code 1 if anything fails.
"""
import json, os, re, subprocess, sys

KNOWN_TAGS = {'Tabs','TabItem','details','summary','br','img','b','i','p','table','tr','td','th','thead','tbody',
              'a','code','div','span','strong','em','ul','li','ol','hr','sup','sub','h1','h2','h3','h4','h5','h6',
              'center','font','pre','video','source','iframe','DorisVideo','Video','Tab','Admonition','kbd','u',
              'Head','Link','style','script','details','figure','figcaption','picture','svg','path','g','rect','circle','line','text'}

def run(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True).stdout

def changed_files(root, base):
    if base:
        out = run(['git', 'diff', '--name-only', base], root)
        files = out.split()
    else:
        out = run(['git', 'status', '--porcelain'], root)
        files = [l[3:].strip() for l in out.splitlines()]
    return sorted({f for f in files if f.endswith(('.md', '.mdx'))
                   and f.startswith(('docs/', 'versioned_docs/', 'i18n/'))})

def added_lines(root, base, rel):
    args = ['git', 'diff', '--unified=0'] + ([base] if base else []) + ['--', rel]
    out = run(args, root)
    return [l[1:] for l in out.splitlines() if l.startswith('+') and not l.startswith('+++')]

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(1)
    root = os.path.abspath(args[0]); base = None; forb = []
    if '--base' in args: base = args[args.index('--base') + 1]
    if '--forbidden' in args:
        forb = [l.strip() for l in open(args[args.index('--forbidden') + 1]) if l.strip() and not l.startswith('#')]
    files = changed_files(root, base)
    problems = []
    for rel in files:
        p = os.path.join(root, rel)
        if not os.path.isfile(p):
            continue
        t = open(p, encoding='utf-8').read()
        en_tree = rel.startswith(('docs/', 'versioned_docs/'))
        # 1 front matter
        if not t.startswith('---\n'):
            problems.append((rel, 'no front matter'))
        else:
            raw = t[4:t.index('\n---\n', 3) + 1].strip()
            fm = None
            if raw.startswith('{'):
                try:
                    fm = json.loads(raw)
                except Exception as e:
                    problems.append((rel, f'front matter is not valid JSON: {e}'))
            else:  # YAML front matter (key-features, community docs): only sanity-check the shape
                if not all(re.match(r'^(\s*-|\s*\w[\w.-]*\s*:|\s*$)', l) for l in raw.split('\n')):
                    problems.append((rel, 'front matter is neither JSON nor simple YAML'))
                m = re.search(r'^language:\s*"?([\w-]+)', raw, re.M)
                fm = {'language': m.group(1)} if m else {}
            if fm is not None:
                want = 'en' if en_tree else 'zh-CN'
                lang = fm.get('language')
                if lang is not None and lang != want and not (want == 'en' and lang == 'en-US'):
                    problems.append((rel, f'language={lang}, expected {want}'))
        # 2 relative links
        d = os.path.dirname(p)
        for m in re.finditer(r'\]\((\.\.?/[^)#\s]+)(#[^)\s]*)?\)', t):
            f = os.path.normpath(os.path.join(d, m.group(1)))
            if not (os.path.exists(f) or os.path.exists(f + '.md') or os.path.exists(f + '.mdx')):
                problems.append((rel, f'broken link {m.group(1)}'))
        # 3 mdx raw tags
        if rel.endswith('.mdx'):
            imported = set(re.findall(r'^import\s+(\w+)', t, re.M))
            for grp in re.findall(r'^import\s*\{([^}]*)\}', t, re.M):
                imported.update(x.strip().split(' as ')[-1] for x in grp.split(',') if x.strip())
            infence = False
            for i, l in enumerate(t.split('\n'), 1):
                if l.strip().startswith('```'):
                    infence = not infence; continue
                if infence: continue
                s = re.sub(r'`[^`]*`', '', l)
                for mm in re.finditer(r'<([A-Za-z][A-Za-z0-9_-]*)', s):
                    if mm.group(1) not in KNOWN_TAGS and mm.group(1) not in imported:
                        problems.append((rel, f'line {i}: bare <{mm.group(1)}> outside code (MDX/JSX risk)'))
        added = added_lines(root, base, rel)
        # 4 CJK in English trees
        if en_tree:
            for l in added:
                if re.search(r'[\u4e00-\u9fff]', l):
                    problems.append((rel, f'Chinese text in English tree: {l.strip()[:80]}'))
        # 5 forbidden identifiers
        for pat in forb:
            for l in added:
                if re.search(pat, l):
                    problems.append((rel, f'forbidden "{pat}": {l.strip()[:80]}'))
        # 6 table column consistency (per contiguous table block in the full file)
        block = []
        infence = False
        for i, l in enumerate(t.split('\n') + [''], 1):
            if l.strip().startswith('```'):
                infence = not infence
                l = ''
            if not infence and l.lstrip().startswith('|'):
                cells = re.sub(r'`[^`]*`', '', l).replace('\\|', '')
                block.append((i, cells.strip().count('|')))
            else:
                if len(block) >= 2:
                    counts = {c for _, c in block}
                    if len(counts) > 1:
                        problems.append((rel, f'table at lines {block[0][0]}-{block[-1][0]} has inconsistent column counts {sorted(counts)}'))
                block = []
    print(f'checked {len(files)} changed doc files')
    if problems:
        for rel, msg in problems:
            print(f'  {rel}: {msg}')
        print(f'{len(problems)} problem(s)')
        sys.exit(1)
    print('no problems')

if __name__ == '__main__':
    main()
