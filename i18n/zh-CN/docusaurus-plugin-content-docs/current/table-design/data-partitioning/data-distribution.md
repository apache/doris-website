---
{
    "title": "数据分布概念",
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

数据写入表时，Doris 会根据表的分区和分桶策略将表中数据行分布到各个数据分片（Tablet）上。通过数据分布 Doris 可以利用多机的存储和计算能力，从而实现了大规模数据存储和处理。运行查询时，优化器会做分区分桶裁剪，JOIN 或者聚合查询时，数据可能在节点间传输（Shuffle）。使用合理的分区分桶策略，可以充分利用分区裁剪、COLOCATE 优化查询性能。

## 节点

Doris 集群由一组 FE 节点和 BE 节点组成，每个节点有独立的操作系统、专用内存和磁盘存储。FE 节点负责集群元数据的管理和 SQL 的解析规划，分片（Tablet）是最重要的一种元数据；BE 节点负责数据的存储和查询处理。FE 完成规划之后，计算任务会发往 BE，BE 计算完成后会把最总的结果返回到 FE，FE 把查询结果返回给用户。分片（Tablet）的数据存储在 BE 的磁盘上。

## 表和分片

数据写入 Doris 的表时，Doris 首先根据分区类型和分区列的值将数据行映射到对应的分区，接着根据分桶列将数据行映射到分区下的一个分片，这样数据行就有了对应的存储位置。

### 分区

可以从分区类型和分区模式来掌握 Doris 的分区。分区类型决定了数据行映射到哪个分区，分区模式决定了分区的创建方式。

- 分区类型：Doris 支持 Range 分区和 List 分区。
   - Range：是指把分区列的值在某个范围内的数据行映射到一个分区
   - List：是指把分区列等于某些具体值的数据行映射到一个分区。

- 分区模式：Doris 支持手动、动态和自动三种模式创建分区。他们分别是：
   - 手动：用户创建表时指定分区或者使用 Alter 语句增加分区。
   - 动态：Doris 根据分区的时间调度创建分区，导入数据时不会创建分区。
   - 自动：Doris 根据导入的数据按需创建分区。

### 分桶

Doris 支持 Hash 和 Random 两种分桶类型。

- Hash：根据数据行分桶列值的 Hash 值将数据行映射到分区内分片，Doris 采用了 crc32 和取余分桶数的方式。
- Random：数据行随机地映射到分区内分片，对于小写可以使用 load_to_single_tablet 优化小文件。

为了优化大表的关联和聚合查询，可以使用 COLOCATE（../../DataQueries/Join.md#colocate-join） 优化性能。

## 数据分布目标

Doris 中的数据分布最主要目标是:

 - 利用多节点的存储和计算处理能力，即将数据均衡的分布到各个 BE 节点。不均的数据分布或者数据倾斜使得一些节点处理数据超过其它节点，从而影响查询性能。

其它目标包括：

 - 优化查询性能：根据查询特征充分利用分区分桶裁剪以及 COLOCATE 大幅优化查询性能。
 - 灵活数据管理：比如根据时间分区，冷数据保存到 HDD，热数据保存到 SSD，删除历史分区释放数据。
 - 元数据合理：每个分片（Tablet）的元数据会在 FE 和 BE 中，需要合理的控制分片数目。根据经验值每 1000w 分片 FE 至少需要 100G 内存，单个 BE 承载的分片数目应该小于 2w。
 - 写入吞吐：每个分区的分桶数不适宜过大（推荐 < 128），过大会影响写入吞吐。每次写入涉及的分区数也不适宜过大，推荐每次导入少数分区。

