---
{
    'title': 'Apache Doris 2.1.8 just released',
    'summary': 'This version introduces continuous upgrades and enhancements in several key areas, including Lakehouse, Asynchronous Materialized Views, Query Optimizer and Execution Engine, Storage Management, and more.',
    'description': 'This version introduces continuous upgrades and enhancements in several key areas, including Lakehouse, Asynchronous Materialized Views, Query Optimizer and Execution Engine, Storage Management, and more.',
    'date': '2025-01-24',
    'author': 'Apache Doris',
    'tags': ['Release Notes'],
    "image": '/images/2.1.8.jpg'
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


Dear Community, **Apache Doris version 2.1.8 was officially released on January 24, 2025.** This version introduces continuous upgrades and enhancements in several key areas, including Lakehouse, Asynchronous Materialized Views, Query Optimizer and Execution Engine, Storage Management, and more.

- [Quick Download](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.8-rc01)

## Behavior Changes

- Add the environment variable `SKIP_CHECK_ULIMIT` to skip the ulimit value verification check within the BE process. This is only available to applications in the Docker quick start scenario. [#45267](https://github.com/apache/doris/pull/45267)
- Add the `enable_cooldown_replica_affinity` session variable to control the selection of replica affinity for queries under cold - hot separation.
- In FE, add the configurations `restore_job_compressed_serialization` and `backup_job_compressed_serialization` to solve the OOM problem of FE during backup and restore operations when the number of db tablets is extremely large. By default, these configurations are disabled, and once enabled, they cannot be downgraded.

## New Features

- The Arrow flight protocol supports accessing BE through a load - balancing device. [#43281](https://github.com/apache/doris/pull/43281)
- Now lambda expressions support capturing external columns (#45186).[#45186](https://github.com/apache/doris/pull/45186)

## Improvements

### Lakehouse

- Update the Hudi version to 0.15. And optimize the query planning performance of Hudi tables.
- Optimize the read performance of MaxCompute partitioned tables. [#45148](https://github.com/apache/doris/pull/45148)
- Support the session variable `enable_text_validate_utf8`, which can ignore the UTF8 encoding detection in CSV format. [#45537](https://github.com/apache/doris/pull/45537)
- Optimize the performance of Parquet file lazy materialization under high - filtering - rate conditions. [#46183](https://github.com/apache/doris/pull/46183)

### Asynchronous Materialized Views

- Now it supports manually refreshing partitions that do not exist in an asynchronous materialized view [#45290](https://github.com/apache/doris/pull/45290).
- Optimize the performance of transparent rewrite planning [#44786](https://github.com/apache/doris/pull/44786).

### Query Optimizer

- Improve the adaptive ability of runtime filters [#42640](https://github.com/apache/doris/pull/42640).
- Add the ability to generate original column filter conditions from filter conditions on `max/min` aggregate function columns [#39252](https://github.com/apache/doris/pull/39252)
- Add the ability to extract single - side filter conditions from join predicates [#38479](https://github.com/apache/doris/pull/38479).
- Optimize the ability of predicate derivation on set operators to better generate filter predicates [#39450](https://github.com/apache/doris/pull/39450).
- Optimize the exception handling ability of statistic information collection and usage to avoid generating unexpected execution plans when collection exceptions occur. [#43009](https://github.com/apache/doris/pull/43009) [#43776](https://github.com/apache/doris/pull/43776) [#43865](https://github.com/apache/doris/pull/43865) [#42104](https://github.com/apache/doris/pull/42104) [#42399](https://github.com/apache/doris/pull/42399) [#41729](https://github.com/apache/doris/pull/41729)

### Query Execution Engine

- Optimize the execution of queries with `limit` to end faster and avoid unnecessary data scanning [#44255](https://github.com/apache/doris/pull/44255).

### Storage Management

- CCR supports more comprehensive operations, such as `rename table`, `rename column`, `modify comment`, `drop view`, `drop rollup`, etc.
- Improve the accuracy of the broker load import progress and the performance when importing multiple compressed files.
- Improve the routine load timeout strategy and thread - pool usage to prevent routine load timeout failures and impacts on queries.

### Others

- The Docker quick - start image supports starting without setting environment parameters. Add the environment variable `SKIP_CHECK_ULIMIT` to skip the `start_be.sh` script and the swap, `max_map_count`, ulimit - related verification checks within the BE process. This is only applicable to applications in the Docker quick - start scenario.  [#45269](https://github.com/apache/doris/pull/45269)
- Add the new LDAP configuration `ldap_group_filter` for custom group filtering. [#43292](https://github.com/apache/doris/pull/43292)
- Optimize performance when using ranger. [#41207](https://github.com/apache/doris/pull/41207)
- Fix the inaccurate statistics of `scan bytes` in the audit log. [#45167](https://github.com/apache/doris/pull/45167)
- Now, the default values of columns can be correctly displayed in the `COLUMNS` system table. [#44849](https://github.com/apache/doris/pull/44849)
- Now, the definition of views can be correctly displayed in the `VIEWS` system table. [#45857](https://github.com/apache/doris/pull/45857)
- Now, the `admin` user cannot be deleted. [#44751](https://github.com/apache/doris/pull/44751)

## Bug Fixes

### Lakehouse

#### Hive

- Fix the problem of being unable to query Hive views created by Spark. [#43553](https://github.com/apache/doris/pull/43553)
- Fix the problem of being unable to correctly read some Hive Transaction tables. [#45753](https://github.com/apache/doris/pull/45753)
- Fix the problem of incorrect partition pruning when Hive table partitions contain special characters. [#42906](https://github.com/apache/doris/pull/42906)

#### Iceberg

- Fix the problem of being unable to create Iceberg tables in a Kerberos - authenticated environment. [#43445](https://github.com/apache/doris/pull/43445)
- Fix the problem of inaccurate `count(*)` queries when there are dangling deletes in Iceberg tables in some cases. [#44039](https://github.com/apache/doris/pull/44039)
- Fix the problem of query errors due to column name mismatches in Iceberg tables in some cases . [#44470](https://github.com/apache/doris/pull/44470)
- Fix the problem of being unable to read Iceberg tables when their partitions are modified in some cases .[#45367](https://github.com/apache/doris/pull/45367)

#### Paimon

- Fix the problem that the Paimon Catalog cannot access Alibaba Cloud OSS - HDFS. [#42585](https://github.com/apache/doris/pull/42585)

#### Hudi

- Fix the problem of ineffective partition pruning in Hudi tables in some cases. [#44669](https://github.com/apache/doris/pull/44669)

#### JDBC

- Fix the problem of being unable to obtain tables using the JDBC Catalog after enabling the case insensitive table name feature in some cases.

#### MaxCompute

- Fix the problem of ineffective partition pruning in MaxCompute tables in some cases[#44508](https://github.com/apache/doris/pull/44508).

#### Others

- Fix the problem of FE memory leaks caused by EXPORT tasks in some cases.[#44019](https://github.com/apache/doris/pull/44019)
- Fix the problem of being unable to access S3 object storage using the https protocol in some cases [#44242](https://github.com/apache/doris/pull/44242).
- Fix the problem of the inability to automatically refresh Kerberos authentication tickets in some cases  [#44916](https://github.com/apache/doris/pull/44916)
- Fix the problem of errors when reading Hadoop Block compressed format files in some cases. [#45289](https://github.com/apache/doris/pull/45289)
- When querying ORC - formatted data, no longer push down CHAR - type predicates to avoid possible result errors. [#45484](https://github.com/apache/doris/pull/45484)

### Asynchronous Materialized Views

- Fix the problem that when there is a CTE in the materialized view definition, it cannot be refreshed [#44857](https://github.com/apache/doris/pull/44857).
- Fix the problem that when columns are added to the base table, the asynchronous materialized view cannot hit the transparent rewrite. [#44867](https://github.com/apache/doris/pull/44867)
- Fix the problem that when the same filter predicate is included in different positions in a query, the transparent rewrite fails. [#44575](https://github.com/apache/doris/pull/44575)
- Fix the problem that when column aliases are used in filter predicates or join predicates, the transparent rewrite cannot be performed. [#44779](https://github.com/apache/doris/pull/44779)

### Inverted Index

- Fix the problem of abnormal handling of inverted index compaction. [#45773](https://github.com/apache/doris/pull/45773)
- Fix the problem that inverted index construction fails due to lock - waiting timeout. [#43589](https://github.com/apache/doris/pull/43589)
- Fix the problem of inverted index write crashes in abnormal situations. [#46075](https://github.com/apache/doris/pull/46075)
- Fix the null - pointer problem of the `match` function with special parameters. [#45774](https://github.com/apache/doris/pull/45774)
- Fix problems related to the variant inverted index and disable the use of the index v1 format for variants [#43971](https://github.com/apache/doris/pull/43971) [#45179](https://github.com/apache/doris/pull/45179/) 
- Fix the problem of crashes when setting `gram_size = 65535` for the ngram bloomfilter index [#43654](https://github.com/apache/doris/pull/43654)
- Fix the problem of incorrect calculation of DATE and DATETIME for the bloomfilter index [#43622](https://github.com/apache/doris/pull/43622)
- Fix the problem that dropping a column does not automatically drop the bloomfilter index [#44478](https://github.com/apache/doris/pull/44478)
- Reduce the memory footprint when writing the bloomfilter index [#46047](https://github.com/apache/doris/pull/46047)

### Semi-Structure Data 

- Optimize memory usage and reduce the memory consumption of the `variant` data type [#43349](https://github.com/apache/doris/pull/43349) [#44585](https://github.com/apache/doris/pull/44585) [#45734](https://github.com/apache/doris/pull/45734)
- Optimize the performance of `variant` schema copy. [#45731](https://github.com/apache/doris/pull/45731)
- Do not use `variant` as a key when automatically inferring tablet keys. [#44736](https://github.com/apache/doris/pull/44736)
- Fix the problem of changing `variant` from `NOT NULL` to `NULL` [#45734](https://github.com/apache/doris/pull/45734)
- Fix the problem of incorrect type inference of lambda functions. [#45798](https://github.com/apache/doris/pull/45798)
- Fix the coredump problem at the boundary conditions of the `ipv6_cidr_to_range` function [#46252](https://github.com/apache/doris/pull/46252)

### Query Optimizer

- Fix the potential deadlock problem caused by mutual exclusion of table read locks and optimize the lock - using logic [#45045](https://github.com/apache/doris/pull/45045) [#43376](https://github.com/apache/doris/pull/43376) [#44164](https://github.com/apache/doris/pull/44164) [#44967](https://github.com/apache/doris/pull/44967) [#45995](https://github.com/apache/doris/pull/45995).
- Fix the problem that the SQL Cache function incorrectly uses constant folding, resulting in incorrect results when using functions containing time formats . [#44631](https://github.com/apache/doris/pull/44631)
- Fix the problem of incorrect optimization of comparison expressions in edge cases, which may lead to incorrect results. [#44054](https://github.com/apache/doris/pull/44054) [#44725](https://github.com/apache/doris/pull/44725) [#44922](https://github.com/apache/doris/pull/44922) [#45735](https://github.com/apache/doris/pull/45735) [#45868](https://github.com/apache/doris/pull/45868)
- Fix the problem of incorrect audit logs for high - concurrent point queries [ #43345 ](https://github.com/apache/doris/pull/43345)[#44588](https://github.com/apache/doris/pull/44588)
- Fix the problem of continuous error reporting after an exception occurs in high - concurrent point queries [#44582](https://github.com/apache/doris/pull/44582)
- Fix the problem of incorrectly prepared statements for some fields.[#45732 ](https://github.com/apache/doris/pull/45732)

### Query Execution Engine

- Fix the problem of incorrect results of regular expressions and `like` functions for special characters. [#44547](https://github.com/apache/doris/pull/44547)
- Fix the problem that the SQL Cache may have incorrect results when switching databases. [#44782](https://github.com/apache/doris/pull/44782)
- Fix the problem of incorrect results of the `cut_ipv6` function. [#43921](https://github.com/apache/doris/pull/43921)
- Fix the problem of casting from numeric types to bool types. [#46275](https://github.com/apache/doris/pull/46275)
- Fix a series of problems related to arrow flight. [#45661](https://github.com/apache/doris/pull/45661) [#45023](https://github.com/apache/doris/pull/45023) [#43960](https://github.com/apache/doris/pull/43960) [#43929](https://github.com/apache/doris/pull/43929) 
- Fix the problem of incorrect results in some cases when the hash table of hash join exceeds 4G. [#46461](https://github.com/apache/doris/pull/46461/files)
- Fix the overflow problem of the `convert_to` function for Chinese characters. [#46505](https://github.com/apache/doris/pull/46405)

### Storage Management

- Fix the problem that high - concurrent DDL may cause FE startup failure.
- Fix the problem that auto - increment columns may have duplicate values.
- Fix the problem that routine load cannot use the newly expanded BE during expansion.

### Permission Management

- Fix the problem of frequent access to the Ranger service when using Ranger as the authentication plugin [#45645](https://github.com/apache/doris/pull/45645).

### Others

- Fix the potential memory leak problem when `enable_jvm_monitor=true` is enabled on the BE side [#44311](https://github.com/apache/doris/pull/44311).