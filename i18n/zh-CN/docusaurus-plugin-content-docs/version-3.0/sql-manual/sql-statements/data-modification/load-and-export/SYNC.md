---
{
    "title": "SYNC",
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

该语句用于同步非 Master Frontend（FE）节点的元数据。在 Apache Doris 中，只有 Master FE 节点可以写入元数据，其他 FE 节点的元数据写入操作都会转发至 Master 节点。在 Master 节点完成元数据写入操作后，非 Master 节点会存在短暂的元数据同步延迟。可以使用该语句强制同步元数据。

## 语法

```sql
SYNC;
```


## 权限控制

任意用户或角色都可以执行该操作

## 示例

同步元数据：

    ```sql
    SYNC;
    ```