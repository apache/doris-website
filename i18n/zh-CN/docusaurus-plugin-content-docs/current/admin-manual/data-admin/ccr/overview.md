---
{
    "title": "概述",
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

## 概览

### CCR 是什么

CCR(Cross Cluster Replication) 是跨集群数据同步，能够在库/表级别将源集群的数据变更同步到目标集群，可用于在线服务的数据可用性、隔离在离线负载、建设两地三中心。

### 适用场景

CCR 通常被用于容灾备份、读写分离、集团与公司间数据传输和隔离升级等场景。

- 容灾备份：通常是将企业的数据备份到另一个集群与机房中，当突发事件导致业务中断或丢失时，可以从备份中恢复数据或快速进行主备切换。一般在对 SLA 要求比较高的场景中，都需要进行容灾备份，比如在金融、医疗、电子商务等领域中比较常见。

- 读写分离：读写分离是将数据的查询操作和写入操作进行分离，目的是降低读写操作的相互影响并提升资源的利用率。比如在数据库写入压力过大或在高并发场景中，采用读写分离可以将读/写操作分散到多个地域的只读/只写的数据库案例上，减少读写间的互相影响，有效保证数据库的性能及稳定性。

- 集团与分公司间数据传输：集团总部为了对集团内数据进行统一管控和分析，通常需要分布在各地域的分公司及时将数据传输同步到集团总部，避免因为数据不一致而引起的管理混乱和决策错误，有利于提高集团的管理效率和决策质量。

- 隔离升级：当在对系统集群升级时，有可能因为某些原因需要进行版本回滚，传统的升级模式往往会因为元数据不兼容的原因无法回滚。而使用 CCR 可以解决该问题，先构建一个备用的集群进行升级并双跑验证，用户可以依次升级各个集群，同时 CCR 也不依赖特定版本，使版本的回滚变得可行。

### 任务类别

CCR 支持两个类别的任务，分别是库级别和表级别，库级别的任务同步一个库的数据，表级别的任务只同步一个表的数据。

## 原理与架构

### 名词解释

源集群：源头集群，业务数据写入的集群，需要 2.0 版本

目标集群：跨集群同步的目标集群，需要 2.0 版本

binlog：源集群的变更日志，包括 schema 和数据变更

syncer：一个轻量级的进程

上游：库级别任务时指上游库，表级别任务时指上游表。

下游：库级别任务时指下游库，表级别人物时指下游表。

### 架构说明

![ccr 架构说明](/images/ccr-architecture-description.png)

CCR 工具主要依赖一个轻量级进程：Syncers。Syncers 会从源集群获取 binlog，直接将元数据应用于目标集群，通知目标集群从源集群拉取数据。从而实现全量和增量迁移。

### 同步方式

CCR 支持四种同步方式：

| 同步方式    |   原理    |      触发时机     |
|------------|-----------|------------------|
| Full Sync  |  上游全量backup，下游restore。 | 首次同步或者操作触发，操作见功能列表。 |
| Partial Sync  |  上游表或者分区级别 Backup，下游表或者分区级别restore。 | 操作触发，操作见功能列表。 |
| TXN  |  增量数据同步，上游提交之后，下游开始同步。 | 操作触发，操作见功能列表。 |
| SQL  |  在下游回放上游操作的 SQL。 | 操作触发，操作见功能列表。 |
