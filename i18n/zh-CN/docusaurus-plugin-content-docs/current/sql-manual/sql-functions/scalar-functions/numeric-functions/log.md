---
{
    "title": "LOG",
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

返回基于底数`b`的`x`的对数。

## 语法

```sql
LOG(<a>,<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>`   | 底数 必须大于 0 且不等于 1 |
| `<x>`   | 真数 必须大于 0         |

## 返回值

返回一个浮点数。特殊情况：

- 当 a 为 NULL 或 x 为 NULL 时，返回`NULL`

## 举例

```sql
select log(5,1);
```

```text
+---------------+
| log(5.0, 1.0) |
+---------------+
|             0 |
+---------------+
```

```sql
select log(3,20);
```

```text
+--------------------+
| log(3.0, 20.0)     |
+--------------------+
| 2.7268330278608417 |
+--------------------+
```

```sql
select log(2,65536);
```

```text
+-------------------+
| log(2.0, 65536.0) |
+-------------------+
|                16 |
+-------------------+
```

```sql
select log(5,NULL);
```

```text
+------------------------------+
| log(cast(5 as DOUBLE), NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```

```sql
select log(NULL,3);
```

```text
+------------------------------+
| log(NULL, cast(3 as DOUBLE)) |
+------------------------------+
|                         NULL |
+------------------------------+
```