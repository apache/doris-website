#!/usr/bin/env python3
"""Compare the default value / presence of Doris configs and session variables
between two refs (typically the release tag and upstream master).

usage:
  compare-refs.py <doris-repo> <ref-a> <ref-b> <identifier>...
  compare-refs.py <doris-repo> <ref-a> <ref-b> --from-file identifiers.txt

Identifiers are config / session-variable NAMES as the user sees them
(e.g. enable_expr_zonemap_filter, autobucket_min_buckets,
group_commit_max_wal_num_per_table). Each one is looked up in
  FE Config.java (public static <type> <name> = <default>)
  SessionVariable.java (@VarAttr(name = "<name>" or CONST) -> field default)
  be/src/common/config.cpp and be/src/cloud/config.cpp (DEFINE_*(name, "default"))
  cloud/src/common/config.h (CONF_*(name, "default"))
and reported per ref. Lines marked <== DIFF need a dev-doc decision:
absent on master -> omit from dev docs; different default -> state master's.

Why this exists: in the 4.1.4 round four variables backported to branch-4.1
did not exist on master at all, and three defaults differed. The dev docs
describe master, so porting the 4.x text verbatim would have been wrong.
"""
import re, subprocess, sys, os

def show(repo, ref, path):
    r = subprocess.run(['git', '-C', repo, 'show', f'{ref}:{path}'], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else ''

FILES = {
    'fe':   ['fe/fe-common/src/main/java/org/apache/doris/common/Config.java'],
    'sv':   ['fe/fe-core/src/main/java/org/apache/doris/qe/SessionVariable.java',
             'fe/fe-core/src/main/java/org/apache/doris/qe/GlobalVariable.java'],
    'be':   ['be/src/common/config.cpp', 'be/src/cloud/config.cpp'],
    'ms':   ['cloud/src/common/config.h'],
}

def fe_default(txt, name):
    m = re.search(r'\n\s*public static (?:volatile\s+)?[\w<>\[\]]+\s+' + re.escape(name) + r'\s*=\s*([^;]+);', txt)
    if not m:
        return None
    # the annotation is the nearest preceding @ConfField; stop at the previous field declaration
    before = txt[:m.start()]
    ann_start = before.rfind('@ConfField')
    prev_field = before.rfind('public static')
    if ann_start < 0 or ann_start < prev_field:
        return f'{m.group(1).strip()} (no @ConfField?)'
    ann = before[ann_start:]
    mut = 'mutable=true' if re.search(r'mutable\s*=\s*true', ann) else 'mutable=false'
    return f'{m.group(1).strip()} ({mut})'

def sv_default(txt, name):
    # name = "<name>" literal, or name = CONST where CONST = "<name>"
    const = None
    mc = re.search(r'String\s+([A-Z0-9_]+)\s*=\s*"' + re.escape(name) + r'"', txt)
    if mc:
        const = mc.group(1)
    # branch-4.x uses @VariableMgr.VarAttr, master uses @VarAttrDef.VarAttr; accept any qualifier
    pat = r'@(?:\w+\.)?VarAttr\(\s*name\s*=\s*(?:"' + re.escape(name) + r'"' + (r'|' + re.escape(const) if const else '') + r')\b'
    m = re.search(pat, txt)
    if not m:
        return None
    tail = txt[m.end():m.end() + 3000]
    f = re.search(r'\n\s*(?:public|private|protected)\s+(?:static\s+)?[\w<>\[\],\s]+?\s+(\w+)\s*=\s*([^;]+);', tail)
    if not f:
        return '?(field not found)'
    val = f.group(2).strip()
    flags = []
    if re.search(r'varType\s*=\s*VariableAnnotation\.EXPERIMENTAL', txt[m.start():m.end()+600]): flags.append('EXPERIMENTAL')
    if re.search(r'needForward\s*=\s*true', txt[m.start():m.end()+600]): flags.append('needForward')
    return val + (' [' + ','.join(flags) + ']' if flags else '')

def be_default(txt, name):
    m = re.search(r'DEFINE_([A-Za-z0-9]+)\(\s*' + re.escape(name) + r'\s*,\s*("(?:[^"\\]|\\.)*")', txt)
    return f'{m.group(2)} ({m.group(1)})' if m else None

def ms_default(txt, name):
    m = re.search(r'CONF_([A-Za-z0-9]+)\(\s*' + re.escape(name) + r'\s*,\s*("(?:[^"\\]|\\.)*")', txt)
    return f'{m.group(2)} ({m.group(1)})' if m else None

LOOKUP = {'fe': fe_default, 'sv': sv_default, 'be': be_default, 'ms': ms_default}

def main():
    if len(sys.argv) < 5:
        print(__doc__); sys.exit(1)
    repo, a, b = sys.argv[1:4]
    ids = sys.argv[4:]
    if ids and ids[0] == '--from-file':
        ids = [l.split()[-1] for l in open(ids[1]) if l.strip() and not l.startswith('#')]
    src = {ref: {k: '\n'.join(show(repo, ref, p) for p in ps) for k, ps in FILES.items()} for ref in (a, b)}
    print(f'{"identifier":52s} {"kind":4s} {a[:22]:24s} {b[:22]:24s}')
    diffs = 0
    for name in dict.fromkeys(ids):
        found = False
        for kind, fn in LOOKUP.items():
            va, vb = fn(src[a][kind], name), fn(src[b][kind], name)
            if va is None and vb is None:
                continue
            found = True
            sa, sb = (va or 'ABSENT'), (vb or 'ABSENT')
            flag = '   <== DIFF' if sa != sb else ''
            if flag: diffs += 1
            print(f'{name:52s} {kind:4s} {sa[:22]:24s} {sb[:22]:24s}{flag}')
        if not found:
            print(f'{name:52s} ??   not found in any known config/variable file on either ref')
    print(f'\n{diffs} difference(s)')

if __name__ == '__main__':
    main()
