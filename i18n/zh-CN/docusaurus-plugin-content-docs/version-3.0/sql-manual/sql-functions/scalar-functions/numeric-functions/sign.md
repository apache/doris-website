---
{
    "title": "SIGN",
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

返回`x`的符号。负数，零或正数分别对应 -1，0 或 1。

## 语法

```sql
SIGN(x)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 自变量 |

## 返回值

返回一个整型：

- 当 x > 0 时，返回 1，代表整数。

- 当 x = 0 时，返回 0，代表零。

- 当 x < 0 时，返回 -1，代表负数。

- 当 x is NULL 时，返回 NULL。

## 举例

```sql
select sign(3);
```

```text
+-------------------------+
| sign(cast(3 as DOUBLE)) |
+-------------------------+
|                       1 |
+-------------------------+
```

```sql
select sign(0);
```

```text
+-------------------------+
| sign(cast(0 as DOUBLE)) |
+-------------------------+
|                       0 |
+-------------------------+
```

```sql
select sign(-10.0);
```

```text
+-----------------------------+
| sign(cast(-10.0 as DOUBLE)) |
+-----------------------------+
|                          -1 |
+-----------------------------+
```

```sql
select sign(null);
```

```text
+------------+
| sign(NULL) |
+------------+
|       NULL |
+------------+
```