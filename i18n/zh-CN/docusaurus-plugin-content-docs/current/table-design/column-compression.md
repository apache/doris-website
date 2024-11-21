---
{
    "title": "按列压缩",
    "language": "zh_CN"
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

Doris 采用 **列式存储** 模型来组织和存储数据，这种存储模型特别适合分析型负载，能够显著提高查询效率。在列式存储中，表的每一列会独立存储，这为压缩技术的应用提供了便利，从而提高了存储效率。Doris 提供多种压缩算法，用户可以根据工作负载的需求，选择合适的压缩方式来优化存储和查询性能。

## 为什么需要压缩

在 Doris 中，数据压缩主要有以下两个核心目标：

1. **提升存储效率**
   压缩可以显著减少数据存储所需的磁盘空间，支持在同样的物理资源上存储更多数据。

2. **优化性能**
   压缩后的数据体积更小，查询时需要的 I/O 操作更少，从而加速查询响应时间。现代压缩算法的解压速度通常非常快，能够在减少存储空间的同时提升读取效率。

## 支持的压缩算法

Doris 支持多种压缩算法，每种算法在压缩率和解压速度之间有不同的权衡，可根据需求选择合适的算法：

###  No Compression
   - **特点**：
     - 不对数据进行压缩。
   - **适用场景**：
     适用于不需要压缩的场景，例如数据本身已经压缩，或者存储空间不是问题。

### LZ4
   - **特点**：
     - 压缩和解压速度非常快。
     - 压缩率适中。
   - **适用场景**：
     适用于对解压速度要求较高的场景，例如实时查询或高并发负载。

### LZ4F（LZ4 Frame）
   - **特点**：
     - LZ4 的扩展版本，支持更灵活的压缩配置。
     - 速度快，压缩率适中。
   - **适用场景**：
     需要在快速压缩的同时对配置进行精细控制的场景。

### LZ4HC（LZ4 High Compression）
   - **特点**：
     - 相较 LZ4 压缩率更高，但压缩速度较慢。
     - 解压速度与 LZ4 相当。
   - **适用场景**：
     需要更高压缩率，但仍然关注解压速度的场景。

### ZSTD（Zstandard）
   - **特点**：
     - 高压缩率，支持灵活的压缩等级调整。
     - 即使在高压缩比下，解压速度仍然很快。
   - **适用场景**：
     对存储效率要求较高，同时需要兼顾查询性能的场景。

### Snappy
   - **特点**：
     - 设计上专注于快速解压。
     - 压缩率适中。
   - **适用场景**：
     对解压速度和低 CPU 开销要求较高的场景。

### Zlib
   - **特点**：
     - 在压缩率和速度之间提供良好的平衡。
     - 相较其他算法，压缩和解压速度较慢，但压缩率更高。
   - **适用场景**：
     对存储效率要求高，且对解压速度要求不敏感的场景，例如归档和冷数据存储。

## 压缩原理

**按列压缩**
   由于采用列式存储，Doris 能够对表中每一列独立压缩。这种方式提升了压缩效率，因为同一列的数据往往具有相似的分布特性。

**压缩前的编码**
   在压缩数据之前，Doris 会对列数据进行编码（例如**字典编码**、**游程编码**等），将数据转换为更适合压缩的形式，从而进一步提升压缩效率。

**按页压缩**
   Doris 采用 **页（Page）** 级别的压缩策略。每一列的数据会被分成多个页，每个页内的数据会独立进行压缩。通过按页压缩，Doris 能够高效地处理大规模数据集，同时保证高效的压缩率和解压性能。

**可配置的压缩策略**
   用户可以在创建表时指定需要使用的压缩算法。这种灵活性使用户可以根据具体工作负载，在压缩效率和性能之间做出最佳选择。

## 影响压缩效果的因素

虽然不同的压缩算法有不同的优缺点，但压缩的效果不仅仅依赖于选择的算法，还受以下因素的影响：

### 数据的序列性（Order of Data）
   数据的顺序对于压缩效果有重要影响。对于具有高序列性的列（例如时间戳或连续数值列），压缩算法通常能够获得更好的效果。数据的顺序越有规律，压缩算法在压缩时可以识别出更多的重复模式，从而提升压缩比。

### 数据的重复度（Data Redundancy）
   数据列中重复值越多，压缩效果越明显。例如，使用字典编码对重复值进行编码能够显著降低存储空间。而对于没有明显重复的数据列，压缩效果可能不如预期。

### 数据的类型（Data Type）
   数据的类型也会影响压缩效果。通常，数值类型的数据（如整数和浮点数）比字符串类型的数据更容易压缩。对于浮动范围较大的数据类型，压缩算法的效果可能会受到影响。

### 列的长度（Column Length）
   列中数据的长度也会影响压缩效果。较短的列通常比长列更容易压缩，因为压缩算法在较短数据块上能够更高效地找到重复模式。

### 空值（Nulls）
   列中空值的比例较高时，压缩算法可能会更有效，因为压缩算法会将这些空值作为一种特殊的模式进行编码，减少存储空间。


## 如何选择合适的压缩算法

选择合适的压缩算法需根据工作负载特性：

- 对于 **高性能实时分析** 场景，推荐使用 **LZ4** 或 **Snappy**。
- 对于 **存储效率优先** 的场景，推荐使用 **ZSTD** 或 **Zlib**。
- 对于需要兼顾速度和压缩率的场景，可选择 **LZ4F**。
- 对于 **归档或冷数据存储** 场景，建议使用 **Zlib** 或 **LZ4HC**。

## 在 Doris 中设置压缩

创建表时，可以通过设置压缩算法来指定存储数据的压缩方式：

```sql
CREATE TABLE example_table (
    id INT,
    name STRING,
    age INT
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "compression" = "zstd"
);
