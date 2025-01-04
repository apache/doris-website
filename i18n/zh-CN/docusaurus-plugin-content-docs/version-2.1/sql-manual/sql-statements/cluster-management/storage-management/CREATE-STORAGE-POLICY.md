---
{
   "title": "CREATE STORAGE POLICY",
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
创建一个存储策略，必须先创建存储资源，然后创建迁移策略时候关联创建的存储资源名，具体可参考 RESOURCE 章节。

## 语法

```sql
CREATE STORAGE POLICY <policy_name>
PROPERTIES(
    "storage_resource" = "<storage_resource_name>"
    [{， "cooldown_datetime" = "<cooldown_datetime>"
    ｜ ， "cooldown_ttl" = "<cooldown_ttl>"}]
);
```

## 必选参数

1. `<policy_name>`:待创建的存储策略名字

2. `<storage_resource_name>`:关联的存储资源名字，具体如何创建可参考 RESOURCE 章节

## 可选参数

1. `<cooldown_datetime>`:指定创建数据迁移策略冷却的时间

2. `<cooldown_ttl>`: 指定创建数据迁移策略热数据持续时间

## 权限控制（Access Control Requirements）

执行此 SQL 命令成功的前置条件是，拥有 ADMIN_PRIV 权限，参考权限文档。

| 权限（Privilege） | 对象（Object）   | 说明（Notes）               |
| :---------------- | :--------------- | :-------------------------- |
| ADMIN_PRIV        | 整个集群管理权限 | 除 NODE_PRIV 以外的所有权限 |

## 示例

1. 指定数据冷却时间创建数据迁移策略。

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_datetime" = "2022-06-08 00:00:00"
    );
    ```

2. 指定热数据持续时间创建数据迁移策略

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_ttl" = "1d"
    );
    ```