---
{
    "title": "triggers",
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

| 列名                       | 类型          | 说明 |
| :------------------------- | :------------ | :--- |
| TRIGGER_CATALOG            | varchar(512)  |      |
| TRIGGER_SCHEMA             | varchar(64)   |      |
| TRIGGER_NAME               | varchar(64)   |      |
| EVENT_MANIPULATION         | varchar(6)    |      |
| EVENT_OBJECT_CATALOG       | varchar(512)  |      |
| EVENT_OBJECT_SCHEMA        | varchar(64)   |      |
| EVENT_OBJECT_TABLE         | varchar(64)   |      |
| ACTION_ORDER               | varchar(4)    |      |
| ACTION_CONDITION           | varchar(512)  |      |
| ACTION_STATEMENT           | varchar(512)  |      |
| ACTION_ORIENTATION         | varchar(9)    |      |
| ACTION_TIMING              | varchar(6)    |      |
| ACTION_REFERENCE_OLD_TABLE | varchar(64)   |      |
| ACTION_REFERENCE_NEW_TABLE | varchar(64)   |      |
| ACTION_REFERENCE_OLD_ROW   | varchar(3)    |      |
| ACTION_REFERENCE_NEW_ROW   | varchar(3)    |      |
| CREATED                    | datetime      |      |
| SQL_MODE                   | varchar(8192) |      |
| DEFINER                    | varchar(77)   |      |
| CHARACTER_SET_CLIENT       | varchar(32)   |      |
| COLLATION_CONNECTION       | varchar(32)   |      |
| DATABASE_COLLATION         | varchar(32)   |      |