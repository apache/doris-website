---
title: 临时表
language: zh-CN
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

:::info 备注
自 2.1.8 / 3.0.3 版本开始支持
:::

在进行复杂数据处理时，将中间计算结果保存为实体表是一种可显著降低 SQL 复杂度、提高数据可调试性的好方法。但这种表需要在使用完毕之后手动清理。目前 Doris 仅支持通过 with 从句定义非实体临时表。

为了解决上述问题，Doris 引入临时表类型。临时表是一种临时存在的物化内表，和内表的主要区别是其仅存在于创建它的 Session中，它的生命周期和当前 Session 绑定。当会话结束时，在其中创建的临时表会被自动删除。从另一方面讲，临时表的可见性也仅在创建它的会话中，即使同一时间同一个用户的另一个会话也不可见。


:::info 备注

与内表类似，临时表必须在 Internal Catalog 内的某个 Database 下创建。但由于临时表基于 Session，因此其命名不受唯一性约束。您可以在不同 Session 中创建同名临时表，或创建与其他内表同名的临时表。

如果同一 Database 中同时存在同名的临时表和非临时表，临时表具有最高访问优先级。在该 Session 内，所有针对同名表的查询和操作仅对临时表生效（除创建物化视图外）。
:::

## 用法

### 创建临时表
各种模型的表都可以被定义为临时表， 不论是 Unique、Aggregate 或是 Duplicate 模型。可以在下列 SQL 中添加 TEMPORARY 关键字创建临时表：
-  [CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)
-  [CREATE TABLE AS SELECT](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-AS-SELECT)
-  [CREATE TABLE LIKE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-LIKE)

临时表的其它用法基本和普通内表相同。除上述 Create 语句外， 其它 DDL 及 DML 语句无需添加 TEMPORARY 关键字。

## 注意事项

- 临时表只能在 Internal Catalog 中创建
- 建表时 `ENGINE` 必须为 `OLAP`
- 不支持使用 Alter 语句修改临时表
- 由于临时性，不支持基于临时表创建视图和物化视图
- 不支持备份临时表，不支持使用 CCR / Sync Job 同步临时表
- 不支持导出、Stream Load、Broker Load、S3 Load、Mysql Load、Routine Load、Spark Load
- 删除临时表时，不进回收站，直接彻底删除