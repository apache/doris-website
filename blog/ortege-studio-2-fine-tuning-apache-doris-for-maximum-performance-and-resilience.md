---
{
    'title': "Fine-tuning Apache Doris for maximum performance and resilience: a deep dive into fe.conf",
    'description': "Ortege handles massive volumes of blockchain data to power its analytics platform, Ortege Studio. Apache Doris forms the backbone of its Lakehouse v2, enabling it to process billions of records and deliver real-time insights.",
    'summary': "Ortege handles massive volumes of blockchain data to power its analytics platform, Ortege Studio. Apache Doris forms the backbone of its Lakehouse v2, enabling it to process billions of records and deliver real-time insights.",
    'date': '2024-11-20',
    'author': 'Justin Trollip',
    'tags': ['Best Practice'],
    'picked': "true",
    'order': "2",
    "image": '/images/ortege-2.jpg'
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

:::info Special Thanks

This is the second contribution from Justin Trollip. He introduces the fe.conf setting optimization for higher performance and resilience in his case. He uses Apache Doris as the backbone of Ortege's lakehouse, which handles massive volumes of blockchain data. Previously, he also shared his experience in using Auto Partition of Doris.

:::

**[Apache Doris](https://www.linkedin.com/company/doris-apache/)** is renowned for its speed and scalability as an MPP analytical database. But to unlock its full potential, especially in demanding blockchain data environments, careful configuration is key. Today, we'll explore the critical settings in Doris' fe.conf file that directly impact performance and resilience, using our own configuration at Ortege as a real-world case study.

## Ortege's Lakehouse v2: Powered by Doris

At Ortege, we handle massive volumes of blockchain data to power our analytics platform, **[Ortege Studio](https://app.ortege.ai/dashboard/list)**. Apache Doris forms the backbone of our **[Lakehouse v2](https://docs.ortege.ai/ortege-documentation/ortege-guides/ortege-lakehouse)**, enabling us to process **billions** of records and deliver real-time insights. Our journey has involved continuous optimization and fine-tuning of Doris, and fe.conf plays a central role.

## Key Areas for Performance and Resilience:

Here are the crucial fe.conf settings we've prioritized, along with areas where we're actively experimenting for further improvement:

### Query Engine Optimization

- `default_max_query_instances`: This setting controls the maximum number of query instances allowed per user. We currently have it set to the default (-1 for unlimited), but we're considering setting a reasonable limit to prevent resource exhaustion from runaway queries, especially in multi-tenant scenarios.
- `max_query_retry_time` (Default: 3): While the default retry attempts provide some fault tolerance, increasing this value could improve query resilience in unstable network environments, but we need to carefully consider the potential impact on overall query latency.
- `enable_local_replica_selection` **(set to `true`):**  We have now enabled this feature to optimize query performance. In our deployment, FE and BE nodes are co-located, so this should reduce network overhead by preferentially using local replicas for queries.
- `rewrite_count_distinct_to_bitmap_hll` **(Default: true):** We've kept this enabled to leverage bitmap and HLL optimizations for COUNT(DISTINCT) queries, which are common in our analytical workloads. 

### Load and Export Management

- `enable_pipeline_load` **(Default: true),** `enable_vectorized_load` **(Default: true),** `enable_new_load_scan_node` **(Default: true):** We've enabled these settings to leverage the latest performance enhancements in Doris' load process. Pipeline execution, vectorized loading, and the new scan node contribute to faster data ingestion.
- `max_running_txn_num_per_db` **(Default: 1000):** While the default concurrency limit is sufficient for our current needs, we're monitoring this closely as our data volume and user base grow. We might need to increase this limit to accommodate more concurrent load jobs without causing contention.
- `max_stream_load_timeout_second` **(Default: 3 days):** The default timeout is very generous. We're evaluating if a shorter timeout, balanced with potential retry mechanisms, could improve resource utilization and prevent long-running, potentially problematic stream loads.

### Metadata and Cluster Management

- `meta_delay_toleration_second` **(Default: 5 minutes):** This setting controls how long non-master FE nodes tolerate metadata delays from the master. We might need to adjust this based on our network latency and the frequency of metadata updates. 
- `disable_colocate_balance` **(Default: false):** We haven't disabled colocation balance, as it's crucial for maintaining optimal data distribution and query performance. However, we're exploring the implications of temporarily disabling it during specific maintenance operations or upgrades. 

### Storage Optimization

- `storage_flood_stage_usage_percent` **(Default: 95%)**, storage_flood_stage_left_capacity_bytes **(Default: 1GB):** These settings control the thresholds at which Doris rejects write operations to prevent storage exhaustion. We're continuously monitoring disk space usage and adjusting these thresholds as needed to avoid disruptions.
- `storage_high_watermark_usage_percent` **(Default: 85%)**, storage_min_left_capacity_bytes **(Default: 2GB):** These parameters govern how Doris selects storage paths for data balancing. We're actively experimenting with these thresholds to find the optimal balance between data distribution and avoiding disk space issues. 

### Query Caching

- `cache_enable_sql_mode` **(set to** `true`**):** We've enabled query caching to significantly speed up query responses, especially for our frequently accessed Deep Dive dashboards. 
- `cache_result_max_row_count` **(set to** `20000`**):** We increased the maximum number of rows that can be cached to accommodate the typical result set sizes of our dashboard queries. 

## **Continuous Improvement**

Fine-tuning Doris is an ongoing process, and we're constantly exploring new configuration options and optimization strategies. By sharing our fe.conf learnings and areas for improvement, we hope to help others get the most out of this powerful analytical database.

This article was written by Justin Trollip and originally posted on [Linkedin](https://www.linkedin.com/pulse/fine-tuning-apache-doris-maximum-performance-resilience-deep-dive-jiwac/?trackingId=jJ%2FO3s%2FHRGee3mxQ9LTnxQ%3D%3D).