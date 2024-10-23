---
{
    "title": "workload_group_privileges",
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

存储 Workload Group 的权限信息

## 所属数据库


`information_schema`


## 表信息

| 列名                | 类型         | 说明                   |
| :------------------ | :----------- | :--------------------- |
| GRANTEE             | varchar(64)  | 被赋权用户             |
| WORKLOAD_GROUP_NAME | varchar(256) | Workload Group 的名字  |
| PRIVILEGE_TYPE      | varchar(64)  | 权限类别               |
| IS_GRANTABLE        | varchar(3)   | 是否可以授权给其他用户 |