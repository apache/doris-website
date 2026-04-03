---
{
    "title": "Storage Format V3",
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

Storage Format V3 is the successor to Segment V2. The main change: column metadata is no longer packed inside the Segment Footer, but stored in a separate area of the file. This removes the metadata bottleneck that V2 hits when tables grow to hundreds or thousands of columns.

## Key Optimizations

### External Column Meta

In V2, every column's `ColumnMetaPB` sits in the Segment Footer. When a table has hundreds or thousands of columns, the Footer can reach several MB. Opening a Segment means loading and deserializing all of that, even if the query only touches two columns.

V3 moves `ColumnMetaPB` out of the Footer into a dedicated area in the file. The Footer keeps only lightweight pointers.

<img src="/images/variant/storage-format-v3-layout.png" alt="Storage Format V2 vs V3 — Segment File Layout" width="720" />

Result: the system loads a small Footer first, then fetches metadata only for the columns the query needs. On object storage (S3, OSS), this cuts cold-start latency considerably.

### Integer Type Plain Encoding

V3 switches the default encoding for numeric types (`INT`, `BIGINT`, etc.) from BitShuffle to `PLAIN_ENCODING` (raw binary). With LZ4 or ZSTD compression on top, this combination reads faster and uses less CPU than BitShuffle during large scans.

### Binary Plain Encoding V2

V3 introduces `BINARY_PLAIN_ENCODING_V2` for strings and JSONB. The new layout uses `[length(varuint)][raw_data]` in a streaming fashion, eliminating the trailing offset table that V2 required. This makes string storage more compact.

## Performance

The following test was run on a wide table with 10,000 Segments, each containing 7,000 columns.

<img src="/images/variant/storage-format-v3-benchmark.png" alt="Storage Format V3 — Metadata Open Efficiency" width="600" />

| Metric | V2 | V3 | Improvement |
|---|---:|---:|---|
| Segment open time | 65 s | 4 s | 16× faster |
| Memory during open | 60 GB | < 1 GB | 60× less |

With V2, the system must deserialize the entire Footer (containing all column metadata) even when the query reads only a few columns. That causes massive I/O and memory waste. V3 reads a slim Footer, then loads column metadata on demand.

## When to Use V3

- Wide tables with hundreds or thousands of columns.
- Tables using `VARIANT`, where subcolumn expansion can push the effective column count higher.
- Object storage or tiered storage where metadata loading latency matters.

For tables with a small number of columns, V2 works fine. V3 helps most when the column count is large.

## Usage

Specify `storage_format` as `V3` in `PROPERTIES` when creating a table:

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    name VARCHAR(128),
    attrs VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```
