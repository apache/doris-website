---
{
    "title": "Doris Flink Connector",
    "language": "en",
    "description": "Doris Flink Connector release notes."
}
---

# Doris Flink Connector

This document lists Doris Flink Connector release notes in reverse chronological order.

## 26.1.1

Source: [Release Note 26.1.1](https://github.com/apache/doris-flink-connector/issues/654)

### Bug Fixes

- Fixed an issue where batch sinks might freeze during prolonged operation when compression is enabled. [#653](https://github.com/apache/doris-flink-connector/pull/653)

### Thanks

- @addu390

## 26.1.0

Source: [Release Note 26.1.0](https://github.com/apache/doris-flink-connector/issues/649)

### Features and Improvements

- Enabled gzip compression by default for Stream Load. [#648](https://github.com/apache/doris-flink-connector/pull/648)

### Thanks

- @JNSimba

## 26.0.0

Source: [Release Note 26.0.0](https://github.com/apache/doris-flink-connector/issues/637)

### Features and Improvements

- Supported the Doris `DECIMAL256` type. [#628](https://github.com/apache/doris-flink-connector/pull/628)
- Supported nested type fields in `ArrayData`. [#606](https://github.com/apache/doris-flink-connector/pull/606)
- Supported HTTP requests with UTF-8 charset encoding. [#623](https://github.com/apache/doris-flink-connector/pull/623)
- Added configurable Thrift max message size. [#593](https://github.com/apache/doris-flink-connector/pull/593)
- Optimized MongoDB CDC type inference to avoid unnecessary decimal conversion. [#596](https://github.com/apache/doris-flink-connector/pull/596)
- Improved the error message when the FE host is invalid. [#629](https://github.com/apache/doris-flink-connector/pull/629)
- Supported Flink 2.x. [#636](https://github.com/apache/doris-flink-connector/pull/636)

### Bug Fixes

- Fixed label handling during group commit retries. [#635](https://github.com/apache/doris-flink-connector/pull/635)
- Fixed batch Stream Load handling for types that do not have line delimiters. [#619](https://github.com/apache/doris-flink-connector/pull/619)
- Fixed incorrect DDL generation when a Doris field has an empty string as its default value. [#600](https://github.com/apache/doris-flink-connector/pull/600)
- Fixed a typo in `BackendClient` that could affect Arrow Flight reads. [#622](https://github.com/apache/doris-flink-connector/pull/622)

### Thanks

- @QuakeWang
- @JNSimba
- @jqcc
- @potterhe
- @kwonder0926
- @gnehil
- @keytouch
- @AlexRiedler

## 25.1.0

Source: [Release Note 25.1.0](https://github.com/apache/doris-flink-connector/issues/590)

### Features and Improvements

- Automatically created new synchronization tables in sharding scenarios. [#564](https://github.com/apache/doris-flink-connector/pull/564)
- Used Arrow Flight SQL as the default read path for Doris Source. [#574](https://github.com/apache/doris-flink-connector/pull/574)
- Added integration and end-to-end test cases. [#569](https://github.com/apache/doris-flink-connector/pull/569) [#577](https://github.com/apache/doris-flink-connector/pull/577) [#580](https://github.com/apache/doris-flink-connector/pull/580)
- Added compatibility for reading the IP type in Doris 2.1.3 and later. [#576](https://github.com/apache/doris-flink-connector/pull/576)
- Added release scripts. [#567](https://github.com/apache/doris-flink-connector/pull/567)
- Increased the retry interval in batch mode. [#579](https://github.com/apache/doris-flink-connector/pull/579)
- Automatically created new tables for MongoDB CDC synchronization. [#573](https://github.com/apache/doris-flink-connector/pull/573)
- Added usage examples. [#589](https://github.com/apache/doris-flink-connector/pull/589)

### Bug Fixes

- Fixed an issue where the Flink task could get stuck after the Stream Load thread exits abnormally. [#578](https://github.com/apache/doris-flink-connector/pull/578)
- Fixed type conversion issues in PostgreSQL CDC synchronization. [#582](https://github.com/apache/doris-flink-connector/pull/582)
- Fixed schema length mismatch for non-`_id` ObjectId fields in MongoDB CDC synchronization. [#588](https://github.com/apache/doris-flink-connector/pull/588)

### Thanks

- @Aalron
- @JNSimba
- @kwonder0926
- @vinlee19

## 25.0.0

Source: [Release Note 25.0.0](https://github.com/apache/doris-flink-connector/issues/562)

### Features and Improvements

- Supported reading catalog tables through Arrow Flight SQL. [#530](https://github.com/apache/doris-flink-connector/pull/530)
- Supported `INSERT OVERWRITE`. [#544](https://github.com/apache/doris-flink-connector/pull/544)
- Supported partial limit pushdown. [#553](https://github.com/apache/doris-flink-connector/pull/553)
- Concatenated the `doris.filter.query` option during pushdown. [#552](https://github.com/apache/doris-flink-connector/pull/552)
- Added compatibility for FE API changes by supporting configurable response fields to ignore. [#549](https://github.com/apache/doris-flink-connector/pull/549)
- Optimized MongoDB CDC `sampleSize` calculation logic. [#542](https://github.com/apache/doris-flink-connector/pull/542)
- Ignored failed MongoDB schema changes. [#537](https://github.com/apache/doris-flink-connector/pull/537)
- Added prefixes for lookup queries and Arrow Flight queries. [#531](https://github.com/apache/doris-flink-connector/pull/531) [#530](https://github.com/apache/doris-flink-connector/pull/530)

### Bug Fixes

- Fixed an issue where write errors could bypass checkpoints in extreme cases. [#560](https://github.com/apache/doris-flink-connector/pull/560) [#555](https://github.com/apache/doris-flink-connector/pull/555)
- Fixed an issue where writes could get stuck when an HTTP error occurs. [#539](https://github.com/apache/doris-flink-connector/pull/539)
- Fixed parsing issues for MongoDB timestamp and array types. [#547](https://github.com/apache/doris-flink-connector/pull/547)
- Fixed the ORA-12733 issue when many tables are synchronized. [#532](https://github.com/apache/doris-flink-connector/pull/532)
- Fixed timestamp format pushdown errors. [#528](https://github.com/apache/doris-flink-connector/pull/528)
- Fixed inaccurate parsing of SQL parser schema table comments and field types. [#540](https://github.com/apache/doris-flink-connector/pull/540)
- Fixed the `Transfer-Encoding` header already present error. [#525](https://github.com/apache/doris-flink-connector/pull/525)
- Fixed a null pointer exception in multi-database synchronization. [#534](https://github.com/apache/doris-flink-connector/pull/534)

### Thanks

- @awol2005ex
- @DongLiang-0
- @JNSimba
- @nativeCat
- @vinlee19
- @xuqinghuang
