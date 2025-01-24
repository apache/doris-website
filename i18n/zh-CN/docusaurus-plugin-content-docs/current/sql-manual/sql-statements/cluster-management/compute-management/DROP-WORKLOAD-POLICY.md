---
{
    "title": "DROP WORKLOAD POLICY",
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

删除一个 Workload Policy

## 语法

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```

## 必选参数

1. `<workload_policy_name>`: Workload Policy 的 Name

## 权限控制

至少具有`ADMIN_PRIV`权限

## 示例

1. 删除一个名为 `cancel_big_query` 的 Workload Policy

    ```sql
    drop workload policy if exists cancel_big_query
    ```