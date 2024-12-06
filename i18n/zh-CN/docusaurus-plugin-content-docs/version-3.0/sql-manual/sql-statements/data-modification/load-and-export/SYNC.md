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

用于 fe 非 master 节点同步元数据。doris 只有 master 节点才能写 fe 元数据，其他 fe 节点写元数据的操作都会转发到 master 节点。在 master 完成元数据写入操作后，非 master 节点 replay 元数据会有短暂的延迟，可以使用该语句同步元数据。

语法：

```sql
SYNC;
```

## 示例

1. 同步元数据

    ```sql
    SYNC;
    ```

## 关键词

    SYNC

### 最佳实践

