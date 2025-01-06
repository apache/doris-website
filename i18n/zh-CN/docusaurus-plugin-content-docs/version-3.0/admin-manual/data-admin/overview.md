---
{
    "title": "业务连续性和数据恢复概览",
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

Doris 提供了强大的容灾管理能力，通过跨集群数据同步、备份与恢复和回收站恢复三大功能，帮助用户有效应对硬件故障、软件错误或人为失误导致的数据丢失问题，确保数据的高可用性和可靠性。

## 1. 跨集群数据同步

Doris 的跨集群数据同步功能支持在不同的 Doris 集群间进行数据的实时复制，确保重要数据分布在多个物理隔离的集群中，实现地域级容灾。

### 主要特性：

- **实时同步**：支持全量和增量同步。全量同步在初始阶段复制所有数据；增量同步持续捕获和同步数据变更，包括数据（新增、修改、删除）和表结构变更（DDL）。
- **数据一致性**：通过日志机制（如 Binlog）记录数据变更，确保目标集群与源集群数据完全一致。
- **地域级容灾**：支持不同地理位置集群间的同步，当一个集群发生故障时，其他集群可以快速接管业务。
- **多场景应用**：适用于容灾备份、业务分离（如读写分离）、多活集群等场景。

### 应用场景示例：
某公司在不同城市部署了两个 Doris 集群，A 集群为主集群，B 集群为备份集群。通过跨集群数据同步，当 A 集群因自然灾害中断服务时，B 集群可接管业务，最大限度减少停机时间。

## 2. 备份与恢复

Doris 提供了备份与恢复功能，用于定期保存数据快照，防止因意外事件导致的数据丢失。

### 主要特性：

- **备份**：支持对指定数据库、表或者分区进行全量备份，保存完整数据快照。
- **恢复**：支持从快照中恢复库、表或者分区。

### 应用场景示例：
某公司定期对数据进行备份，并将备份文件存储在对象存储服务（如 Amazon S3）中。当误操作导致某张重要表被删除时，利用备份功能快速恢复丢失数据，确保业务正常运行。

## 3. 回收站恢复

Doris 提供了回收站功能，为用户提供了一种快速恢复最近删除数据的方法，减少因操作失误带来的影响。

### 主要特性：

- **临时删除**：表或数据库被删除后会先移动到回收站，而不是立即永久删除。
- **保留期**：删除的数据在回收站中保留一段可配置的时间，用户可在此期间选择恢复。
- **快速恢复**：无需完整备份恢复，即可轻松从回收站找回误删的数据。
- **数据安全**：如果不需要恢复，回收站中的数据将在保留期后自动清理。

### 应用场景示例：
某团队在例行操作中误删除了一张重要表，通过回收站功能，他们快速恢复了被删除的数据，避免了复杂的备份恢复流程，同时确保了业务的连续性。

