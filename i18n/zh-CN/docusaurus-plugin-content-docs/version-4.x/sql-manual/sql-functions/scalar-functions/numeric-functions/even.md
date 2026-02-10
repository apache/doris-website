---
{
    "title": "EVEN",
    "language": "zh-CN",
    "description": "将输入值向零的反方向进位（舍入）到下一个偶数整数。"
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

## Description

将输入值向零的反方向进位（舍入）到下一个偶数整数。

## Syntax

```sql
EVEN(<a>)
```


## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | 要舍入为偶数的数值表达式 |

## Return Value

返回一个偶数整数，规则如下：

 - 若 x > 0，则向上舍入到最接近的偶数；

 - 若 x < 0，则向下舍入到最接近的偶数；

 - 若 x 本身为偶数，则直接返回。
 - 若 x 为 NULL，返回 NULL

## Examples

```sql
select even(2.9);
```

```text
+----------+
| even(2.9) |
+----------+
|        4 |
+----------+
```

```sql
select even(-2.9);
```

```text
+-----------+
| even(-2.9) |
+-----------+
|       -4  |
+-----------+
```

```sql
select even(4);
```

```text
+--------+
| even(4) |
+--------+
|      4 |
+--------+
```

```sql
select even(NULL);
```

```text
+------------+
| even(NULL) |
+------------+
|       NULL |
+------------+
```