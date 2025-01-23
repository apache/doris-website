---
{
    "title": "SHOW PROCESSLIST",
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

显示用户正在运行的线程

## 语法

```sql
SHOW [FULL] PROCESSLIST
```

## 可选参数

**1. `FULL`**

> 表示是否查看其他用户的连接信息

## 返回值

| 列名 | 说明                                   |
| -- |--------------------------------------|
| CurrentConnected | 是否为当前连接                              |
| Id | 这个线程的唯一标识                            |
| User | 启动这个线程的用户                            |
| Host | 记录了发送请求的客户端的 IP 和 端口号                |
| LoginTime | 建立连接的时间                              |
| Catalog | 当前执行的命令是在哪一个数据目录上                    |
| Db | 当前执行的命令是在哪一个数据库上，如果没有指定数据库，则该值为 NULL |
| Command | 此刻该线程正在执行的命令                         |
| Time | 上一条命令提交到当前状态的时间，单位为秒                 |
| State | 线程的状态                                |
| QueryId | 当前查询语句的 ID                           |
| Info | 一般记录的是线程执行的语句，默认只显示前 100 个字符         |

常见的 Command 类型如下：

| 列名 | 说明 |
| -- | -- |
| Query | 该线程正在执行一个语句 |
| Sleep | 正在等待客户端向它发送执行语句 |
| Quit | 该线程正在退出 |
| Kill | 正在执行 kill 语句 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                  |
|:--------------|:-----------|:---------------------------|
| ADMIN_PRIV         | 数据库   | 若需要查看其他用户的连接信息则需要 ADMIN 权限 |

## 示例

```sql
SHOW PROCESSLIST
```

```text
+------------------+------+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+-----------------------+
| CurrentConnected | Id   | User | Host            | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info                  |
+------------------+------+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+-----------------------+
| Yes              |    0 | root | 127.0.0.1:34650 | 2025-01-21 12:01:02 | internal | test | Query   |    0 | OK    | c84e397193a54fe7-bbe9bc219318b75e | select 1              |
|                  |    1 | root | 127.0.0.1:34776 | 2025-01-21 12:01:07 | internal |      | Sleep   |   29 | EOF   | 886ffe2894314f50-8dd73a6ca06699e4 | show full processlist |
+------------------+------+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+-----------------------+
```


