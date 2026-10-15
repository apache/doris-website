#!/usr/bin/env python3
"""Which release tags contain a given identifier? Use this BEFORE writing any
"自 X.Y.Z 版本起支持" / "Since version X.Y.Z" sentence, and to audit claims
already in the docs.

usage:
  check-version-claims.py <doris-repo> --tags 4.0.7 4.0.8 4.1.2 4.1.3 4.1.4-rc04 -- <identifier>...
  check-version-claims.py <doris-repo> --tags ... --from-file identifiers.txt
  check-version-claims.py <doris-repo> --tags ... --path be/src/common/config.h -- <identifier>...

--path restricts the search to one pathspec. Use it when FE and BE share a
name: `enable_group_commit_streamload_be_forward` existed as an FE config
since 4.0.7 but the BE config of the same name only arrived in 4.0.8 / 4.1.4,
so an unrestricted search says "since 4.0.7" and is wrong for the BE entry.
Error strings are often concatenated across lines in Java/C++ — grep a
distinctive fragment, not the whole sentence.

An identifier can be a config / variable name, an error string fragment, a
grammar token, a class name — anything git grep can find. Test directories
are excluded so a regression-test mention does not count as "supported".

Reading the table: the first tag in each release line that contains the
identifier is the version to annotate. Doris keeps several lines alive
(4.0.x and 4.1.x), so a feature backported to both needs BOTH first
versions, e.g. "Doris 4.0 系列自 4.0.8 起、4.1 系列自 4.1.4 起". In the
4.1.4 round `require_partition_filter` was documented as "4.1 系列自 4.1.2
起" — it was not in 4.1.2 or 4.1.3, only 4.1.4.
"""
import subprocess, sys

def present(repo, tag, ident, path=None):
    specs = [path] if path else [':!regression-test', ':!*/test/*', ':!be/test', ':!docker']
    r = subprocess.run(['git', '-C', repo, 'grep', '-l', '-F', '--', ident, tag, '--'] + specs,
                       capture_output=True, text=True)
    return r.returncode == 0 and r.stdout.strip() != ''

def main():
    args = sys.argv[1:]
    if not args or '--tags' not in args:
        print(__doc__); sys.exit(1)
    repo = args[0]
    ti = args.index('--tags')
    tags = []
    path = None
    i = ti + 1
    while i < len(args) and args[i] not in ('--', '--from-file', '--path'):
        tags.append(args[i]); i += 1
    if i < len(args) and args[i] == '--path':
        path = args[i + 1]; i += 2
    idents = []
    if i < len(args) and args[i] == '--from-file':
        idents = [l.split()[-1] for l in open(args[i + 1]) if l.strip() and not l.startswith('#')]
    elif i < len(args) and args[i] == '--':
        idents = args[i + 1:]
    if not tags or not idents:
        print(__doc__); sys.exit(1)
    for t in tags:
        if subprocess.run(['git', '-C', repo, 'rev-parse', '-q', '--verify', t + '^{commit}'],
                          capture_output=True).returncode != 0:
            print(f'unknown ref: {t}', file=sys.stderr); sys.exit(1)
    w = max(len(x) for x in idents) + 2
    print(' ' * w + '  '.join(f'{t:>12s}' for t in tags))
    for ident in dict.fromkeys(idents):
        cells = []
        first = None
        for t in tags:
            ok = present(repo, t, ident, path)
            cells.append(f'{"YES" if ok else "-":>12s}')
            if ok and first is None:
                first = t
        print(f'{ident:{w}s}' + '  '.join(cells) + (f'   first: {first}' if first else '   (nowhere)'))

if __name__ == '__main__':
    main()
