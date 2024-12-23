---
{
    "title": "数据分布概念",
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

在 Doris 中，**数据分布**的核心是通过合理的分区和分桶策略，将写入到表的数据行高效地映射到底层存储的各个 **数据分片（Tablet）** 上。通过数据分布策略，Doris 可以充分利用多节点的存储和计算能力，从而支持大规模数据的高效存储与查询。

---

## 数据分布概览

### 数据写入

数据写入时，Doris 首先根据表的分区策略将数据行分配到对应的分区。接着，根据分桶策略将数据行进一步映射到分区内的具体分片，从而确定了数据行的存储位置。

### 查询执行

查询运行时，Doris 的优化器会根据分区和分桶策略裁剪数据，最大化减少扫描范围。在涉及 JOIN 或聚合查询时，可能会发生跨节点的数据传输（Shuffle）。合理的分区和分桶设计可以减少 Shuffle 并充分利用 **Colocate Join** 优化查询性能。

---

## 节点与存储架构

### 节点类型

Doris 集群由以下两种节点组成：

- **FE 节点（Frontend）**：管理集群元数据（如表、分片），负责 SQL 的解析与执行规划。
- **BE 节点（Backend）**：存储数据，负责计算任务的执行。BE 的结果汇总后返回至 FE，再返回给用户。

### 数据分片（Tablet）

BE 节点的存储数据分片的数据，每个分片是 Doris 中数据管理的最小单元，也是数据移动和复制的基本单位。

---

## 分区策略

分区是数据组织的第一层逻辑划分，用于将表中的数据划分为更小的子集。Doris 提供以下两种 **分区类型** 和三种 **分区模式**：

### 分区类型

- **Range 分区**：根据分区列的值范围将数据行分配到对应分区。
- **List 分区**：根据分区列的具体值将数据行分配到对应分区。

### 分区模式

- **手动分区**：用户手动创建分区（如建表时指定或通过 `ALTER` 语句增加）。
- **动态分区**：系统根据时间调度规则自动创建分区，但写入数据时不会按需创建分区。
- **自动分区**：数据写入时，系统根据需要自动创建相应的分区，使用时注意脏数据生成过多的分区。

---

## 分桶策略

分桶是数据组织的第二层逻辑划分，用于在分区内将数据行进一步划分到更小的单元。Doris 支持以下两种分桶方式：

- **Hash 分桶**：通过计算分桶列值的 `crc32` 哈希值，并对分桶数取模，将数据行均匀分布到分片中。
- **Random 分桶**：随机分配数据行到分片中。使用 Random 分桶时，可以使用 `load_to_single_tablet` 优化小规模数据的快速写入。

---

## 数据分布优化

### Colocate Join

对于需要频繁进行 JOIN 或聚合查询的大表，可以启用 **Colocate** 策略，将相同分桶列值的数据放置在同一物理节点上，减少跨节点的数据传输，从而显著提升查询性能。

### 分区裁剪

查询时，Doris 可以通过过滤条件裁剪掉不相关的分区，从而减少数据扫描范围，降低 I/O 开销。

### 分桶并行

查询时，合理的分桶数可以充分利用机器的计算资源和 I/O 资源。

---

## 数据分布目标

1. **均匀数据分布**
   确保数据均匀分布在各 BE 节点上，避免数据倾斜导致部分节点过载，从而提高系统整体性能。

2. **优化查询性能**
   合理的分区裁剪可以大幅减少扫描的数据量，合理的分桶数可以提升计算并行度，合理利用 Colocate 可以降低 Shuffle 成本，提升 JOIN 和聚合查询效率。

3. **灵活数据管理**
   - 按时间分区保存冷数据（HDD）与热数据（SSD）。
   - 定期删除历史分区释放存储空间。

4. **控制元数据规模**
   每个分片的元数据存储在 FE 和 BE 中，因此需要合理控制分片数量。经验值建议：
   - 每 1000w 分片，FE 至少需 100G 内存。
   - 单个 BE 承载的分片数应小于 2w。

5. **优化写入吞吐**
   - 分桶数应合理控制（建议 < 128），以避免写入性能下降。
   - 每次写入的分区数量应适量（建议每次写入少量分区）。

---

通过精心设计和管理分区与分桶策略，Doris 能够高效地支持大规模数据的存储与查询处理，满足各种复杂业务需求。
