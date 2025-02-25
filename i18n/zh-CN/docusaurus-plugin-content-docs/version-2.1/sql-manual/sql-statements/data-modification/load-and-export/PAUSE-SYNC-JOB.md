---
{
    "title": "PAUSE SYNC JOB",
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

## 描述

通过 `job_name` 暂停一个数据库内正在运行的常驻数据同步作业。被暂停的作业将停止同步数据，并保持消费的最新位置，直到用户恢复该作业。

## 语法

```sql
PAUSE SYNC JOB [<db>.]<job_name>
```

## 必选参数
**1. `<job_name>`**
> 要暂停的同步作业的名称。

## 可选参数
 **1. `<db>`**
 > 如果使用[<db>.]前缀指定了一个数据库，那么该作业将处于指定的数据库中；否则，将使用当前数据库。

## 权限控制

任意用户或角色都可以执行该操作


## 示例

1. 暂停名称为 `job_name` 的数据同步作业。

   ```sql
   PAUSE SYNC JOB `job_name`;
   ```
