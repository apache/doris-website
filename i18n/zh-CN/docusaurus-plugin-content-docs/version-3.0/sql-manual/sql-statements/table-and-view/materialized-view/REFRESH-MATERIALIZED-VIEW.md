---
{
    "title": "REFRESH MATERIALIZED VIEW",
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

该语句用于手动刷新指定的异步物化视图

语法：

```sql
REFRESH MATERIALIZED VIEW mvName=multipartIdentifier (partitionSpec | COMPLETE | AUTO)
```

说明：

异步刷新某个物化视图的数据

- AUTO：会计算物化视图的哪些分区和基表不同步（目前，如果基表是外表，会被认为始终和物化视图同步，因此如果基表是外表，需要指定`COMPLETE`或指定要刷新的分区），然后刷新对应的分区
- COMPLETE：会强制刷新物化视图的所有分区，不会判断分区是否和基表同步
- partitionSpec：会强制刷新指定的分区，不会判断分区是否和基表同步

## 示例

1. 刷新物化视图 mv1(自动计算要刷新的分区)

    ```sql
    REFRESH MATERIALIZED VIEW mv1 AUTO;
    ```

2. 刷新名字为 p_19950801_19950901 和 p_19950901_19951001 的分区

    ```sql
    REFRESH MATERIALIZED VIEW mv1 partitions(p_19950801_19950901,p_19950901_19951001);
    ```
 
3. 强制刷新物化视图全部数据

    ```sql
    REFRESH MATERIALIZED VIEW mv1 complete;
    ```
   
## 关键词

    REFRESH, MATERIALIZED, VIEW

### 最佳实践

