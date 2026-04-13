---
{
    "title": "Release 4.0.5",
    "language": "en",
    "description": "Here's the Apache Doris 4.0.5 release notes:"
}
---

# New Features & Improvements

## Index & Search
- Support MATCH projection as virtual column for inverted index (#61092)
- Add PrefixQuery, PhrasePrefixQuery, and UnionPostings support (#60701)
- Support BM25 scoring in inverted index queries (#59847)
- Implement phrase-level BM25 scoring with phrase frequency (#60331)
- Change default search mode from standard to lucene (#61055)

## Security & Authentication
- Add LDAPS support via configuration (#60275)
- Enhance Azure object storage client certificate troubleshooting (#61102)

# Bugfix

## Query & Execution
- Fix query cache inconsistency with variant subcolumns (#61709)
- Fix MATCH crash on alias slots (#61584)
- Fix set operation crash when data size exceeds 4GB (#61471)
- Fix TopN filter issues with nullable slots across outer joins (#59074)
- Fix incorrect MV functional dependency calculation (#59933)
- Fix type coercion issues in SUM and AVG (#59602)

## Functions & Types
- Add support for NDV on decimalv2 (#61546)
- Fix incorrect ABS result for decimalv2 (#61397)
- Fix LARGEINT handling in array_apply (#61081)

## Storage & Compaction
- Fix stale rowset commit issues (#61427)
- Fix compaction timeout calculation errors (#61188)
- Fix segment corruption not triggering cache retry (#61386)
- Fix move-memtable related stream write errors (#60688)

## Index & Search
- Fix deterministic reader selection for multi-index columns (#61596)
- Fix search query parsing issues with special characters (#61599)
- Fix MUST_NOT handling with NULL rows (#61200)
- Fix inverted index overflow issue (#61120)

## Load & Streaming
- Fix load memory regression (#61327)
- Fix streaming job stuck due to ignored S3 auth errors (#61284)
- Fix streaming job scheduling issues (#61249)
- Fix streaming insert replay NPE (#61253)
- Fix routine load job incorrectly cancelled after FE restart (#61046)
- Fix streaming job config not refreshed after ALTER (#61451)

## Cloud & External Systems
- Fix empty rowset handling in batch delete (#60919)
- Reject invalid admin operations in cloud mode (#60875)
- Fix RPC metric naming issues (#60745)
- Fix Iceberg table read and rewrite failures (#59984, #61112)
- Fix ES query issues with array keyword fields (#61236)

## File Cache & IO
- Fix file cache concurrency crash (#60271)
- Fix empty block file handling (#59646)

## Metadata & Job System
- Fix job scheduling and execution issues (#61467, #61284)
- Fix backup snapshot upload on invalid storage paths (#61251)

## Security & Auth
- Fix LDAP injection vulnerability by proper escaping (#61662)
- Fix password lock failure after invalid login (#61592)
- Restrict catalog privilege checks to valid operations (#61147)

## Stability & Misc
- Fix FlushToken counter inconsistency (#61684)
- Fix profile metrics inaccuracies (#61064, #61601)
- Fix timezone-related issues (#61151)
- Fix ORC heap-use-after-free crash (#61138)
- Fix frontend TVF metadata inconsistency (#61087)
- Fix insert overwrite behavior (#61082)
- Fix local shuffle strategy (#61057)
- Fix scan node missing column size metrics (#61086)
