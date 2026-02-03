---
{
    "title": "存储格式 V3",
    "language": "zh-CN"
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

Apache Doris 存储格式 V3 是在 Segment V2 格式基础上进行的重大演进。它通过元数据解耦与编码策略优化，专门针对大宽表、复杂数据类型（如 Variant）以及云原生存算分离场景提升性能。

## 核心优化点

### 外部列元数据 (External Column Meta)
*   **优化背景**：在 Segment V2 中，所有列的元数据（`ColumnMetaPB`）都存储在 Segment 文件的 Footer 中。对于拥有数千列的大宽表或自动扩容的 Variant 场景，Footer 可能会膨胀到几 MB。
*   **优化思路**：V3 将 `ColumnMetaPB` 从 Footer 中剥离，转而存储在文件内的独立区域（External Column Meta Area）。
*   **收益**：
    *   **极速元数据加载**：显著减小 Segment Footer 体积，加快文件初次打开速度。
    *   **按需加载**：元数据可以按需从独立区域加载，降低内存占用，提升对象存储（如 S3/OSS）上的冷启动查询性能。

### 数值类型 Plain 编码模式 (Integer Type Plain Encoding)
*   **优化思路**：V3 默认将数值类型（如 `INT`, `BIGINT`）切换为 `PLAIN_ENCODING`（原始二进制存储），而非传统的 BitShuffle。
*   **收益**：配合 LZ4/ZSTD 压缩时，`PLAIN_ENCODING` 提供了更高的读取吞吐量和更低的 CPU 开销。在现代高速 IO 环境下，这种“解压换性能”的策略在扫描大体量数据时优势明显。

### 二进制 Plain 编码 V2 (Binary Plain Encoding V2)
*   **优化思路**：引入 `BINARY_PLAIN_ENCODING_V2`，采用 `[长度(varuint)][原始数据]` 的流式布局，取代了依赖末尾偏移表（Offsets）的旧格式。
*   **收益**：消除了末尾庞大的偏移表，数据存储更加紧凑，有效降低了字符串和 JSONB 类型的存储空间占用。

## 设计哲学
V3 的设计哲学可以总结为：**“元数据解耦、编码简化、流式布局”**。通过减少元数据处理瓶颈和利用现代 CPU 对简单编码的高处理效率，实现在复杂模式下的高性能分析。

## 使用场景
- **大宽表**：字段数量超过 2000 个以上，或字段名冗长。
- **半结构化数据**：大量使用 `VARIANT`， 且物化列数超过2000列。
- **冷热分离/云原生**：对对象存储加载延迟敏感的场景。
- **高性能扫描**：对 Scan 吞吐量有极致要求的分析任务。

## 使用方式

### 创建新表时启用
在建表语句的 `PROPERTIES` 中指定 `storage_format` 为 `V3`：
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
