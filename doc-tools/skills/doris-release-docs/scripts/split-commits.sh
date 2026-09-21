#!/usr/bin/env bash
# List the commits in a range, split them into "touches production code" vs
# "tests / CI / docker / build scripts only", and cut the production list into
# batches for parallel subagent classification.
#
# usage: split-commits.sh <doris-repo> <from-ref> <to-ref> <out-dir> [batch-size=30]
#
# Do NOT filter by the [tag] in the subject line: in the 4.1.4 round a
# "[fix](test)" commit added a session variable and a "[fix](regression)"
# commit added a table-property validation. Only the touched paths are a
# reliable signal.
set -euo pipefail
REPO=$1; FROM=$2; TO=$3; OUT=$4; BATCH=${5:-30}
mkdir -p "$OUT"; cd "$REPO"
git log --pretty=format:'%h %s' "$FROM".."$TO" > "$OUT/commits-all.txt"
echo >> "$OUT/commits-all.txt"
: > "$OUT/commits-prod.txt"; : > "$OUT/commits-testonly.txt"
NONPROD='^(regression-test|docker|\.github|thirdparty|be/test|fe/fe-core/src/test|fe/fe-common/src/test|cloud/test|samples|tools|extension|be/benchmark)/'
while read -r h rest; do
  [ -z "$h" ] && continue
  n=$( { git show --pretty=format: --name-only "$h" | grep -v '^$' | grep -vE "$NONPROD" || true; } | wc -l | tr -d ' ')
  if [ "$n" -gt 0 ]; then echo "$h $rest" >> "$OUT/commits-prod.txt"; else echo "$h $rest" >> "$OUT/commits-testonly.txt"; fi
done < "$OUT/commits-all.txt"
( cd "$OUT" && rm -f batch-* && split -l "$BATCH" -d commits-prod.txt batch- )
printf 'all=%s  prod=%s  test-only=%s  batches=%s (size %s)\n' \
  "$(grep -c . "$OUT/commits-all.txt")" "$(grep -c . "$OUT/commits-prod.txt")" \
  "$(grep -c . "$OUT/commits-testonly.txt")" "$(ls "$OUT"/batch-* | wc -l | tr -d ' ')" "$BATCH"
echo "subject-tag histogram of production commits:"
sed -E 's/^[0-9a-f]+ //; s/^(branch-[0-9.]+: ?|\[branch-[0-9.]+\] ?)//' "$OUT/commits-prod.txt" | grep -oE '^\[[A-Za-z_ -]+\]' | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn | head -12
