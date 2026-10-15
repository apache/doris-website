#!/usr/bin/env bash
# Extract the user-facing "surface" diff between two Doris refs.
#
# usage: surface-diff.sh <doris-repo> <from-ref> <to-ref> <out-dir>
#
# Writes one .diff per surface area plus summary.txt (only +/- lines, no context)
# so the reader can see every added/removed/changed config, session variable,
# grammar rule, builtin function, system-table column, HTTP endpoint, metric,
# shipped conf file line and dependency version WITHOUT trusting commit messages.
set -euo pipefail
REPO=$1; FROM=$2; TO=$3; OUT=$4
mkdir -p "$OUT"
cd "$REPO"
git rev-parse --verify -q "$FROM^{commit}" >/dev/null || { echo "unknown ref: $FROM" >&2; exit 1; }
git rev-parse --verify -q "$TO^{commit}"   >/dev/null || { echo "unknown ref: $TO" >&2; exit 1; }

area() { # name, then pathspecs
  local name=$1; shift
  git diff "$FROM".."$TO" -- "$@" > "$OUT/$name.diff" 2>/dev/null || true
  local n; n=$(grep -cE '^[+-]' "$OUT/$name.diff" 2>/dev/null || echo 0)
  printf '%-16s %6s changed lines  (%s)\n' "$name" "$n" "$*" >> "$OUT/summary.txt"
}
: > "$OUT/summary.txt"
echo "# surface diff $FROM..$TO" >> "$OUT/summary.txt"

area fe-config      'fe/fe-common/src/main/java/org/apache/doris/common/Config.java'
area session-var    'fe/fe-core/src/main/java/org/apache/doris/qe/SessionVariable.java' \
                    'fe/fe-core/src/main/java/org/apache/doris/qe/GlobalVariable.java'
area be-config      'be/src/common/config.cpp' 'be/src/common/config.h' 'be/src/cloud/config.cpp' 'be/src/cloud/config.h'
area ms-config      'cloud/src/common/config.h'
area grammar        'fe/fe-core/src/main/antlr4/**'
area functions      'fe/fe-core/src/main/java/org/apache/doris/catalog/Builtin*.java' \
                    'fe/fe-core/src/main/java/org/apache/doris/nereids/trees/expressions/functions/**'
area schema-tables  'fe/fe-core/src/main/java/org/apache/doris/catalog/SchemaTable.java' \
                    'fe/fe-core/src/main/java/org/apache/doris/catalog/InternalSchema.java' \
                    'fe/fe-core/src/main/java/org/apache/doris/catalog/InternalSchemaInitializer.java'
area show-commands  'fe/fe-core/src/main/java/org/apache/doris/nereids/trees/plans/commands/Show*.java' \
                    'fe/fe-core/src/main/java/org/apache/doris/nereids/trees/plans/commands/Admin*.java'
area http-be        'be/src/service/http_service.cpp' 'be/src/service/http/action/**' 'be/src/http/action/**'
area http-fe        'fe/fe-core/src/main/java/org/apache/doris/httpv2/**'
area metrics        'fe/fe-core/src/main/java/org/apache/doris/metric/MetricRepo.java' 'be/src/util/doris_metrics.*' 'be/src/util/metrics.*'
area properties     'fe/fe-core/src/main/java/org/apache/doris/common/util/PropertyAnalyzer.java' \
                    'fe/fe-core/src/main/java/org/apache/doris/datasource/property/**' \
                    'fe/fe-common/src/main/java/org/apache/doris/job/cdc/DataSourceConfigKeys.java'
area conf-files     'conf/fe.conf' 'conf/be.conf' 'conf/apache_hdfs_broker.conf' 'bin/*.sh'
area deps           'fe/pom.xml' 'thirdparty/vars.sh' 'be/CMakeLists.txt'
area build-modules  'build.sh' 'fe/be-java-extensions/pom.xml'

# Quick-read extracts (only +/- lines, drop file headers)
for f in fe-config session-var be-config ms-config grammar functions schema-tables conf-files deps; do
  { echo "===== $f ====="; grep -E '^[+-]' "$OUT/$f.diff" | grep -vE '^[+-]{3}' ; echo; } >> "$OUT/summary.txt" 2>/dev/null || true
done

# Config/variable identifiers that appear in the diffs — handy for check-version-claims.py
{
  grep -hoE '^\+\s*public static [a-zA-Z_<>\[\]]+ [a-z0-9_]+ *=' "$OUT/fe-config.diff" | sed -E 's/.* ([a-z0-9_]+) *=/\1/' | sed 's/^/fe-config /'
  grep -hoE '^\+.*name = "[a-z0-9_]+"' "$OUT/session-var.diff" | sed -E 's/.*name = "([a-z0-9_]+)".*/\1/' | sed 's/^/session-var /'
  grep -hoE '^\+.*VarAttr\(name = [A-Z0-9_]+' "$OUT/session-var.diff" | sed -E 's/.*name = ([A-Z0-9_]+).*/\1/' | sed 's/^/session-var-const /'
  grep -hoE '^\+DE(FINE|CLARE)_[A-Za-z0-9]+\([a-z0-9_]+' "$OUT/be-config.diff" | sed -E 's/.*\(//' | sed 's/^/be-config /'
  grep -hoE '^-\s*public static [a-zA-Z_<>\[\]]+ [a-z0-9_]+ *=' "$OUT/fe-config.diff" | sed -E 's/.* ([a-z0-9_]+) *=/\1/' | sed 's/^/REMOVED fe-config /'
  grep -hoE '^-DE(FINE|CLARE)_[A-Za-z0-9]+\([a-z0-9_]+' "$OUT/be-config.diff" | sed -E 's/.*\(//' | sed 's/^/REMOVED be-config /'
} | sort -u > "$OUT/identifiers.txt" || true

echo "wrote $OUT/summary.txt ($(wc -l < "$OUT/summary.txt") lines) and $(ls "$OUT"/*.diff | wc -l | tr -d ' ') diff files"
echo "identifiers: $OUT/identifiers.txt ($(wc -l < "$OUT/identifiers.txt") entries)"
