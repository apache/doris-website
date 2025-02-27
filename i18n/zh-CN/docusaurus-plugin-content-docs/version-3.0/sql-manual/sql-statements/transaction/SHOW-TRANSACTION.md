---
{
    "title": "SHOW TRANSACTION",
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

## 描述

该语法用于查看指定 transaction id 或 label 的事务详情。

### 语法

```sql
SHOW TRANSACTION
[FROM <db_name>]
WHERE
[id = <transaction_id> | label = <label_name>];
```

## 必选参数
**1. `<transaction_id>`**

需要查看事务详情的 transaction id

**2. `<label_name>`**

需要查看事务详情的 label

## 可选参数

**1. `<db_name>`**

需要查看事务详情的 database


## 返回值

| Column name  | Description |
|---|---|
| TransactionId | 事务 id  | 
| Label | 导入任务对应的 label  | 
| Coordinator | 负责事务协调的节点  | 
| TransactionStatus | 事务状态  | 
| PREPARE | 准备阶段  | 
| COMMITTED | 事务成功，但数据不可见  | 
| VISIBLE | 事务成功且数据可见  | 
| ABORTED | 事务失败  | 
| LoadJobSourceType | 导入任务的类型  | 
| PrepareTime | 事务开始时间  | 
| CommitTime | 事务提交成功的时间  | 
| FinishTime | 数据可见的时间  | 
| Reason | 错误信息  | 
| ErrorReplicasCount | 有错误的副本数  | 
| ListenerId | 相关的导入作业的 id  | 
| TimeoutMs | 事务超时时间，单位毫秒  | 

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV    | Database   | 只有拥有 ADMIN_PRIV 的用户才能操作 |


## 示例

1. 查看 id 为 4005 的事务：

    ```sql
    SHOW TRANSACTION WHERE ID=4005;
    ```

2. 指定 db 中，查看 id 为 4005 的事务：

    ```sql
    SHOW TRANSACTION FROM db WHERE ID=4005;
    ```

3. 查看 label 为 label_name 的事务：
    
    ```sql
    SHOW TRANSACTION WHERE LABEL = 'label_name';
    ```


