---
{
    "title": "Release 4.0.3",
    "language": "en",
    "description": "Here's the Apache Doris 4.0.3 release notes:"
}
---

# Features

## AI & Search

- Add inverted index NORMALIZER support
- Implement es-like boolean query [#58545](https://github.com/apache/doris/pull/58545)
- Introduce lucene bool mode for search function [#59394](https://github.com/apache/doris/pull/59394)

## Lakehouse

- Support for Loading Catalog Credentials via AwsCredentialsProviderChain [#58740](https://github.com/apache/doris/pull/58740)
- Support Paimon DLF Catalog Using OSSHDFS Storage [#59245](https://github.com/apache/doris/pull/59245)
- Add manifest-level cache for Iceberg tables [#59056](https://github.com/apache/doris/pull/59056)

## Query Engine

- Support INTERVAL function and fix EXPORT_SET [#58885](https://github.com/apache/doris/pull/58885)
- Support function TIME_FORMAT [#58592](https://github.com/apache/doris/pull/58592)
- Support function QUANTILE_STATE_TO/FROM_BASE64 [#59664](https://github.com/apache/doris/pull/59664)

# Improvements

- Introduce load job system table [#57421](https://github.com/apache/doris/pull/57421)
- Enables views, materialized views, generated columns, and alias functions to persist session variables [#58031](https://github.com/apache/doris/pull/58031)
- Add sql received from table query plan action into audit log [#58739](https://github.com/apache/doris/pull/58739)
- Enable stream load record to audit log system table [#57530](https://github.com/apache/doris/pull/57530)
- Optimize Complex Type Column Reading with Column Purning
- Compatible with mysql MOD syntax [#58432](https://github.com/apache/doris/pull/58432)
- Add dynamic configuration for sql_digest generation [#59102](https://github.com/apache/doris/pull/59102)
- Use Youngs-Cramer for REGR_SLOPE/INTERCEPT to align with PG [#55940](https://github.com/apache/doris/pull/55940)

# Bugfixes

- Fix JNI global reference leak in JdbcConnector close [#58574](https://github.com/apache/doris/pull/58574)
- Fix sync mv could not be chosen by cbo stable because stats upload from be not in time [#58720](https://github.com/apache/doris/pull/58720)
- Replace invalid JSONB with default JSONB null value [#59007](https://github.com/apache/doris/pull/59007)
- Fix NPE in OlapTableSink.createPaloNodesInfo due to concurrent drop backend [#58999](https://github.com/apache/doris/pull/58999)
- Fix FROM DUAL incorrectly matching table names starting with dual [#59003](https://github.com/apache/doris/pull/59003)
- Fix warm up cancel failure when BE is down [#58035](https://github.com/apache/doris/pull/58035)
- Fix mv rewrite failed when mv is rewritten by LimitAggToTopNAgg but query is not [#58974](https://github.com/apache/doris/pull/58974)
- Fix lastUpdateTime not updated on refresh and add scheduled refresh logs [#58997](https://github.com/apache/doris/pull/58997)
- Fix core if hll_from_base64 input invalid [#59106](https://github.com/apache/doris/pull/59106)
- Fix the sensitivity issue of load column mapping with expressions [#59149](https://github.com/apache/doris/pull/59149)
- Fix drop table not drop constraint related info [#58958](https://github.com/apache/doris/pull/58958)
- Fix parquet topn lazy mat complex data error result [#58785](https://github.com/apache/doris/pull/58785)
- Always create data and index page cache to avoid null pointer [#59266](https://github.com/apache/doris/pull/59266)
- Modify tablet cooldownConfLock to reduce memory [#59356](https://github.com/apache/doris/pull/59356)
- Fix read parquet footer missing profile
- Fix potential use-after-free in Exception::to_string [#59558](https://github.com/apache/doris/pull/59558)
- Fix float field to_string
- Fix hudi parquet read cause be core [#58532](https://github.com/apache/doris/pull/58532)
- Fix Kerberos auth config detection [#59748](https://github.com/apache/doris/pull/59748)
- Fix sync failure under empty tables [#59735](https://github.com/apache/doris/pull/59735)
- Fix parquet type not handle float16 [#58528](https://github.com/apache/doris/pull/58528)
- Fix BM25 LENGTH_TABLE norm decoding [#59713](https://github.com/apache/doris/pull/59713)
- Avoid false alarm of some datelike functions [#59897](https://github.com/apache/doris/pull/59897)