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

Doris 提供了备份和恢复操作支持。这些功能使用户能够将数据从库、表或者分区备份到远程存储系统，并在需要时进行恢复。

## 要求

- **管理员权限**：只有具有 **ADMIN** 权限的用户才能执行备份和恢复操作。

## 关键概念

**快照**：
   快照是数据库、表或分区中数据的时间点捕获，创建快照时需要指定一个快照 Label，快照完成时会生成一个时间戳，可以通过 Repository、快照 Label 和时间戳标识一个快照。

**Repository**：
   备份文件存储的远程存储位置，支持的远程存储包括 S3、Azure、GCP、OSS、COS、MinIO、HDFS 和其它兼容 S3 的对象存储。

**备份操作**：
   备份操作涉及创建数据库、表或分区的快照，将快照文件上传到远程 Repository，并存储与备份相关的元数据。

**恢复操作**：
   恢复操作涉及从远程 Repository 中备份并将其恢复到 Doris 集群。

## 关键特性

1. **备份数据**：
   Doris 允许您通过创建快照来备份表、分区或整个数据库的数据。数据以文件格式备份并存储在 HDFS、S3 或其他兼容 S3 的远程存储系统上。

2. **恢复数据**：
   您可以从远程 Repository 恢复备份数据到任何 Doris 集群。这包括完整数据库恢复、完整表恢复和分区级恢复，允许灵活的数据恢复。

3. **快照管理**：
   数据以快照的形式备份。这些快照被上传到远程存储系统，并可以在需要时恢复。恢复过程涉及下载快照文件并将其映射到本地元数据以使其有效。

4. **数据迁移**：
   除了备份和恢复，此功能还支持在不同 Doris 集群之间的数据迁移。您可以将数据备份到远程存储系统并恢复到另一个 Doris 集群，帮助进行集群迁移场景。

5. **复制控制**：
   在恢复数据时，您可以指定恢复数据的副本数量，以确保冗余和容错。

## 限制

1. **存储与计算解耦**：
   存算分离模式不支持备份和恢复。

2. **不支持异步物化视图 (MTMV)**：
   不支持备份或恢复 **异步物化视图 (MTMV)**。在备份和恢复操作中，这些视图不被考虑。

3. **不支持具有存储策略的表**：
   使用了 [**存储策略**](../../../table-design/tiered-storage/remote-storage) 的表 **不支持** 备份和恢复操作。

4. **增量备份**：
   目前，Doris 仅支持全量备份。增量备份（仅存储自上次备份以来更改的数据）尚不支持，您可以可以备份特定分区来实现增量备份。

5. **colocate_with 属性**：
   在备份或恢复操作期间，Doris 不会保留表的 `colocate_with` 属性。这可能需要在恢复后重新配置共置表。

6. **动态分区支持**：
   恢复表之后，需要使用 `ALTER TABLE` 命令手动启用此属性。

7. **单并发**：
   一个数据库下同时只能运行一个备份或者恢复任务。

