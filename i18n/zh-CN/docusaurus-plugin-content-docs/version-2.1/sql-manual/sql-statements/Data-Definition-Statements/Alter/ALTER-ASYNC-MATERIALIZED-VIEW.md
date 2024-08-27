---
{
    "title": "ALTER-ASYNC-MATERIALIZED-VIEW",
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

## ALTER-ASYNC-MATERIALIZED-VIEW

### Name

ALTER ASYNC MATERIALIZED VIEW

### Description

该语句用于修改异步物化视图。

#### 语法

```sql
ALTER MATERIALIZED VIEW mvName=multipartIdentifier ((RENAME newName=identifier)
       | (REFRESH (refreshMethod | refreshTrigger | refreshMethod refreshTrigger))
       | REPLACE WITH MATERIALIZED VIEW newName=identifier propertyClause?
       | (SET  LEFT_PAREN fileProperties=propertyItemList RIGHT_PAREN))
```

#### 说明

##### RENAME

用来更改物化视图的名字

例如: 将mv1的名字改为mv2
```sql
ALTER MATERIALIZED VIEW mv1 rename mv2;
```

##### refreshMethod

同[创建异步物化视图](../Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

##### refreshTrigger

同[创建异步物化视图](../Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

##### SET
修改物化视图特有的property

例如修改mv1的grace_period为3000ms
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3000");
```

##### REPLACE
```sql
ALTER MATERIALIZED VIEW [db.]mv1 REPLACE WITH MATERIALIZED VIEW mv2
[PROPERTIES('swap' = 'true')];
```
两个物化视图进行原子的替换操作

swap 默认为 TRUE
- 如果 swap 参数为 TRUE，相当于把物化视图 mv1 重命名为 mv2 , 同时把 mv2 重命名为 mv1
- 如果 swap 参数为 FALSE，相当于把 mv2 重命名为 mv1 ，原有的 mv1 被删除

例如想把 mv1 和 mv2 的名字互换
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2;
```

例如想把 mv2 重命名为 mv1，并删除原先的 mv1
```sql
ALTER MATERIALIZED VIEW db1.mv1 REPLACE WITH MATERIALIZED VIEW mv2
PROPERTIES('swap' = 'false');
```

### Keywords

    ALTER, ASYNC, MATERIALIZED, VIEW

