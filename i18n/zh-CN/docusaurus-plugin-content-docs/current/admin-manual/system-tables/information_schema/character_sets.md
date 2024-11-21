---
{
    "title": "character_sets",
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

查看支持的字符集。此表仅用于兼容 MySQL 行为。并不能真实反映 Doris 所使用的字符集。

## 所属数据库


`information_schema`


## 表信息

| 列名                 | 类型         | 说明                             |
| :------------------- | :----------- | :------------------------------- |
| CHARACTER_SET_NAME   | varchar(512) | 字符集名称                       |
| DEFAULT_COLLATE_NAME | varchar(64)  | 默认的排序规则名称               |
| DESCRIPTION          | varchar(64)  | 字符集详细描述                   |
| MAXLEN               | bigint       | 字符集中单个字符占用的最大字节数 |