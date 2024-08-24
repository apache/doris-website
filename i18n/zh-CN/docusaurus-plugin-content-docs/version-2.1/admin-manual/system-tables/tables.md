---
{
    "title": "tables",
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

存储当前 Catalog 下所有的表信息。

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 说明 |
|---|---|---|
| TABLE_CATALOG   | VARCHAR(512)  | 所属 Catalog  | 
| TABLE_SCHEMA    | VARCHAR(64)   | 所属 Database  | 
| TABLE_NAME      | VARCHAR(64)   | 表名称  | 
| TABLE_TYPE      | VARCHAR(64)   | 表类型，包括：SYSTEM VIEW、VIEW、BASE TABLE  | 
| ENGINE          | VARCHAR(64)   | 表引擎类型  | 
| VERSION         | BIGINT        | 无效值  | 
| ROW_FORMAT      | VARCHAR(10)   | 无效值  | 
| TABLE_ROWS      | BIGINT        | 表预估行数  | 
| AVG_ROW_LENGTH  | BIGINT        | 表平均行大小 | 
| DATA_LENGTH     | BIGINT        | 表预估大小  | 
| MAX_DATA_LENGTH | BIGINT        | 无效值  | 
| INDEX_LENGTH    | BIGINT        | 无效值  | 
| DATA_FREE       | BIGINT        | 无效值  | 
| AUTO_INCREMENT  | BIGINT        | 无效值  | 
| CREATE_TIME     | DATETIME      | 表创建时间  | 
| UPDATE_TIME     | DATETIME      | 表更新时间  | 
| CHECK_TIME      | DATETIME      | 无效值  | 
| TABLE_COLLATION | VARCHAR(32)   | 固定值：utf-8  | 
| CHECKSUM        | BIGINT        | 无效值  | 
| CREATE_OPTIONS  | VARCHAR(255)  | 无效值  | 
| TABLE_COMMENT   | VARCHAR(2048) | 表注释  |

## 示例

无

