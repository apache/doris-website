---
{
    "title": "user_privileges",
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

查看用户赋权信息。

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型         | 说明                   |
| :------------- | :----------- | :--------------------- |
| GRANTEE        | varchar(81)  | 被授权用户             |
| TABLE_CATALOG  | varchar(512) | 永远为 def             |
| PRIVILEGE_TYPE | varchar(64)  | 权限类型               |
| IS_GRANTABLE   | varchar(3)   | 是否可以给其他用户授权 |