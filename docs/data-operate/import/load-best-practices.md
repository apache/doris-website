---
{
    "title": "Load Best Practices",
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

## Table Model Selection

It is recommended to prioritize using the Duplicate Key model, which offers advantages in both data loading and query performance compared to other models. For more information, please refer to: [Data Model](../../table-design/data-model/overview)

## Partition and Bucket Configuration

It is recommended to keep the size of a tablet between 1-10GB. Tablets that are too small may lead to poor aggregation performance and increase metadata management overhead; tablets that are too large may hinder replica migration and repair. For details, please refer to: [Data Distribution](../../table-design/data-partitioning/data-distribution).

## Random Bucketing

When using Random bucketing, you can enable single-tablet loading mode by setting load_to_single_tablet to true. This mode can improve data loading concurrency and throughput while reducing write amplification during large-scale data loading. For details, refer to: [Random Bucketing](../../table-design/data-partitioning/data-bucketing#random-bucketing)

## Batch Loading

Client-side batching: It is recommended to batch data (from several MB to GB in size) on the client side before loading. High-frequency small loads will cause frequent compaction, leading to severe write amplification issues.
Server-side batching: For high-concurrency small data volume loading, it is recommended to enable [Group Commit](group-commit-manual.md) to implement batching on the server side.

## Partition Loading

It is recommended to load data from only a few partitions at a time. Loading from too many partitions simultaneously will increase memory usage and may cause performance issues. Each tablet in Doris has an active Memtable in memory, which is flushed to disk when it reaches a certain size. To prevent process OOM, when the active Memtable's memory usage is too high, it will trigger early flushing, resulting in many small files and affecting loading performance.

## Large-scale Data Batch Loading

When dealing with a large number of files or large data volumes, it is recommended to load in batches to avoid high retry costs in case of loading failures and to reduce system resource impact. For Broker Load, it is recommended not to exceed 100GB per batch. For large local data files, you can use Doris's streamloader tool, which automatically performs batch loading.

## Broker Load Concurrency

Compressed files/Parquet/ORC files: It is recommended to split files into multiple smaller files for loading to achieve higher concurrency.

Uncompressed CSV and JSON files: Doris will automatically split files and load them concurrently.

For concurrency strategies, please refer to: [Broker Load Configuration Parameters](./import-way/broker-load-manual#Related-Configurations)

## Stream Load Concurrency

It is recommended to keep Stream load concurrency per BE under 128 (controlled by BE's webserver_num_workers parameter). High concurrency may cause webserver thread exhaustion and affect loading performance. Particularly when a single BE's concurrency exceeds 512 (doris_max_remote_scanner_thread_pool_thread_num parameter), it may cause the BE process to hang.
