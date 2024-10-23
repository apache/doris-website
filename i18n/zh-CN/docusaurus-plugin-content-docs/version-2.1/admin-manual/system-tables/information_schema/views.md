---
{
    "title": "views",
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

存储所有的视图信息。

## 所属数据库


`information_schema`


## 表信息

| 列名                 | 类型          | 说明                         |
| :------------------- | :------------ | :--------------------------- |
| TABLE_CATALOG        | varchar(512)  | Catalog 名称                 |
| TABLE_SCHEMA         | varchar(64)   | Database 名称                 |
| TABLE_NAME           | varchar(64)   | View 名称                    |
| VIEW_DEFINITION      | varchar(8096) | View 定义语句                |
| CHECK_OPTION         | varchar(8)    | 无实际作用，仅用于兼容 MySQL |
| IS_UPDATABLE         | varchar(3)    | 无实际作用，仅用于兼容 MySQL |
| DEFINER              | varchar(77)   | 无实际作用，仅用于兼容 MySQL |
| SECURITY_TYPE        | varchar(7)    | 无实际作用，仅用于兼容 MySQL |
| CHARACTER_SET_CLIENT | varchar(32)   | 无实际作用，仅用于兼容 MySQL |
| COLLATION_CONNECTION | varchar(32)   | 无实际作用，仅用于兼容 MySQL |