---
{
    "title": "Release 4.1.0",
    "language": "en",
    "description": "Here's the Apache Doris 4.1.0 release notes:"
}
---


# AI & Search

The AI era is redefining the core value of databases. Traditional databases are more oriented towards manual analysis, reporting, and offline statistics, while in the new generation of Search & AI scenarios, databases have become  the key infrastructure for intelligent agents, RAG systems, and large model services , assuming core responsibilities such as real-time data supply, MultiModal Machine Learning retrieval, feature storage, and model observability.

To adapt to this transformation, Apache Doris has carried out comprehensive and in-depth optimizations in areas such as Search, AI data storage, and AI observability: on the one hand, it strengthens the efficient storage and management of massive unstructured and semi-structured data, supporting high-throughput writes and low-latency reads of typical AI data such as RAG slices, conversation context, Agent execution traces, and tool call logs; On the other hand, build unified hybrid retrieval capabilities to achieve in-depth collaboration among structured filtering, full-text retrieval, and vector semantic retrieval, meeting the requirements of complex AI queries for comprehensiveness, accuracy, and controllability.

Meanwhile, Doris has optimized the performance of wide table storage, random read, and aggregate analysis for observable data such as monitoring metrics, Trace links, and event streams during Model Training and inference processes, making the operating status of AI systems traceable, analyzable, and governable. In version 4.1.0, we have continued to refine around the above scenarios, significantly enhancing the capabilities of hybrid retrieval, long context storage, ultra-wide table processing, and high-concurrency real-time query, truly making Doris the unified data storage and retrieval foundation in the AI era.

## Vector Indexing

### New Vector Indexing Algorithm -- IVF

