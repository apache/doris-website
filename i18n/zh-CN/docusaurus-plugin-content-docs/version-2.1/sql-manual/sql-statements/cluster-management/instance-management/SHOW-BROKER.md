---
{
    "title": "SHOW BROKER",
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

该语句用于查看当前存在的 broker 进程状态。

## 语法：

```sql
SHOW BROKER;
```

## 必选参数
无

## 输出字段
| 列名    | 类型 | 说明 |
 |-------|----|----|
| Name  | varchar | Broker 进程名称 |
| Host  | varchar | Broker 进程所在节点 IP |
| Port  | varchar | Broker 进程所在节点 Port |
| Alive | varchar | Broker 进程状态 |
| LastStartTime | varchar | Broker 进程上次启动时间 |
|LastUpdateTime | varchar | Broker 进程上次更新时间 |
|ErrMsg | varchar | Broker 进程上次启动失败的错误信息 |


## 权限控制
执行该语句的用户需要具备 `ADMIN/OPERATOR` 的权限

## 示例
1. 查看当前存在的 broker 进程状态
```sql
show broker;
```
```text
+-------------+------------+------+-------+---------------------+---------------------+--------+
| Name        | Host       | Port | Alive | LastStartTime       | LastUpdateTime      | ErrMsg |
+-------------+------------+------+-------+---------------------+---------------------+--------+
| broker_test | 10.10.10.1 | 8196 | true  | 2025-01-21 11:30:10 | 2025-01-21 11:31:40 |        |
+-------------+------------+------+-------+---------------------+---------------------+--------+
```

