---
{
    "title": "workload_policy",
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

记录 Workload Policy 的配置信息

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型         | 说明                                   |
| :------------- | :----------- | :------------------------------------- |
| ID             | bigint       | Workload Policy 的 ID                  |
| NAME           | varchar(256) | Workload Policy 的名字                 |
| CONDITION      | text         | Workload Policy 的 Condition           |
| ACTION         | text         | Workload Policy 的 Action               |
| PRIORITY       | int          | Workload Policy 的优先级               |
| ENABLED        | boolean      | 是否激活 Workload Policy               |
| VERSION        | int          | Workload Policy 的版本                 |
| WORKLOAD_GROUP | text         | 当前 Policy 绑定的 Workload Group 名称 |