IVF (Inverted File) is the most classic and commonly used approximate nearest neighbor (ANN) retrieval algorithm in large-scale high-dimensional vector scenarios. Its core is "first clustering and bucketing, then local search", which trades a small amount of precision loss for an order-of-magnitude speedup. Compared with the HNSW algorithm in 4.0.0, it can support larger-scale vectors with less memory by reducing a certain amount of precision loss. It can be used through the index attribute "index_type"="ivf" to use the IVF index.

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="ivf",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```

### DiskANN Index Based on IVF Algorithm

Open-source vector search libraries, typically represented by Faiss, are usually designed for search scenarios that require high-performance vector search on a small scale (tens of millions), and these implementations achieve high-performance recall at the cost of significant memory overhead. The requirement that the index must be fully loaded into memory limits their application in ultra-large-scale vector search scenarios, such as those involving 10 billion vectors. Based on the IVF algorithm, Doris refers to the optimization method described in the Microsoft SPANN paper ([SPANN paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2021/11/SPANN_finalversion1.pdf)), realizes IVF_ON_DISK indexing through memory cache + local file system cache, and cooperates with Doris' storage and calculation separation mode. IVF_ON_DISK can achieve efficient vector pruning at a very low cost in the scenario of large-scale vector search, providing high-performance vector recall. Compared to the previous SOTA, DiskAnn, IVF_ON_DISK can significantly reduce index construction overhead. By adjusting the cache ratio during the search phase, it can achieve query performance on par with that of IVF in full memory. For trillion-scale vector search scenarios, IVF_ON_DISK will become a new solution.
The usage of IVF_ON_DISK is basically the same as that of IVF, only requiring the specification of "index_type"="ivf_on_disk".

```sql
CREATE TABLE for_ivf_on_disk (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type"="ivf_on_disk",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

### Quantization

Vector quantization is another way to reduce the memory overhead of vector indexing. Essentially, vector quantization is a lossy vector compression technique that, at the cost of slightly reducing the recall rate, achieves a significant reduction in memory usage.
Doris offers multiple vector quantization methods, including INT8 scalar quantization, INT4 scalar quantization, and ProductQuantization. With a slight decrease in recall rate, the above three quantization methods have a compression ratio of 4 to 8 times. Taking PQ compression of a 128-dimensional vector as an example, the DDL is as follows.

```sql
CREATE TABLE product_quant (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type"="ivf_on_disk",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024",
      "quantizer"="pq",
      "pq_m"=64,
      "pq_nbits"=8
  )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

Vector quantization can be used together with IVF_ON_DISK to further reduce the machine cost of large-scale vector retrieval.

### Performance Improvement

In terms of query performance, the optimization of Ann Index Only Scan was introduced in 4.1.0, which enables vector search queries to completely avoid IO read operations on the original columns during execution.  The performance of the vector index has been improved by 4 times compared to version 4.0.0, providing 900 QPS on a 16-core, 64GB memory machine with a 1 million vector scale, while meeting a 97% recall rate, which can meet the needs of most business scenarios.

<img width="1107" height="1280" alt="Image" src="https://github.com/user-attachments/assets/d787bae2-8551-4898-8961-5aea8335ddbe" />

Compared to dedicated vector databases, Doris has better index building performance, which benefits from Doris's data hierarchical architecture. In 4.1.0, we further strengthened this advantage. Now, when building indexes, Doris batches data in memory, and constructing vector indexes in batch form can maximize the parallelism of index building while ensuring index quality.According to the existing public data from VectorDBBench (as of January 2026), Doris has a faster index building speed than professional vector index libraries such as Milvus, Qdrant, and pgvector.

## Search() function: Unify text search and analysis in SQL

In traditional log and text analysis scenarios, search relies on Elasticsearch, and analysis relies on OLAP databases, with two sets of systems, two sets of data, and one synchronization link. The search() function introduced in 4.1 directly embeds text search capabilities into SQL, enabling search filtering and aggregate analysis to be completed simultaneously with a single SQL statement, eliminating intermediate data transfer.

### Core Competence

- **Compatible with ES query_string syntax:** `search()` accepts a DSL string parameter, with syntax compatible with Elasticsearch `query_string`. When migrating existing ES queries, most only need to change the function name. It also supports Lucene mode, implementing the complete MUST / SHOULD / MUST_NOT semantics.
- **Rich query operators:** Built-in operators such as TERM, PHRASE, WILDCARD, REGEXP, PREFIX, NOT, and NESTED can be arbitrarily nested and combined, with a single line of DSL replacing multiple MATCH concatenations.
- **BM25 relevance scoring:** Built-in BM25 scoring (IDF weighting + document length normalization), exposes scores through the `score()` column, and performs TopN optimization at the storage layer, eliminating the need for full result transmission.
- **Nested search (`Nested`):** When used in conjunction with the VARIANT type, the NESTED operator can directly search inside nested JSON arrays without the need for ETL preprocessing or table splitting, making it suitable for semi-structured scenarios such as AI Agent Trace and Internet of Vehicles event streams.
- **Multi-field search:** Supports `best_fields` (exact match on the same field) and `cross_fields` (scattered match across fields) strategies, eliminating the need to pre-determine the target field during troubleshooting.

### Performance Advantages

Different from the traditional approach where multiple MATCH expressions are evaluated independently and then a bitmap intersection is performed,  search()  compiles all conditions into a query tree and evaluates them uniformly based on the Lucene Weight/Scorer architecture:

- **Advance document by document + AND short-circuiting:** Does not materialize the complete bitmap; if the first condition is not met, it skips, with greater advantages when data skew occurs.
- **Shared `IndexReader`:** Multiple fields share the opened reader instance to avoid repeated file opening and index loading.
- **DSL-level cache:** Uses the entire DSL expression as the cache key, allowing the results of the same query to be reused across different segments.
  The more conditions there are, the greater the performance gap with independent MATCH.

### Typical Usage

```sql
-- TERM + PHRASE + NOT 
SELECT request_id, error_msg, latency_ms
FROM inference_logs
WHERE search('
  level:ERROR 
  AND error_msg:"CUDA out of memory" 
  AND NOT module:healthcheck 
  AND model_name:gpt*
')
  AND log_time > NOW() - INTERVAL 1 HOUR
ORDER BY latency_ms DESC LIMIT 100;

-- BM25 
SELECT request_id, error_msg, score() AS relevance
FROM inference_logs
WHERE search('error_msg:"memory allocation failed" OR error_msg:"CUDA error"')
ORDER BY relevance DESC LIMIT 20;

-- Search in VARIANT
SELECT * FROM agent_logs
WHERE search('NESTED(steps, status:error AND tool:code_exec)');

-- search + aggregation
SELECT model_name, COUNT(*) AS error_count,
       PERCENTILE_APPROX(latency_ms, 0.99) AS p99_latency
FROM inference_logs
WHERE search('level:ERROR AND error_msg:"CUDA out of memory"')
  AND log_time > NOW() - INTERVAL 1 HOUR
GROUP BY model_name ORDER BY error_count DESC;
```

search() returns a boolean predicate, which can directly participate in JOIN, window functions, and subqueries, making text retrieval a part of standard SQL capabilities.

## Breaking through the one-million Token context: natively supporting 100MB-level ultra-large JSON full-volume storage

In long text, multi-round interaction, RAG, and Agent scenarios,  the million-token context capability  has changed from an "optional feature" to an "inelastic demand". The upgrade of Apache Doris this time directly achieves  single 100MB-level super-large JSON native storage , completely breaking through the whole-link barrier of "database + large model context".
This means that the user's complete interaction lifecycle data for an entire segment — including ultra-long multi-turn conversations, full-text long documents, audio/video transcribed text, complete Agent execution trajectories, whole-link logs of tool calls, RAG sliced context, etc. —  does not need to be split, truncated, or rely on external dependencies , and can be directly, completely, and natively stored in the Doris database.
More critically, after all ultra-long texts are stored, you can already perform precise retrieval, conditional filtering, aggregate statistics, and JOIN associations on 100MB-level context just like querying ordinary structured fields, truly achieving "contextual data can be stored, queried, managed, and governed".
Before this, the common industry solution was: metadata was stored in databases, while ultra-long context/raw text was stored in object storage (such as S3). During queries, it was necessary to first query the metadata, then retrieve the object files, and then perform text splicing and parsing. This resulted in a long link, multiple dependencies, difficulty in ensuring consistency, numerous failure points, and high query latency.
By relying on Doris' ultra-large text capability of millions of tokens,  this complex architecture of "database + S3 + metadata management + text splicing" can be significantly simplified or even directly replaced :

- **Remove the extra object storage dependency**
- **Remove the consistency maintenance logic** between metadata and the original text
- **Eliminate the development costs** associated with segmented storage and splicing parsing
- **Simultaneously achieve** lower query latency, stronger transaction guarantees, and a simpler operation and maintenance architecture

Ultimately, it transforms ultra-long context from a "burden on large model input" into structured data assets that can be directly hosted, efficiently queried, and securely managed, providing a minimalist, reliable, and high-performance underlying support for scenarios such as RAG, intelligent assistants, multi-turn conversations, and long document understanding.

## Metadata Separation and Reconstruction: Empowering Ultra-wide Scenarios with Tens of Thousands of Columns

In Search & AI scenarios, a large amount of business data naturally possesses  ultra-wide, sparse, and semi-structured  characteristics: for example, RAG sharding metadata, Agent execution traces, tool invocation logs, Model Training and inference features, Internet of Vehicles telemetry data, intelligent driving event streams, etc. This type of data generally contains  a large number of dynamically expanding fields , with flexible and variable schemas, rapidly increasing column counts, and significant hot-cold differentiation in data access. Business query patterns are also highly diverse: some only need to access a small number of high-frequency hot columns, some require full row reads, and there are also numerous scenarios thatimpose stringent requirements on random point queries, high-throughput writes, and Compaction stability. Facing such scenarios of ultra-wide tables with tens of thousands of columns, Doris has made a series of targeted enhancements around wide table storage and efficient access. Prior to the Apache Doris 4.1 version, the system defaulted to using the Segment V2 storage format.This format, in its design, draws on the structure of classic columnar storage files such as Parquet, centrally storing various types of metadata information at the end of the file (Footer). In scenarios of traditional batch scanning and high-throughput analysis, this structure can ensure good sequential read performance; However, inscenarios such as random read, point query, and small-scale query, the issues will be exposed intensively: each read operation requires loading and parsing the complete Footer metadata first, incurring a large amount of unnecessary I/O and parsing overhead, ultimately directly leading to poor performance in random read operations and making it difficult to meet the requirements of random-read-sensitive business scenarios such as AI, Internet of Vehicles, and real-time retrieval.

Segment V3 draws on the practices of new file storage formats such as Lance and Vortex, separating metadata from the footer, addressing the issues of metadata bloat, slow file opening, and random read overhead that are most commonly encountered in scenarios with tens of thousands of columns.

- **External Column Metadata:** Extract `ColumnMetaPB` from the Segment Footer, load it on demand, and reduce Footer bloat.
- **Integer Plain Encoding:** The numerical type uses `PLAIN_ENCODING` by default, which reduces CPU overhead during reading when combined with compression.
- **Binary Plain Encoding V2:** Remove trailing offsets, change to a streaming layout, and compress the storage volume of strings and JSONB.
- **Applicable scenarios:** Ultra-wide tables, a large number of VARIANT sub-columns, object storage cold start sensitivity, and semi-structured data in AI and Internet of Vehicles with frequent random reads.
- **Usage:** Specify `"storage_format" = "V3"` when creating a table.

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

For example, it is performed on a wide table with 7,000 columns, with a total of 10,000 segments.

<img width="1024" height="1024" alt="Image" src="https://github.com/user-attachments/assets/c551bdee-270c-4273-b22e-7d8f0ba3be75" />

- **Documentation:** [Storage Format](https://doris.apache.org/zh-CN/docs/4.x/table-design/storage-format)

### Sparse Column Optimization: Sparse Sharding and Sparse Cache

For wide JSONs with fewer hot paths and more long-tail paths, 4.1 focuses on optimizing the sparse read path to prevent long-tail paths from concentrating on a single sparse column.

- **Hot and cold stratification:** The hot path continues to be retained as a columnar sub-column, while the long-tail path enters sparse storage to prevent the number of sub-columns from continuing to expand.
- **Sparse sharding:** Distribute long-tail paths to multiple physical sparse columns by hash through `variant_sparse_hash_shard_count`, reducing read amplification of a single column.
- **Sparse Cache:** Adds a read cache to sparse columns, reducing repeated I/O, repeated decoding, and repeated deserialization during high-frequency access and random reads.
- **Applicable scenarios:** Ultra-wide JSONs such as vehicle networking telemetry, advertising profiles, user characteristics, event tracking logs, and security logs; the total number of keys is large, even unlimited, but the truly high-frequency query hot paths are only dozens to hundreds.

```sql
CREATE TABLE user_feature_wide (
    uid BIGINT,
    features VARIANT<
        'user_id' : BIGINT,
        'region' : STRING,
        properties(
            'variant_max_subcolumns_count' = '2048',
            'variant_sparse_hash_shard_count' = '32'
        )
    >
)
DUPLICATE KEY(uid)
DISTRIBUTED BY HASH(uid) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

- **Optimization effect:** Hotspot paths continue to follow the columnar sub-columns, and the read pressure of long-tail paths will be distributed across multiple sparse columns; for queries that repeatedly access the same batch of long-tail paths, jitter will also be smaller.
- **Performance test results:** [Variant Workload Performance](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#%E6%80%A7%E8%83%BD)
- **Document:** [Sparse Mode Guide](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#sparse-%E6%A8%A1%E5%BC%8F). Keywords: Sparse sharding

### DOC Mode: More Stable Extraction of Ten Thousand Columns

If the focus of semi-structured data is on fast writing or if the entire JSON document needs to be retrieved frequently, DOC mode would be more suitable. It first preserves the original JSON and then defers the extraction of sub-columns until compaction, postponing the most costly part of the write phase and reducing write amplification during small batch imports into columnar storage.

- **Delayed materialization:** During the write phase, the original JSON/Map structure is retained first, reducing the overhead of immediately expanding a large number of subcolumns during small batch writes.
- **DOC sharding:** Split the Doc Store into multiple physical shards via `variant_doc_hash_shard_count` to accelerate the return of the entire JSON and improve the performance of path extraction for Maps.
- **Materialization threshold control:** Use `variant_doc_materialization_min_rows` to control the materialization threshold. Batches below the threshold will not perform sub-column extraction initially and will be uniformly processed during compaction.
- **Applicable scenarios:** Scenarios such as AI/LLM outputs, Trace/Span, context snapshots, archival event streams, and original event replay in Internet of Vehicles, which often require returning complete documents.
- **Usage:** After enabling `variant_enable_doc_mode`, set `variant_doc_materialization_min_rows` according to the write batch size, and estimate `variant_doc_hash_shard_count` based on the total number of keys or the size of the entire JSON. DOC mode is mutually exclusive with sparse columns, so it is recommended to choose one of them, and also use it in conjunction with `storage_format = "V3"`.

```sql
CREATE TABLE trace_archive (
    ts DATETIME,
    trace_id STRING,
    span VARIANT<
        'service_name' : STRING,
        properties(
            'variant_enable_doc_mode' = 'true',
            'variant_doc_materialization_min_rows' = '100000',
            'variant_doc_hash_shard_count' = '32'
        )
    >
)
DUPLICATE KEY(ts, trace_id)
DISTRIBUTED BY HASH(trace_id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

- **Optimization effect:** When writing in small batches, large-scale sub-column materialization and extraction are not performed first, resulting in lighter CPU and memory pressure on the write path; for queries that often return the entire JSON, `SELECT variant_col` can directly read the Doc Store.
- **Performance test results:** [Variant Workload Performance](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#%E6%80%A7%E8%83%BD)
- **Document:** [DOC Mode Template](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#doc-mode-template). Keyword: DOC mode

## More Faster

Doris has always been commended by the industry for its ultra-fast query experience. We have always regarded ultimate speed as our eternal pursuit and never stopped striving for even greater speed. In OLAP scenarios, query performance directly determines analysis efficiency, resource costs, and business response speed, and faster response has always been the core direction of engine iteration. To this end, Doris 4.1 has carried out systematic enhancements to the execution engine and query optimizer around three core paths:

- **Reduce ineffective processing:** Only process necessary data through precise data pruning and computation pushdown
- **Reduce data flow:** Optimize the Shuffle mechanism and network transmission to minimize cross-node overhead
- **Enhance execution efficiency:** Continuously upgrade the performance of operators and expressions to squeeze out hardware computing power
  A series of in-depth optimizations have enabled Doris to achieve significant performance improvements again in standard benchmark tests and real business scenarios, continuously moving towards the goal of faster real-time analysis.

### Multi-table analysis scenario

To objectively and fairly measure the performance of databases in real business scenarios, the industry generally adopts standardized benchmark tests. Among them, TPC-H, TPC-DS, and SSB are precisely the "troika" for evaluating multi-table association analysis capabilities:

- **TPC-H:** Simulates decision support scenarios, and through a series of ad-hoc queries and concurrent data modifications, focuses on examining the comprehensive performance of databases in areas such as multi-table joins and aggregation operations.
- **TPC-DS:** As the successor to TPC-H, TPC-DS is more realistic, with its data model and query patterns covering complex business operations in multiple industries such as retail and e-commerce, and it is the authoritative standard for measuring the performance of modern data warehouses.
- **SSB (Star Schema Benchmark):** Focuses on performance testing of star models, simplifies the TPC-H model, and is more focused on large-scale association queries between fact tables and dimension tables. It is a touchstone for testing the database's ability to handle classic data warehouse models.

| Benchmark | Apache Doris 4.1 | Apache Doris 4.0 | Improvement Ratio |
| --- | ---: | ---: | ---: |
| SSB SF1000 | 10934 ms | 12495 ms | 14.28% |
| TPC-H SF1000 | 53275 ms | 65312 ms | 22.59% |
| TPC-DS SF1000 | 159562 ms | 190031 ms | 19.10% |

### Wide Table Analysis Scenario

As the currently recognized most rigorous single-table query performance testing standard in the industry, ClickBench is based on real website access log data, comprehensively evaluating the database's hard capabilities in columnar storage, vectorized execution, and compression algorithms through 100GB-level data volume and 43 high-difficulty queries.
In the actual test of the demanding c7a.metal-48xl model, Apache Doris 4.1  topped the rankings in both cold query and storage space. Its overall score narrowly missed first place and ranked second , just behind  ClickHouse (web) . The specific results are as follows:
Cold Check:

<img width="2693" height="256" alt="Image" src="https://github.com/user-attachments/assets/169a73e0-7523-4547-9d30-096c197a8348" />

Overall Score:

<img width="2462" height="256" alt="Image" src="https://github.com/user-attachments/assets/e259b134-b483-4c75-8aeb-069ff4d1f145" />

### Important optimization

In Apache Doris 4.1, we introduced dozens of performance optimizations. By choosing smarter execution paths, we reduced data computation and cross-network data transfer. By optimizing key operators and functions, we improved the performance of key nodes in the execution path. By adding an automated caching mechanism that is invisible to users, we significantly enhanced the execution speed in real-world scenarios. Below are several important optimization points introduced in Apache Doris 4.1.

#### Aggregation Pushdown

Aggregate Pushdown Through Join intelligently "splits" and "pushes down" aggregate operators with high aggregation rates to both sides of the join operation. First, it performs local aggregation on the single-table data participating in the join, significantly reducing the number of data rows before performing the join, and finally performs global aggregation on the small amount of data after the join. This "compress first, then correlate" strategy, like setting up multiple levels in the data flood, reduces the amount of data involved in connections from the source, thereby significantly reducing memory usage and computational latency, and is a key means of improving the performance of complex correlation queries.
In the test set we constructed,  the overall performance improvement exceeded 200%. Use cases with an improvement exceeding 50% accounted for more than half. Nearly 1/3 of the use cases had an improvement exceeding 100 times.

#### Aggregation Expansion Optimization

Aggregation expansion optimization intelligently identifies the finest-grained aggregation group and its aggregation rate in aggregation expansion. When the conditions are met, the execution model is transformed from multi-group parallel aggregation to first executing the finest-grained aggregation group, significantly reducing the data volume, and then executing other aggregation groups based on this result, thereby significantly reducing computational latency.

In the test set we constructed,  the overall performance improvement exceeded 10%. More than 1/5 of the use cases had an improvement exceeding 20%, with the maximum improvement reaching 160% and the maximum regression not exceeding 5%.

#### Nested Column Cropping

The nested column pruning technology delves into the internals of data types and can precisely parse the hierarchical structure of nested fields. When a query request targets a deep-level subfield, the optimizer generates a refined read plan that reads only the physical data corresponding to that subfield from disk while skipping other sibling fields. Nested column pruning in Apache Doris 4.1 supports both internal table data and external table data in ORC and Parquet formats.

In the test set we constructed,  the overall performance improvement exceeded 60%. In the most extreme scenario, the improvement exceeded 700%.

#### Condition Cache

In large-scale analytical scenarios, queries often contain repeated filter conditions (Condition), for example:

```sql
SELECT * FROM orders WHERE region = 'ASIA';
SELECT count(*) FROM orders WHERE region = 'ASIA';
```

This type of query repeatedly executes the same filtering logic on the same data sharding (Segment), resulting in redundant CPU and IO overhead.
To address this issue, Apache Doris introduced the Condition Cache mechanism. It can cache the filtering results of specific conditions on a Segment and directly reuse them in subsequent queries, thereby reducing unnecessary scanning and filtering and significantly reducing query latency.
Under complex query scenarios, the overall performance improvement exceeds 10%.
For detailed principles, please refer to the official Apache Doris documentation: [Condition Cache](https://doris.apache.org/docs/4.x/query-acceleration/condition-cache)

#### Intermediate Result Cache

In analytical query scenarios, the same aggregate query is often executed repeatedly while the underlying data remains unchanged. For example:

```sql
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
```

Each execution will rescan the same Tablet and recalculate the exact same aggregation results, wasting a large amount of CPU and I/O resources.
To address this issue, Apache Doris provides the Query Cache mechanism. It caches the intermediate aggregation results generated by the pipeline execution engine, and when subsequent queries have the same execution context, it directly returns the cached results, thereby significantly reducing query latency.
For detailed principles, please refer to the official Apache Doris documentation: [Query Cache](https://doris.apache.org/docs/4.x/query-acceleration/query-cache)

#### Case When Optimization

Case When is a very core syntax in analytical scenarios. It is a core tool for transforming raw data into business insights. It can perform complex functions such as semantic conversion of business logic, dynamic classification at the row level, and conditional aggregation across multiple dimensions. By optimizing the execution performance of Case When statements, the execution performance of key scenarios can be significantly improved.

Apache Doris version 4.1 significantly improves the execution performance of queries containing Case When statements by introducing optimization techniques such as branch merging, branch elimination, common subexpression extraction, enum value extraction, and pushdown.

In the test set we built,  the performance has increased by more than 200% on average, and the performance improvement in extreme scenarios has exceeded 50 times.

#### Other

In addition to the above optimizations, Apache Doris 4.1 is more intelligent in Join order selection and data Shuffle method selection, reducing the overall memory usage of query execution, improving the execution performance of Join and Exchange operators, and optimizing the execution performance of key functions such as Like, FROM_UNIXTIME, and Count.

## Separation of Storage and Computation

Currently, the user base of the compute-storage separation architecture of Apache Doris has officially exceeded 2,000 enterprises . More and more enterprises are choosing the compute-storage separation architecture in their production environments, and its stability and query performance have also become the core metrics that users highly focus on. To this end, we continue to invest in in-depth optimization, constantly refining the architecture's reliability and execution efficiency.

### File Cache Optimization

By persisting the metadata of File Cache, it avoids consuming a large amount of IO during startup and optimizes the startup speed. Meanwhile, a new system table `information_schema.file_cache_info` is added to provide better observability of File Cache usage, exposing the block details in File Cache in SQL format, supporting statistics on cache space usage by dimensions such as `tablet_id`, `be_id`, `cache_path`, and `type`, to help users quickly locate issues such as hot data, cache skew, and abnormal expansion.
**Typical Usage 1:**

```sql
mysql> select * from information_schema.file_cache_info where TABLET_ID = 1761571031445;
+----------------------------------+---------------+-------+--------+-------------+-----------------+---------------+
| HASH                             | TABLET_ID     | SIZE  | TYPE  | REMOTE_PATH | CACHE_PATH       | BE_ID         |
+----------------------------------+---------------+-------+--------+-------------+-----------------+---------------+
| 468448215c52334ae5bee147259b1027 | 1761571031445 | 15120 | index | | /mnt/disk1/project/filecache | 1761571031251 |
| 71bb73d34cd8ffe280b16dd329df5ba1 | 1761571031445 | 13117 | index | | /mnt/disk1/project/filecache | 1761571031251 |
| 77c6b69d1a7c4fe740a11bab5c1bbaa3 | 1761571031445 | 12249 | index | | /mnt/disk1/project/filecache | 1761571031251 |
+----------------------------------+---------------+-------+--------+-------------+-----------------------------------------------------------------------------+---------------+
```

**Typical Usage 2:**

```sql
SELECT be_id, tablet_id, type, SUM(size) AS cache_bytes
    FROM information_schema.file_cache_info
    WHERE tablet_id = 1761571031445
    GROUP BY be_id, tablet_id, type
    ORDER BY cache_bytes DESC;
```

This capability is particularly suitable for the following scenarios: troubleshooting why a specific table or partition occupies a large amount of local cache; observing which table or partition a local cache file block belongs to; observing whether the cache distribution on different BEs is balanced; providing a more direct basis for capacity planning during capacity expansion and contraction, cold query optimization, and cache policy tuning.

### Ultimate Elasticity Optimization

Under the storage-computation separation mode, it can quickly complete capacity expansion and contraction of a million-scale within minutes. Balance scheduling no longer depends on the global number of tablets, and the elasticity is greatly improved.

### Cold Query Optimization

By performing prefetching based on Doris page scan semantics, we achieve extreme performance optimization for cold queries of internal Doris tables. Adjusting parameters can fully utilize the bandwidth of remote storage, thereby obtaining optimal IO performance.

### Better support for ultra-large-scale deployment

Perform "thinning" on each replica/tablet in the FE object, reducing the memory usage of FE by more than 30% when the number of tablets reaches the million level.

### Meta-service Performance Optimization

By adopting the cache mechanism, a large number of duplicate requests sent to the meta-service module are reduced, thereby improving the throughput of metadata.
Optimized the access to meta-service when querying certain system tables in the storage-computation separation mode.

### Object Storage Cost Optimization

Through node-level merging, the issues of a large number of object requests and a large number of small object files have been resolved in high-frequency import scenarios, with a cost optimization rate exceeding 90%.

## Data Lake

Version 4.1.0 has achieved a major breakthrough in the Data Lake direction - comprehensively enhancing Doris' core competitiveness as a unified lakehouse analytics engine, from format support capabilities, query performance to ecosystem compatibility. Users can complete the reading, writing, management, and maintenance of data in mainstream open lake formats such as Iceberg and Paimon solely through Doris SQL, without relying on external engines such as Spark.

### Lakehouse Lifecycle Management

Doris 4.1.0 has implemented the full lifecycle management capabilities for mainstream open lake format data. Users can complete all operations from database and table creation to data addition, deletion, and modification through Doris SQL, truly achieving "one engine to manage the entire Data Lake".

- **Full read and write support for Iceberg V2/V3**
  Doris now fully supports INSERT, UPDATE, DELETE, and MERGE INTO operations for Iceberg V2 and V3 formats, and also supports many new features in the Iceberg V3 standard, such as Deletion Vector and Row Lineage. This means that users can complete the reading, writing, and maintenance of Iceberg Data Lake in Doris without relying on external engines such as Spark - from data ingestion, row-level updates to incremental deletions, the entire TTL can be completed in a closed loop within Doris.
  **Documentation:** [Iceberg Catalog](https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog)
- **Paimon library table management**
  Users can now directly perform Paimon database and table management operations through Doris SQL, including DDL operations such as CREATE DATABASE and CREATE TABLE. We plan to further support the write operations of Paimon tables in subsequent versions of 4.1 to achieve full lifecycle management of Paimon data.
  **Documentation:** [Paimon Catalog](https://doris.apache.org/docs/4.x/lakehouse/catalogs/paimon-catalog)

### Data Lake Query Performance Optimization

This version introduces multiple targeted optimization measures, significantly improving the query performance of Data Lake data.

- **Iceberg sorted write**
  New sorting and writing capabilities for Iceberg tables have been added - users can specify sorting Iceberg data by specific columns during data writing or compaction. The sorted data files will carry sorting metadata (lower/upper bounds), allowing the query engine to perform efficient data file pruning based on this information and skip irrelevant data files. Under the TPC-DS standard test set, the query performance of sorted data improves by approximately 15%.
  **Documentation:** [Iceberg Sorted Write](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/catalogs/iceberg-catalog#%E5%88%9B%E5%BB%BA%E5%92%8C%E5%88%A0%E9%99%A4%E8%A1%A8)
- **Iceberg Manifest Cache**
  A new metadata caching mechanism at the Iceberg Manifest level has been added. During the Iceberg query planning phase, the FE needs to read and parse the metadata chain of ManifestList → Manifest → DataFile/DeleteFile step by step. When querying hot partitions with high frequency or executing small batch queries, the same Manifest file will be repeatedly read and parsed, resulting in a large amount of I/O and CPU overhead. This version introduces Manifest caching to avoid repeated parsing of the same Manifest, and complex metadata parsing operations can be reduced to the level of hundreds of milliseconds.
- **Parquet Page Cache**
  A Page Cache feature has been added for the Parquet format, which can cache decompressed data pages in memory. In high-frequency query scenarios, it can significantly reduce query latency caused by repeated decompression and disk I/O, further enhancing the interactive query experience of data on the lake.  On the Clickbench Parquet test set, the overall performance improvement is over  20% .
  **Documentation:** [Parquet Page Cache](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/best-practices/optimization#parquet-page-cache)

### Data Lake Ecosystem Expansion

4.1.0 has significantly expanded the Catalog access method and underlying storage system support, enabling Doris to more flexibly integrate into various Data Lake architectures.

- **Catalog service extension**
  - **Iceberg/Paimon JDBC Catalog**
    Iceberg/Paimon metadata service that supports using JDBC databases as backend storage .
    **Iceberg Documentation:** [Iceberg JDBC](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/metastores/iceberg-jdbc)
    **Paimon Documentation:** [Paimon JDBC](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/metastores/paimon-jdbc)
  - **Ali Cloud DLF Iceberg/Paimon REST Catalog**
    Alibaba Cloud users can directly access the Iceberg/Paimon Data Lake managed by DLF (Data Lake Formation) through Doris, enabling seamless access to the cloud-based Data Lake.
    **Document:** [Alibaba Cloud DLF](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/metastores/aliyun-dlf)
- **Storage system adaptation**
  - **Huawei Cloud OBS Parallel File System:** New support for Huawei Cloud OBS Parallel File System has been added to meet the storage needs of Huawei Cloud users in Data Lake scenarios. **Documentation:** [Huawei OBS](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/storages/huawei-obs)
  - **JuiceFS:** Added support for the JuiceFS distributed file system, further expanding Doris's adaptability in multi-cloud and hybrid storage environments. **Documentation:** [JuiceFS](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/storages/juicefs)

### Enhanced Usability of Federated Analysis

In version 4.1.0, Doris also enhanced data interoperability and usability.

- **Cache admission control**
  In the Lakehouse scenario, ETL jobs or ad-hoc queries with full table scans may read a large amount of cold data, quickly filling the cache and evicting frequently accessed hot data, leading to cache pollution and a decline in overall query performance. Version 4.1.0 introduced the cache admission control feature, which allows users to finely manage which query data is allowed to be written to the Data Cache through configuration rules, thereby protecting the cache hit rate of hot data.
  - **Multi-dimensional rule configuration:** Supports configuring blocklist (prohibiting caching) or allowlist (allowing caching) rules based on four dimensions: user, Catalog, Database, and Table. Rules are matched in descending order of precision (Table → Database → Catalog → Global), with blocklists at the same level taking precedence.
  - **Dynamic hot loading:** Rules are stored as JSON files in a specified directory, and take effect automatically after modification without the need to restart FE nodes.
  - **Decision observability:** Through EXPLAIN, you can view the cache admission decision (ADMITTED/DENIED) of the query, the hit rule, and the matching time, which facilitates verification and tuning.
    **Documentation:** [Data Cache](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/data-cache)
- **MaxCompute data writing**
  Supports operations such as CREATE TABLE, DROP TABLE, and INSERT INTO in the external catalog of MaxCompute, enabling the complete data export link from Doris to MaxCompute. It also supports ARN cross-account access in MaxCompute. As a result, the bidirectional read and write link between Doris and MaxCompute has been established, allowing users to more conveniently integrate with the Alibaba Cloud ecosystem.
  **Document:** [MaxCompute Catalog](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/catalogs/maxcompute-catalog)
- **Parquet metadata profiling**
  A new Parquet metadata table-valued function (TVF) has been added, allowing users to query metadata information (such as partitions, row groups, column statistics, etc.) of Parquet files via SQL. It is suitable for scenarios where data engineers troubleshoot Parquet file structure issues, verify partition pruning effects, and debug Data Lake query performance.
  **Document:** [Parquet Meta TVF](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/sql-functions/table-valued-functions/parquet-meta)

### Other

- **New `INSERT INTO TVF` exports query results to local/HDFS/S3 files**
  Supports exporting query results to external storage such as the local file system, HDFS, or S3 via `INSERT INTO tvf(...)` syntax. Treating TVF as a writable "table" unifies the data read and write access patterns (reading with SELECT and writing with INSERT). It is suitable for ETL scenarios where analysis results need to be exported regularly, and semantically more consistent and extensible than `OUTFILE`.
  **Document:** [INSERT INTO TVF File Export](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/file-analysis#%E5%9C%BA%E6%99%AF%E5%9B%9B%E5%AF%BC%E5%87%BA%E6%9F%A5%E8%AF%A2%E7%BB%93%E6%9E%9C%E5%88%B0%E6%96%87%E4%BB%B6)

## ETL & ELT

Apache Doris has always taken offline-online integration as its core architectural goal, committed to uniformly supporting real-time interactive analysis and large-scale offline batch processing within the same engine, and completely breaking through the architectural bottleneck of traditional data warehouses, which is characterized by "the separation of real-time and offline operations and redundant deployment of multiple systems." To achieve this goal, Doris continuously and deeply enhances its native ETL/ELT computing capabilities.

### MERGE INTO

In data warehouse scenarios, it is often necessary to merge incremental data (such as CDC) into the target table, and there are also some ETL jobs, including:

- **Update existing data (UPDATE)**
- **Insert new data (INSERT)**
- **Delete data (DELETE)**
  Traditional methods require multiple steps of SQL or complex logic, resulting in high maintenance costs. The newly added standard SQL MERGE INTO supports performing UPSERT / DELETE operations in a single statement.

```sql
MERGE INTO target t
USING source s
ON t.id = s.id
WHEN MATCHED THEN
    UPDATE SET t.value = s.value
WHEN NOT MATCHED THEN
    INSERT (id, value) VALUES (s.id, s.value);
```

### Enhanced Spill Disk Capability

In large-scale analysis scenarios (such as large table joins, high-cardinality aggregations, and global sorting), query execution often highly depends on memory resources. Once the data scale exceeds the memory capacity, queries are prone to OOM or a sharp decline in performance. Traditional databases usually need to  increase machine memory or expand the cluster  to solve this problem, resulting in high resource costs, high usage thresholds, and also limiting usage scenarios in lightweight environments.  In Doris 4.0, we introduced the ability of spill disk, and in version 4.1, we comprehensively enhanced the  Spill to Disk  ability of the execution engine, achieving:

- **Recursive multi-level data spill (Recursive Spill)**
  enables operators to securely write intermediate data to disk in multiple stages and hierarchically, and efficiently read it back when needed, avoiding one-time memory explosion.
- **Operator-level comprehensive coverage**
  Covers core operators such as Hash Join, Aggregation, and Sort, and can still execute stably under extreme Big data volumes.
- **Self-adaptation memory control mechanism**
  Dynamically triggers overwriting, balances memory usage and disk IO, and ensures query stability.

#### Breakthrough Capability

Under the enhanced Spill mechanism, Doris has achieved a highly representative breakthrough in capabilities: By using only a single BE node + 8GB of memory, it successfully ran all TPC-DS 10TB queries.
This means:

- **No longer rely on** large-memory servers or large-scale clusters
- **Can also complete** ultra-large-scale analysis tasks in resource-constrained environments
- **Can even perform** TB-level data analysis on an ordinary laptop (such as a MacBook)

## Core Engine

### UNNEST

With the widespread use of semi-structured data such as logs, event tracking, and JSON, more and more data is stored in ARRAY or nested structures. In data analysis scenarios, users usually need to flatten these nested data before performing operations such as filtering and aggregation.
Meanwhile, in mainstream data analysis engines, such as PostgreSQL and Trino, UNNEST syntax has been provided to handle array expansion. This capability has become a common dependency for users during cross-system migrations or when using multiple engines.
In previous versions, Doris did not support array expansion in a unified manner. Users often had to rely on complex functions or rewrite SQL, which increased the usage threshold and also affected compatibility with other systems.

```sql
SELECT user_id, tag
FROM user_profile,
UNNEST(tags) AS t(tag);
```

### Recursive Common Table Expression (Recursive CTE)

In scenarios such as organizational structure, graph structure, and hierarchical relationships (e.g., parent-child nodes, path finding), users need to perform recursive queries.
For example:

- **Expand organization tree**
- **Classification hierarchy traversal**
- **Graph path search**

```sql
WITH RECURSIVE org_tree AS (
    SELECT id, parent_id, name
    FROM org
    WHERE parent_id IS NULL

    UNION ALL

    SELECT o.id, o.parent_id, o.name
    FROM org o
    JOIN org_tree t ON o.parent_id = t.id
)
SELECT * FROM org_tree;
```

### ASOF JOIN

In scenarios such as finance, IoT, and monitoring, it is often necessary to perform **time-based "nearest match"** correlation queries, for example:

- **Match transaction data with the latest market price**
- **Match device events to the most recent state**
- **Time series data alignment**
  Traditional equi-JOIN cannot meet the requirement of this "nearest time match". ASOF JOIN supports Join with **nearest value matching (<= or >=)** based on the time column.

```sql
SELECT t1.ts, t1.value, t2.price
FROM trades t1
ASOF JOIN prices t2
ON t1.symbol = t2.symbol
AND t1.ts >= t2.ts;
```

## Storage

- **Column Compression and Encoding Optimization**
  The storage layer continuously optimizes columnar compression and encoding strategies, adds more efficient binary column encoding and pre-decoding capabilities, optimizes the default encoding for integer columns, and gradually adjusts the default compression algorithm to ZSTD. In wide table and detailed data scenarios, it can further reduce storage usage and improve cold read performance.
- **S3 Continuous Import**
  Supports creating continuous import jobs based on S3 file sources. The system can automatically detect newly added files and continuously execute imports, suitable for incremental data ingestion in object storage scenarios.
  **Document:** [Continuous Load S3](https://doris.apache.org/zh-CN/docs/4.x/data-operate/import/streaming-job/continuous-load-s3)
- **MySQL / PostgreSQL Real-time Synchronization**
  Supports real-time access of MySQL and PostgreSQL database changes to Doris, covering full initialization and subsequent incremental synchronization, which can help users more conveniently build a real-time analysis link from the database to Doris, meeting the requirements of scenarios such as real-time data warehouses for business databases, data aggregation, and analysis acceleration.
  **Document:**
- **[Continuous Load MySQL](https://doris.apache.org/zh-CN/docs/4.x/data-operate/import/streaming-job/continuous-load-mysql-single)**
- **[Continuous Load PostgreSQL](https://doris.apache.org/zh-CN/docs/4.x/data-operate/import/streaming-job/continuous-load-postgresql-single)**
- **Self-Adaptation Write Scheduling**
  Supports Self-Adaptation adjustment of the MemTable Flush thread pool size, which can automatically match a more appropriate write concurrency level based on the real-time load of the cluster, better balancing throughput, resource utilization, and stability in high-write scenarios.
- **Multi-stream Update of Primary Key Model**
  The primary key model supports multi-stream merge updates through sequence_mapping. Different data streams can update different columns of the same table separately and complete the merge according to their respective sequence fields, which is suitable for scenarios where real-time stream updates and offline data supplementation are written in parallel.
- **Routine Load Flexible Column Update**
  Routine Load supports flexible partial update, allowing for flexible updates to non-primary key columns, and different rows within the same batch can update different columns. It is suitable for scenarios such as status changes, feature backfilling, and label updates, further simplifying the data maintenance process.
- **Dynamic Parameter Tuning for Routine Load**
  Supports dynamic adjustment of import attributes through ALTER ROUTINE LOAD, including configurations such as column mapping, filter conditions, partitions, etc., reducing the cost of online task optimization and modification.
- **Routine Load Self-Adaptation Batch Processing**
  Routine Load supports self-adaptively adjusting batch processing parameters based on backlog, better balancing consumption efficiency and stability in high-throughput scenarios.
- **Import Audit Observability**
  Supports writing Stream Load records to the audit log system table, facilitating unified query of import history, troubleshooting, and audit analysis.

## TIMESTAMP WITH TIME ZONE

In scenarios of global business and multi-time zone data processing (such as cross-regional logs, user behavior analysis, and financial transactions), time data often carries explicit time zone information. For example:

- **User behavior occurs in different countries/time zones**
- **There is a time zone difference between the server and the client**
- **Needs to be uniformly analyzed for cross-time zone alignment**
  In previous versions, Doris mainly used DATETIME (no time zone) type, where users had to manually handle time zone conversions, which was error-prone and increased development costs. Meanwhile, in mainstream databases (such as PostgreSQL), TIMESTAMP WITH TIME ZONE has already become the standard type, widely used for cross-system data interaction and compatibility.
  TIMESTAMPTZ is a date and time data type used to store time zone information in Doris, corresponding to TIMESTAMP WITH TIME ZONE in standard SQL. The value range of TIMESTAMPTZ is the same as that of DATETIME, which is [0000-01-01 00:00:00.000000, 9999-12-31 23:59:59.999999].  TIMESTAMPTZ supports specifying precision, with the format TIMESTAMPTZ(p), where p represents the precision, with a value range of [0, 6], and the default value is 0. In other words, TIMESTAMPTZ is equivalent to TIMESTAMPTZ(0). The default output format is 'yyyy-MM-dd HH:mm:ss.SSSSSS+XX:XX', where +XX:XX represents the time zone offset (note that the number of digits in SSSSSS is determined by the precision p).
  The implementation of TIMESTAMPTZ does not store timezone information separately for each row of data, but instead adopts the following mechanism:
- **When storing:** Uniformly convert the input time value to UTC (Coordinated Universal Time) for storage.
- **During query:** According to the time zone setting of the session (specified by the `time_zone` variable), UTC time is automatically converted to the time of the corresponding time zone for display.
  Therefore, TIMESTAMPTZ can be understood as a DATETIME type with a timezone conversion function, and Doris automatically performs timezone conversion processing internally.
- **When the input string contains timezone information** (such as "2020-01-01 00:00:00+03:00"), Doris will use this timezone information for conversion.
- **When the input string does not contain timezone information** (such as "2020-01-01 00:00:00"), Doris will use the timezone setting of the current session for conversion.
  TIMESTAMPTZ and DATETIME types support mutual conversion, and appropriate adjustments will be made according to the time zone during the conversion process. TIMESTAMPTZ supports implicit conversion to DATETIME, which enables functions that do not directly support TIMESTAMPTZ to also process data of this type.

```sql
select cast("2020-01-01 00:00:00" as timestamptz);
+--------------------------------------------+
| cast("2020-01-01 00:00:00" as timestamptz) |
+--------------------------------------------+
| 2020-01-01 00:00:00+08:00                  |
+--------------------------------------------+

select cast("2020-01-01 00:00:00.123456" as timestamptz(5));
+------------------------------------------------------+
| cast("2020-01-01 00:00:00.123456" as timestamptz(5)) |
+------------------------------------------------------+
| 2020-01-01 00:00:00.12345+08:00                      |
+------------------------------------------------------+
```

# Behavior Change

- Add a new FE config `max_bucket_num_per_partition` to limit the maximum
  number of buckets when creating a table or adding a partition. Default
  value is 768.
  
