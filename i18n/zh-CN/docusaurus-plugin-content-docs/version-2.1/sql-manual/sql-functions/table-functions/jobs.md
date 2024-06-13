---
{
    "title": "JOBS",
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

## `jobs`

### Name

:::tip
jobs
- since 2.1
:::

### description

表函数，生成任务临时表，可以查看某个任务类型中的job信息。

该函数用于 from 子句中。

#### syntax

`jobs("type"="")`

**参数说明**

| 参数名  | 说明   | 类型     | 是否必填 |
|:-----|:-----|:-------|:-----|
| type | 作业类型 | string | 是    |

type 支持的类型：

- insert：insert into 类型的任务。
- mv：物化视图类型的任务。
##### Insert 任务
jobs("type"="insert")表结构：
```
mysql> desc  function jobs("type"="insert");
+-------------------+------+------+-------+---------+-------+
| Field             | Type | Null | Key   | Default | Extra |
+-------------------+------+------+-------+---------+-------+
| Id                | TEXT | No   | false | NULL    | NONE  |
| Name              | TEXT | No   | false | NULL    | NONE  |
| Definer           | TEXT | No   | false | NULL    | NONE  |
| ExecuteType       | TEXT | No   | false | NULL    | NONE  |
| RecurringStrategy | TEXT | No   | false | NULL    | NONE  |
| Status            | TEXT | No   | false | NULL    | NONE  |
| ExecuteSql        | TEXT | No   | false | NULL    | NONE  |
| CreateTime        | TEXT | No   | false | NULL    | NONE  |
| SucceedTaskCount  | TEXT | No   | false | NULL    | NONE  |
| FailedTaskCount   | TEXT | No   | false | NULL    | NONE  |
| CanceledTaskCount | TEXT | No   | false | NULL    | NONE  |
| Comment           | TEXT | No   | false | NULL    | NONE  |
+-------------------+------+------+-------+---------+-------+
12 rows in set (0.01 sec)
```
* Id：job id.
* Name：job名称.
* Definer：job定义者.
* ExecuteType：执行类型
* RecurringStrategy：循环策略
* Status：job状态
* ExecuteSql：执行SQL
* CreateTime：job 创建时间
* SucceedTaskCount：成功任务数量
* FailedTaskCount：失败任务数量
* CanceledTaskCount：取消任务数量
* Comment：job 注释

SuccessTaskCount, FailedTaskCount, and CanceledTaskCount 新增于 2.1.4.
##### 物化视图任务
jobs("type"="mv")表结构：
```sql
mysql> desc function jobs("type"="mv");
+-------------------+------+------+-------+---------+-------+
| Field             | Type | Null | Key   | Default | Extra |
+-------------------+------+------+-------+---------+-------+
| Id                | TEXT | No   | false | NULL    | NONE  |
| Name              | TEXT | No   | false | NULL    | NONE  |
| MvId              | TEXT | No   | false | NULL    | NONE  |
| MvName            | TEXT | No   | false | NULL    | NONE  |
| MvDatabaseId      | TEXT | No   | false | NULL    | NONE  |
| MvDatabaseName    | TEXT | No   | false | NULL    | NONE  |
| ExecuteType       | TEXT | No   | false | NULL    | NONE  |
| RecurringStrategy | TEXT | No   | false | NULL    | NONE  |
| Status            | TEXT | No   | false | NULL    | NONE  |
| CreateTime        | TEXT | No   | false | NULL    | NONE  |
+-------------------+------+------+-------+---------+-------+
10 rows in set (0.00 sec)
```

* Id：job id.
* Name：job名称.
* MvId：物化视图id
* MvName：物化视图名称
* MvDatabaseId：物化视图所属db id
* MvDatabaseName：物化视图所属db名称
* ExecuteType：执行类型
* RecurringStrategy：循环策略
* Status：job状态
* CreateTime：task创建时间

### example

1. 查看所有物化视图的job

```sql
mysql> select * from jobs("type"="mv");
```

2. 查看 name 为`inner_mtmv_75043`的 job

```sql
mysql> select * from jobs("type"="mv") where Name="inner_mtmv_75043";
```
3. 查看所有 insert 任务

```sql
mysql> select * from jobs("type"="insert");
```
4. 查看 name 为`one_insert_job`的 job

```sql
mysql> select * from jobs("type"="insert") where Name='one_insert_job';
```
### keywords

    jobs, job, insert, mv, materialized view, schedule
