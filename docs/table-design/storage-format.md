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

Doris Storage Format V3 is a major evolution from the Segment V2 format. Through metadata decoupling and encoding strategy optimization, it specifically improves performance for wide tables, complex data types (such as Variant), and cloud-native storage-compute separation scenarios.

## Key Optimizations

### External Column Meta
*   **Background**: In Segment V2, metadata for all columns (`ColumnMetaPB`) is stored in the Footer of the Segment file. For wide tables with thousands of columns or auto-scaling Variant scenarios, the Footer can grow to several megabytes.
*   **Optimization**: V3 decouples `ColumnMetaPB` from the Footer and stores it in a separate area within the file (External Column Meta Area).
*   **Benefits**:
    *   **Ultra-fast Metadata Loading**: Significantly reduces Segment Footer size, speeding up initial file opening.
    *   **On-demand Loading**: Metadata can be loaded on demand from the independent area, reducing memory usage and improving cold start query performance on object storage (like S3/OSS).

### Integer Type Plain Encoding
*   **Optimization**: V3 defaults to `PLAIN_ENCODING` (raw binary storage) for numerical types (such as `INT`, `BIGINT`), instead of the traditional BitShuffle.
*   **Benefits**: Combined with LZ4/ZSTD compression, `PLAIN_ENCODING` provides higher read throughput and lower CPU overhead. In modern high-speed IO environments, this "trading decompression for performance" strategy offers a clear advantage when scanning large volumes of data.

### Binary Plain Encoding V2
*   **Optimization**: Introduces `BINARY_PLAIN_ENCODING_V2`, using a `[length(varuint)][raw_data]` streaming layout, replacing the old format that relied on trailing offset tables.
*   **Benefits**: Eliminates large trailing offset tables, making data storage more compact and significantly reducing storage consumption for string and JSONB types.

## Design Philosophy
The design philosophy of V3 can be summarized as: **"Metadata Decoupling, Encoding Simplification, and Streaming Layout"**. By reducing metadata processing bottlenecks and leveraging the high efficiency of modern CPUs in processing simple encodings, it achieves high-performance analysis under complex schemas.

## Use Cases
- **Wide Tables**: Tables with more than 2000 columns or long column names.
- **Semi-structured Data**: Heavy use of `VARIANT` or `JSON` types.
- **Tiered Storage/Cloud Native**: Scenarios sensitive to object storage loading latency.
- **High-performance Scanning**: Analytical tasks with extreme requirements for scan throughput.

## Usage

### Enable When Creating a New Table
Specify `storage_format` as `V3` in the `PROPERTIES` of the `CREATE TABLE` statement:

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
