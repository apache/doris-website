---
{
    "title": "processlist",
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

查看当前的全部连接

## 所属数据库


`information_schema`


## 表信息

| 列名              | 类型           | 说明                          |
| :---------------- | :------------- | :---------------------------- |
| CURRENT_CONNECTED | varchar(16)    | 已废弃，永远为 No             |
| ID                | largeint       | 连接 ID                       |
| USER              | varchar(32)    | 连接用户                      |
| HOST              | varchar(261)   | 连接地址                      |
| LOGIN_TIME        | datetime       | 登录时间                      |
| CATALOG           | varchar(64)    | 当前 Catalog                  |
| DB                | varchar(64)    | 当前 Database                 |
| COMMAND           | varchar(16)    | 当前发送的 MySQL Command 类型 |
| TIME              | int            | 最后一次查询的执行时间        |
| STATE             | varchar(64)    | 最后一次查询的状态            |
| QUERY_ID          | varchar(256)   | 最后一次查询的 ID             |
| INFO              | varchar(65533) | 最后一次查询的查询语句        |
| FE                | varchar(64)    | 连接的 FE                     |
| CLOUD_CLUSTER     | varchar(64)    | 使用的 Cloud Cluster 名字     |