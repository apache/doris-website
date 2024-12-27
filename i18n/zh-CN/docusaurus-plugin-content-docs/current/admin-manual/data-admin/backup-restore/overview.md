---
{
    "title": "备份和恢复概述",
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

## 介绍

Apache Doris 提供了强大的备份和恢复操作支持。这些功能使用户能够将数据从表或整个数据库备份到远程存储系统，并在需要时进行恢复。该系统支持基于快照的备份，这些快照捕获数据在特定时间点的状态，并可以存储在 HDFS 和对象存储等远程存储库中。

## 要求

- **管理员权限**：只有具有 **管理员** 权限的用户才能执行备份和恢复操作。

## 关键概念

1. **快照**：
   快照是数据库、表或分区中数据的时间点捕获，通过获取一致的版本号并创建硬链接来保持数据。快照可以通过存储库名称和时间戳来识别。

2. **存储库**：
   备份文件存储的远程存储位置。支持的存储库包括 S3、Azure、GCP、OSS、COS、MinIO、HDFS 和其他对象存储。

3. **备份操作**：
   备份操作涉及创建数据库、表或分区的快照，将快照文件上传到远程存储库，并存储与备份相关的元数据。

4. **恢复操作**：
   恢复操作涉及从远程存储库下载备份并将其恢复到 Doris 集群。

## 关键特性

1. **备份数据**：
   Doris 允许您通过创建快照来备份来自表、分区或整个数据库的数据。数据以文件格式备份并存储在 HDFS、S3 或其他兼容系统的远程存储系统上。

2. **恢复数据**：
   您可以从远程存储库恢复备份数据到任何 Doris 集群。这包括完整数据库恢复、完整表恢复和分区级恢复，允许灵活的数据恢复。

3. **快照管理**：
   数据以快照的形式备份。这些快照被上传到远程存储系统，并可以在需要时恢复。恢复过程涉及下载快照文件并将其映射到本地元数据以使其有效。

4. **数据迁移**：
   除了备份和恢复，此功能还支持在不同 Doris 集群之间的数据迁移。您可以将数据备份到远程存储系统并恢复到另一个 Doris 集群，帮助进行集群迁移场景。

5. **复制控制**：
   在恢复数据时，您可以指定恢复数据的副本数量，以确保冗余和容错。

## 不支持的特性

虽然 Doris 提供了强大的备份和恢复能力，但在某些场景中存在一些限制和不支持的特性：

1. **存储与计算解耦**：
   存储和计算解耦模式不支持备份和恢复。

2. **不支持异步物化视图 (MTMV)**：
   不支持备份或恢复 **异步物化视图 (MTMV)**。在备份和恢复操作中，这些视图不被考虑。

3. **不支持具有存储策略的表**：
   定义了 [**存储策略**](../../../table-desgin/tiered-storage/remote-storage.md) 的表 **不支持** 备份和恢复操作。

4. **增量备份**：
   目前，Doris 仅支持完整备份。增量备份（仅存储自上次备份以来更改的数据）尚不支持，尽管用户可以备份特定分区。

5. **与属性共置**：
   在备份或恢复操作期间，Doris 不会保留表的 `colocate_with` 属性。这可能需要在恢复后重新配置共置表。

6. **动态分区支持**：
   虽然 Doris 支持动态分区，但在备份期间将禁用动态分区属性。恢复数据时，需要使用 `ALTER TABLE` 命令手动启用此属性。


