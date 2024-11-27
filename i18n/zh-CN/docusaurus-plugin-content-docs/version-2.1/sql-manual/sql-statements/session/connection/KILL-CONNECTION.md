---
{
    "title": "KILL CONNECTION",
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

杀死一个指定连接 ID 的连接。进而会杀死此连接对应的查询。

## 语法

```sql
KILL [ CONNECTION ] <connection_id>
```

## 必选参数

`<connection_id>`

> 链接的 ID。可以通过 SHOW PROCESSLIST 语句查询。

## 权限控制

执行此 SQL 命令的用户必须是此连接所属的用户，或者至少具有`ADMIN_PRIV`权限

## 示例

查询 `connection_id`:

```sql
show processlist;
```

结果如下：

```sql
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
| CurrentConnected | Id | User | Host            | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             | FE           | CloudCluster |
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
| Yes              | 16 | root | 127.0.0.1:63746 | 2024-11-04 20:18:07 | internal | test | Query   | 0    | OK    | e4d69a1cce81468d-91c9ae32b17540e9 | show processlist | 172.16.123.1 | NULL         |
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
```

发送 KILL 命令

```sql
KILL CONNECTION 16;
```