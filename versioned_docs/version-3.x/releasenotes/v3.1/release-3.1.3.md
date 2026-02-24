---
{
    "title": "Release 3.1.3",
    "language": "en",
    "description": "Apache Doris 3.1.3 brings major improvements in:"
}
---

## New Features

### Storage & Filesystem

-   Upgrade libhdfs to 3.4.2 ([#57638](https://github.com/apache/doris/pull/57638))
-   Add TotalGetRequestTime profile metric to S3 reader ([#57636](https://github.com/apache/doris/pull/57636))

### Catalog

-   Support MaxCompute catalog (project-schema-table) ([#57286](https://github.com/apache/doris/pull/57286))
-   Support retrying original SQL after error when execute dialect sql ([#57498](https://github.com/apache/doris/pull/57498))
-   Support Azure Blob Storage ([#57219](https://github.com/apache/doris/pull/57219))

### Cloud Mode

-   Support balance sync warm-up ([#57666](https://github.com/apache/doris/pull/57666))
-   Support peer BE cache read in same cluster ([#57672](https://github.com/apache/doris/pull/57672))

### SQL Engine & Planner

-   Check SQL regex block rule before plan phase ([#57706](https://github.com/apache/doris/pull/57706))

### Functions

-   Enhance EXPLODE function with struct-type support ([#57827](https://github.com/apache/doris/pull/57827))

## Optimizations

### Query Execution & Planner

-   Optimize variant cast when only NULL values ([#57161](https://github.com/apache/doris/pull/57161))
-   Optimize FROM_UNIXTIME performance ([#57573](https://github.com/apache/doris/pull/57573))
-   Improve graceful shutdown behavior and query retry ([#57805](https://github.com/apache/doris/pull/57805))

### Storage & Compaction

-   Make read slice size configurable (MergeIO) ([#57159](https://github.com/apache/doris/pull/57159))
-   Add score threshold for cold data compaction ([#57217](https://github.com/apache/doris/pull/57217))
-   Add configurable threshold for small memory task protection ([#56994](https://github.com/apache/doris/pull/56994))
-   Improve jemalloc configuration to reduce page faults ([#57152](https://github.com/apache/doris/pull/57152))

### Cloud Mode

-   Expose cloud balance metrics ([#57352](https://github.com/apache/doris/pull/57352))
-   Optimize create warm-up job logic ([#57865](https://github.com/apache/doris/pull/57865))
-   Enhance warm-up job and peer read efficiency ([#57554](https://github.com/apache/doris/pull/57554), [#57807](https://github.com/apache/doris/pull/57807))

### Index & Search

-   Add custom analyzer support (char_filter, basic & ICU tokenizer) ([#57137](https://github.com/apache/doris/pull/57137))
-   Support builtin analyzer names in custom analyzer ([#57727](https://github.com/apache/doris/pull/57727))

## Bug Fixes

### Storage & File I/O

-   Fix segcompaction coredump when adding key column ([#57212](https://github.com/apache/doris/pull/57212))
-   Fix Parquet RLE_DICTIONARY decode performance issue ([#57614](https://github.com/apache/doris/pull/57614))
-   Fix schema change expr cache misuse ([#57517](https://github.com/apache/doris/pull/57517))
-   Replace tablet report with ForkJoinPool ([#57927](https://github.com/apache/doris/pull/57927))

### Cloud Mode

-   Fix cloud pipeline task number calculation ([#57261](https://github.com/apache/doris/pull/57261))
-   Fix rebalance residual metrics cleanup ([#57438](https://github.com/apache/doris/pull/57438))
-   Skip tablet report when rebalance not inited ([#57393](https://github.com/apache/doris/pull/57393))
-   Fix domain user default cluster report error ([#57555](https://github.com/apache/doris/pull/57555))
-   Fix wrong private endpoint config ([#57675](https://github.com/apache/doris/pull/57675))
-   Fix peer read bugs and thread handling ([#57910](https://github.com/apache/doris/pull/57910), [#57807](https://github.com/apache/doris/pull/57807))
-   Fix filecache metrics and microbench issues ([#57535](https://github.com/apache/doris/pull/57535), [#57536](https://github.com/apache/doris/pull/57536))

### Catalog

-   Fix MaxCompute predicate pushdown null pointer ([#57567](https://github.com/apache/doris/pull/57567))
-   Fix Iceberg client.region and REST credentials issues ([#57539](https://github.com/apache/doris/pull/57539))
-   Fix Iceberg catalog NPE and query error ([#57796](https://github.com/apache/doris/pull/57796), [#57790](https://github.com/apache/doris/pull/57790))
-   Fix Paimon S3 prefix unification and configuration ([#57526](https://github.com/apache/doris/pull/57526))
-   Fix JDBC catalog compatibility for `zeroDateTimeBehavior` ([#57731](https://github.com/apache/doris/pull/57731))
-   Fix Parquet schema analysis error ([#57500](https://github.com/apache/doris/pull/57500))
-   Fix Parquet all row groups filtered issue ([#57646](https://github.com/apache/doris/pull/57646))
-   Fix CSV reader wrong result when escape equals enclose ([#57762](https://github.com/apache/doris/pull/57762))
-   Prevent removing catalog from refresh queue ([#57671](https://github.com/apache/doris/pull/57671))
-   Fix `max_meta_object_cache_num` must > 0 config ([#57793](https://github.com/apache/doris/pull/57793))

### SQL Engine & Planner

-   Fix constant folding of FROM_UNIXTIME with decimal literal ([#57606](https://github.com/apache/doris/pull/57606))
-   Fix MV rewrite fail with group sets and filter ([#57674](https://github.com/apache/doris/pull/57674))
-   Fix prepare statement stage only explain SQL ([#57504](https://github.com/apache/doris/pull/57504))
-   Release physical plan in Profile.releaseMemory() ([#57316](https://github.com/apache/doris/pull/57316))
-   Fix aggregation elimination error when group sets exist ([#57885](https://github.com/apache/doris/pull/57885))
-   Fix LargeInt overflow on max_value+1 ([#57351](https://github.com/apache/doris/pull/57351))
-   Fix decimal256 overflow when casting to float ([#57503](https://github.com/apache/doris/pull/57503))

### Networking & Platform

-   Fix MySQL SSL unwrap infinite loop ([#57599](https://github.com/apache/doris/pull/57599))
-   Disable TLS renegotiation in MySQL ([#57748](https://github.com/apache/doris/pull/57748))
-   Fix unaligned uint128 constructor ([#57430](https://github.com/apache/doris/pull/57430))
-   Fix JNI local/global ref leak ([#57597](https://github.com/apache/doris/pull/57597))
-   Make Scanner.close() thread-safe ([#57644](https://github.com/apache/doris/pull/57644))
-   Fix exchange coredump due to nullptr ([#57698](https://github.com/apache/doris/pull/57698))

## Chores & Infrastructure

-   Deprecated LakeSoul external catalog ([#57163](https://github.com/apache/doris/pull/57163))

## Summary

Apache Doris **3.1.3** brings major improvements in:

-   **Storage compatibility** (Azure Blob, Hadoop 3.4.2, S3 metric support)
-   **Cloud performance and reliability** (warm-up, rebalance, peer cache)
-   **SQL planner stability**
-   **Dependency modernization and security hardening**

This release greatly enhances **stability, performance, and cloud-native integration** across hybrid data environments.
