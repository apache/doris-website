---
{
    "title": "SHOW TRASH",
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

该语句用于查看 backend 内的垃圾数据占用空间。

语法：

```sql
SHOW TRASH [ON BackendHost:BackendHeartBeatPort];
```

说明：


1. Backend 格式为该节点的 BackendHost:BackendHeartBeatPort
2. TrashUsedCapacity 表示该节点垃圾数据占用空间。

## 示例

1. 查看所有 be 节点的垃圾数据占用空间。


   ```sql
    SHOW TRASH;
   ```

2. 查看'192.168.0.1:9050'的垃圾数据占用空间 (会显示具体磁盘信息)。
>>>>>>> b09980be91d (2.1)

   ```sql
   SHOW TRASH ON "192.168.0.1:9050";
   ```

## 关键词

    SHOW, TRASH

## 最佳实践

