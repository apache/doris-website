---
{
    "title": "Release 3.0.0",
    "language": "en"
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

Thanks to our devoted developers and supportive community users, the much-expected Apache Doris 3.0.0 is now available!

**Quick Download:** https://doris.apache.org/download/

**GitHub:** https://github.com/apache/doris/issues/37502


## Compute-Storage Decoupled

From version 3.0.0, Doris supports a compute-storage decoupled mode, allowing users to physically isolate business workloads and separate read and write operations through multiple computing clusters. This mode substantially reduces storage costs by utilizing mature object storage or HDFS. It mitigates operational complexities such as disk balancing and data loss due to multiple BE nodes going offline.

**Future-Oriented Architecture**: The architecture is selected considering complexity, performance, and scalability:

**1. Reducing Complexity**

- Decoupling OLAP layer semantics from storage implementation simplifies system maintenance and reduces operational complexity.

- Choosing production-verified mature storage systems.

- Single source of truth for metadata, greatly simplifying system complexity, such as avoiding write publishes in integrated storage-computation modes and providing strong consistency in design.

**2. Performance**

Capable of achieving the performance of integrated storage-computation mode.

**3. Scalability**

- Data scale support is no longer limited by FE memory.

- Architecture can evolve and integrate both integrated and separated storage computation.

- Easily supports time travel, data sharing, and load isolation.



Based on these considerations, the architectural choices made include:

1. A single metadata service divided into semantic and storage layers, with the storage layer choosing production-verified and transaction-capable FoundationDB.

2. Storage options include mature, low-cost object storage and HDFS.

3. To compensate for performance loss due to remote storage, local data caching has been introduced at computing nodes, combining the simplicity of a Shared Disk architecture with the performance of a Share Nothing architecture.


The overall architecture is a three-layer structure: metadata layer, computing layer, and data storage layer.

- Metadata Layer: Provides the system's metadata services, such as database tables, schemas, rowset metadata, and transactions. Currently, BE's metadata has fully transitioned to MetaService, and FE's transaction metadata has entered MetaService. Future versions will incorporate other metadata into MetaService.

- Computing Layer: Responsible for executing query plans and providing load isolation through computing clusters. Computing nodes are completely stateless, with local data acting as a cache for remote storage to accelerate queries.

- Data Storage Layer: Data is persisted to shared storage, currently supporting S3, OSS, COS, GCS, Azure Blob, MinIO, BOS, and HDFS.

[![image](https://private-user-images.githubusercontent.com/6919662/346635704-76ee422f-95a8-48a0-808c-08817e5e46c8.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjIzMzkyNTcsIm5iZiI6MTcyMjMzODk1NywicGF0aCI6Ii82OTE5NjYyLzM0NjYzNTcwNC03NmVlNDIyZi05NWE4LTQ4YTAtODA4Yy0wODgxN2U1ZTQ2YzgucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDczMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDA3MzBUMTEyOTE3WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9YTgxMGI4NTcxNzM0Y2JiZDAyNDBhZGU1ZmQwNmQzOGUzYzU4MjY3N2JjNTEwOTM4MDljNDZmMDdmZDA5NzFlZiZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ.K0UF5zzpp-qxY4YpU8vOxDfjn1VexTpiyxcl5Bv5Puc)](https://private-user-images.githubusercontent.com/6919662/346635704-76ee422f-95a8-48a0-808c-08817e5e46c8.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjIzMzkyNTcsIm5iZiI6MTcyMjMzODk1NywicGF0aCI6Ii82OTE5NjYyLzM0NjYzNTcwNC03NmVlNDIyZi05NWE4LTQ4YTAtODA4Yy0wODgxN2U1ZTQ2YzgucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDczMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDA3MzBUMTEyOTE3WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9YTgxMGI4NTcxNzM0Y2JiZDAyNDBhZGU1ZmQwNmQzOGUzYzU4MjY3N2JjNTEwOTM4MDljNDZmMDdmZDA5NzFlZiZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ.K0UF5zzpp-qxY4YpU8vOxDfjn1VexTpiyxcl5Bv5Puc)


Production Insights

**1. Operations-Friendly**

- Cache TTL: In real-time scenarios, setting the Cache TTL ensures that data within the TTL provides low-latency queries from the local cache.

- Seamless Scaling: One benefit of the compute-storage decoupled mode is the rapid elasticity of computing resources. Doris uses progressive active cache preheating technology, ensuring no impact on ongoing queries and imports during scalability periods.

- Seamless Upgrades: During upgrades, the multi-process mode operation ensures ongoing queries and imports do not fail.



**2. Load Isolation**

- Multiple Computing Clusters: Different business characteristics (e.g., batch processing, real-time) or business units (different businesses within a group) can use independent computing clusters for physical isolation.

- Read-Write Separation: Imports and queries can be completed by different computing clusters, supporting automatic (notification for preheating during import) and manual (periodic manual preheating) methods to preheat the query cluster's cache.



**3. Positive Data Deletion**

In distributed systems, common data deletion involves reverse GC, comparing files in shared storage with those recorded in metadata and deleting unrecorded files. This method can easily lead to data deletion errors under concurrent conditions. Relying on MetaService's transaction capabilities, Doris adopts asynchronous forward data deletion technology. Data generation is bound to a transaction, as is metadata deletion, and the asynchronous deletion process simply deletes data based on transaction records, eliminating the need for reverse GC.



## Optimizer

- All DQL and DML, except for load operations, will use the new optimizer. Default settings disable fallback to the old optimizer, which will be removed in subsequent versions.

- Comprehensive top-N runtime filter applicable to all query modes, enhancing performance when a top-N operator is present.

- Experimental Feature: Refactored logic for synchronized materialized view selection, transitioning from RBO to CBO to maintain consistency with asynchronous materialized views. If issues arise, the switch `set global enable_sync_mv_cost_based_rewrite = false` can be used to revert to RBO mode.

- Experimental Feature: Partition-level statistics. By activating the switch `set global enable_partition_analyze = true`, partition-level statistics can be collected and utilized, improving query performance in cases of data partition skew.

- Experimental Feature: Generated columns. When creating tables, columns can be designated as generated columns, which automatically compute results based on defined expressions at write time, offering more complex expressions compared to default values but disallowing explicit writing of specified values.

## Execution Engine

- Experimental Feature: Spill capability for core operators such as join, aggregate, and sort has reached GA usable status.

- Support for UDTFs.

- Adaptive Runtime Filter: The runtime filter adapts based on local wait times, providing better performance in large data volume and high-pressure scenarios.

- Performance Optimizations:

	- Availability of top-N rf and group limit significantly enhances performance.
  
  - Comprehensive optimization of function operators, with expected average performance improvements of 50% for commonly used functions.

## Data Lake

- All data lake write-back functionalities will be picked to the 2.1 branch, hence not introduced in the 3.0 release note.

- Trino Connector: Version 3.0 introduces a new catalog type called "Trino-Connector," compatible with most Trino connectors. Users can quickly use existing Trino connectors to connect or adapt to more data sources. Apache Doris previously supported mainstream data warehouse or data lake formats such as Hive, Iceberg, Hudi, and Paimon, providing high-performance data access. However, many data sources are still not supported. Trino, as a cross-source SQL query engine, supports a variety of data source connectors. Doris can leverage these connectors to quickly adapt to more data sources and provide faster data querying capabilities than Trino. Currently, validated Trino connectors include:

- Kafka: Documentation pending.

- BigQuery: Documentation pending.

- Redis: Documentation pending.

- [TPCH](https://doris.apache.org/docs/lakehouse/datalake-analytics/tpch)

- [TPCDS](https://doris.apache.org/docs/lakehouse/datalake-analytics/tpcds)

Developers are welcome to refer to the development guide to adapt more data sources:

- [How to contribute](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide)

- Adaptation completed for Kafka, Redis, BigQuery, TPCH, and TPCDS connectors.



## Loading Data

- Optimized routine load auto-resume strategy: In previous versions, when a routine load was paused due to an exception, it would only attempt to auto-resume three times within five minutes. If it failed three times, manual intervention was required. The new version distinguishes the reasons for routine load pauses. For pauses caused by data quality or other irrecoverable errors, auto-resume will not be attempted. For other recoverable errors, attempts to auto-resume will continue, minimizing the need for manual intervention.
- Transaction Enhancement Data processing in data warehouses is a common scenario that often requires executing multiple `insert into select`, `delete`, and `update` operations within a single transaction. For example, to update a batch of data, a `delete` operation can be performed first, followed by an `insert into select` operation. Doris 3.0 provides explicit transaction support for handling `insert into select`, `delete`, and `update` operations.
  For more detailed information, refer to: https://doris.apache.org/zh-CN/docs/dev/data-operate/import/transaction-load-manual

## Ecosystem

Complete PreparedStatements: Supports general server-side PreparedStatements. Users can enable this feature by specifying `useServerPrepStmt=true` in the JDBC URL. The server-side cache supports a maximum of 10,000 statements, exceeding which will result in a limit exception.



## Credits

Thanks to everyone who contributes to this release:

@133tosakarin, @390008457, @924060929, @AcKing-Sam, @AshinGau, @BePPPower, @BiteTheDDDDt, @ByteYue, @CSTGluigi, @CalvinKirs, @Ceng23333, @DarvenDuan, @DongLiang-0, @Doris-Extras, @Dragonliu2018, @Emor-nj, @FreeOnePlus, @Gabriel39, @GoGoWen, @HappenLee, @HowardQin, @Hyman-zhao, @INNOCENT-BOY, @JNSimba, @JackDrogon, @Jibing-Li, @KassieZ, @Lchangliang, @LemonLiTree, @LiBinfeng-01, @LompleZ, @M1saka2003, @Mryange, @Nitin-Kashyap, @On-Work-Song, @SWJTU-ZhangLei, @StarryVerse, @TangSiyang2001, @Tech-Circle-48, @Thearas, @Vallishp, @WinkerDu, @XieJiann, @XuJianxu, @XuPengfei-1020, @Yukang-Lian, @Yulei-Yang, @Z-SWEI, @ZhongJinHacker, @adonis0147, @airborne12, @allenhooo, @amorynan, @bingquanzhao, @biohazard4321, @bobhan1, @caiconghui, @cambyzju, @caoliang-web, @catpineapple, @cjj2010, @csun5285, @dataroaring, @deardeng, @dongsilun, @dutyu, @echo-hhj, @eldenmoon, @elvestar, @englefly, @feelshana, @feifeifeimoon, @feiniaofeiafei, @felixwluo, @freemandealer, @gavinchou, @ghkang98, @gnehil, @hechao-ustc, @hello-stephen, @httpshirley, @hubgeter, @hust-hhb, @iszhangpch, @iwanttobepowerful, @ixzc, @jacktengg, @jackwener, @jeffreys-cat, @kaijchen, @kaka11chen, @kindred77, @koarz, @kobe6th, @kylinmac, @larshelge, @liaoxin01, @lide-reed, @liugddx, @liujiwen-up, @liutang123, @lsy3993, @luwei16, @luzhijing, @lxliyou001, @mongo360, @morningman, @morrySnow, @mrhhsg, @my-vegetable-has-exploded, @mymeiyi, @nanfeng1999, @nextdreamblue, @pingchunzhang, @platoneko, @py023, @qidaye, @qzsee, @raboof, @rohitrs1983, @rotkang, @ryanzryu, @seawinde, @shoothzj, @shuke987, @sjyango, @smallhibiscus, @sollhui, @sollhui, @spaces-X, @stalary, @starocean999, @superdiaodiao, @suxiaogang223, @taptao, @vhwzx, @vinlee19, @w41ter, @wangbo, @wangshuo128, @whutpencil, @wsjz, @wuwenchi, @wyxxxcat, @xiaokang, @xiedeyantu, @xiedeyantu, @xingyingone, @xinyiZzz, @xy720, @xzj7019, @yagagagaga, @yiguolei, @yongjinhou, @ytwp, @yuanyuan8983, @yujun777, @yuxuan-luo, @zclllyybb, @zddr, @zfr9527, @zgxme, @zhangbutao, @zhangstar333, @zhannngchen, @zhiqiang-hhhh, @ziyanTOP, @zxealous, @zy-kkk, @zzzxl1993, @zzzzzzzs