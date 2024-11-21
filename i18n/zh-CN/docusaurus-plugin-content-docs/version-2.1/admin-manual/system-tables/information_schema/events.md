---
{
    "title": "events",
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

此表仅用于兼容 MySQL 行为。永远为空。

## 所属数据库


`information_schema`


## 表信息

| 列名                 | 类型          | 说明 |
| :------------------- | :------------ | :--- |
| EVENT_CATALOG        | varchar(64)   |      |
| EVENT_SCHEMA         | varchar(64)   |      |
| EVENT_NAME           | varchar(64)   |      |
| DEFINER              | varchar(77)   |      |
| TIME_ZONE            | varchar(64)   |      |
| EVENT_BODY           | varchar(8)    |      |
| EVENT_DEFINITION     | varchar(512)  |      |
| EVENT_TYPE           | varchar(9)    |      |
| EXECUTE_AT           | datetime      |      |
| INTERVAL_VALUE       | varchar(256)  |      |
| INTERVAL_FIELD       | varchar(18)   |      |
| SQL_MODE             | varchar(8192) |      |
| STARTS               | datetime      |      |
| ENDS                 | datetime      |      |
| STATUS               | varchar(18)   |      |
| ON_COMPLETION        | varchar(12)   |      |
| CREATED              | datetime      |      |
| LAST_ALTERED         | datetime      |      |
| LAST_EXECUTED        | datetime      |      |
| EVENT_COMMENT        | varchar(64)   |      |
| ORIGINATOR           | int           |      |
| CHARACTER_SET_CLIENT | varchar(32)   |      |
| COLLATION_CONNECTION | varchar(32)   |      |
| DATABASE_COLLATION   | varchar(32)   |      |