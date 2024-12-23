---
{
    "title": "业务连续性和数据恢复",
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

**Doris** 提供了强大的容灾管理能力，通过 **跨集群数据同步**、**备份与恢复** 和 **回收站恢复** 三大功能，帮助用户有效应对硬件故障、软件错误或人为失误导致的数据丢失问题，确保数据的高可用性和可靠性。

---

## 1. 跨集群数据同步

Doris 的跨集群数据同步功能支持在不同的 Doris 集群间进行数据的实时复制，确保重要数据分布在多个物理或逻辑隔离的集群中，实现地理级容灾。

### 主要特性：

- **实时同步**：支持全量和增量同步。全量同步在初始阶段复制所有数据；增量同步持续捕获和同步数据变更，包括数据（新增、修改、删除）和表结构变更（DDL）。
- **数据一致性**：通过日志机制（如 Binlog）记录数据变更，确保目标集群与源集群数据完全一致。
- **地域级容灾**：支持不同地理位置集群间的同步，当一个集群发生故障时，其他集群可以快速接管业务。
- **多场景应用**：适用于容灾备份、业务分离（如读写分离）、多活集群等场景。

### 应用场景示例：
某公司在不同城市部署了两个 Doris 集群，A 集群为主集群，B 集群为备份集群。通过跨集群数据同步，当 A 集群因自然灾害中断服务时，B 集群可无缝接管业务，最大限度减少停机时间。

---

## 2. 备份与恢复

Doris 提供了全面的备份与恢复功能，用于定期保存数据快照，防止因意外事件导致的数据丢失。

### 主要特性：

- **全量备份**：支持对指定数据库或表进行全量备份，保存完整数据快照。

### 应用场景示例：
某公司定期对数据进行备份，并将备份文件存储在对象存储服务（如 Amazon S3）中。当误操作导致某张重要表被删除时，利用备份功能快速恢复丢失数据，确保业务正常运行。

---

## 3. 回收站恢复

Doris 提供了 **回收站** 功能，为用户提供了一种快速恢复最近删除数据的方法，减少因操作失误带来的影响。

### 主要特性：

- **临时删除**：表或数据库被删除后会先移动到回收站，而不是立即永久删除。
- **保留期**：删除的数据在回收站中保留一段可配置的时间，用户可在此期间选择恢复。
- **快速恢复**：无需完整备份恢复，即可轻松从回收站找回误删的数据。
- **数据安全**：如果不需要恢复，回收站中的数据将在保留期后自动清理。

### 应用场景示例：
某团队在例行操作中误删除了一张重要表，通过回收站功能，他们快速恢复了被删除的数据，避免了复杂的备份恢复流程，同时确保了业务的连续性。

---

## 4. 全面的容灾实践

通过结合跨集群数据同步、备份与恢复以及回收站恢复功能，Doris 可以帮助用户构建全面而高效的容灾方案：

- **主动容灾**：利用跨集群同步实现异地多活部署，快速切换业务。
- **被动容灾**：定期备份数据，确保即使发生最严重的数据丢失，也可通过恢复备份重新启动业务。
- **快速修复**：通过回收站功能快速恢复因误操作而删除的数据。
- **测试与验证**：定期验证备份、同步和回收站功能，确保容灾方案的有效性。

---

## 总结

Doris 的容灾能力基于跨集群同步、备份与恢复和回收站恢复三大核心功能，为用户提供了：

- 全面的数据保护。
- 灵活的容灾解决方案。
- 快速恢复因操作失误或系统故障丢失的数据。

无论是应对日常数据管理中的偶发性错误，还是为极端灾难做好准备，Doris 都是构建高可靠性数据系统的理想选择。深入了解 Doris 的功能，制定适合您业务需求的容灾方案！
