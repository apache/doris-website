---
{
    "title": "collations",
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

## 概述

查看所有字符集的排序方法。此表仅用于兼容 MySQL 行为。没有实际的意义。不能真实反映 Doris 所使用的字符排序方法。

## 所属数据库


`information_schema`


## 表信息

| 列名               | 类型         | 说明                             |
| :----------------- | :----------- | :------------------------------- |
| COLLATION_NAME     | varchar(512) | 字符集排序方法名称               |
| CHARACTER_SET_NAME | varchar(64)  | 所属的字符集名称                 |
| ID                 | bigint       | 排序方法 ID                      |
| IS_DEFAULT         | varchar(64)  | 是否为当前默认的排序方法。       |
| IS_COMPILED        | varchar(64)  | 是否编译到服务中                 |
| SORTLEN            | bigint       | 与使用此种排序算法使用的内存相关 |