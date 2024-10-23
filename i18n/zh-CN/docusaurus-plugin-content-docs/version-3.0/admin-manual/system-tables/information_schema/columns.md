---
{
    "title": "columns",
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

查看所有的列信息

## 所属数据库


`information_schema`


## 表信息

| 列名                     | 类型          | 说明                                                         |
| :----------------------- | :------------ | :----------------------------------------------------------- |
| TABLE_CATALOG            | varchar(512)  | Catalog 名称                                                 |
| TABLE_SCHEMA             | varchar(64)   | Database 名称                                                |
| TABLE_NAME               | varchar(64)   | 表名称                                                       |
| COLUMN_NAME              | varchar(64)   | 列名称                                                       |
| ORDINAL_POSITION         | bigint        | 列在表中所处的位置                                           |
| COLUMN_DEFAULT           | varchar(1024) | 列的默认值                                                   |
| IS_NULLABLE              | varchar(3)    | 是否允许为 NULL                                              |
| DATA_TYPE                | varchar(64)   | 数据类型                                                     |
| CHARACTER_MAXIMUM_LENGTH | bigint        | 字符类型允许的最大字符数                                     |
| CHARACTER_OCTET_LENGTH   | bigint        | 字符类型允许的最大字节数                                     |
| NUMERIC_PRECISION        | bigint        | 数值类型的 Precision                                         |
| NUMERIC_SCALE            | bigint        | 数值类型的 Scale                                             |
| DATETIME_PRECISION       | bigint        | datetime 类型的 Precision                                    |
| CHARACTER_SET_NAME       | varchar(32)   | 字符类型的字符集名称，永远为 NULL                            |
| COLLATION_NAME           | varchar(32)   | 字符类型的排序算法名称，永远为 NULL                          |
| COLUMN_TYPE              | varchar(32)   | 列的类型                                                     |
| COLUMN_KEY               | varchar(3)    | 如果是 UNI，则表示当前列是 Unique Key 列                      |
| EXTRA                    | varchar(27)   | 列的一些额外信息。包括展示是否为自增列，是否为 Generated 列等 |
| PRIVILEGES               | varchar(80)   | 永远为空                                                     |
| COLUMN_COMMENT           | varchar(255)  | 列的备注信息                                                 |
| COLUMN_SIZE              | bigint        | 列的宽度                                                     |
| DECIMAL_DIGITS           | bigint        | 数值类型的小数位数                                           |
| GENERATION_EXPRESSION    | varchar(64)   | 永远为 NULL                                                  |
| SRS_ID                   | bigint        | 永远为 NULL                                                  |

