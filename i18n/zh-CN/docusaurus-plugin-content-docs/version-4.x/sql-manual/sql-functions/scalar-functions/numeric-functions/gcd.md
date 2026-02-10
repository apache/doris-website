---
{
    "title": "GCD",
    "language": "zh-CN",
    "description": "计算两个整数的最大公约数。"
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

计算两个整数的最大公约数。

## Syntax

```sql
GCD(<a>, <b>)
```


## Parameters

| Parameter | Description |
| -- | -- |
| `<a>` | 第一个整数 |
| `<b>` | 第二个整数 |

## Return Value

返回值为 `<a>` 和 `<b>` 的最大公约数
任意一个输入为 NULL，返回 NULL

## Examples

```sql
select gcd(54, 24);
```

```text
+------------+
| gcd(54,24) |
+------------+
|          6 |
+------------+
```

```sql
select gcd(-17, 31);
```

```text
+-------------+
| gcd(17,31)  |
+-------------+
|           1 |
+-------------+
```

```sql
select gcd(0, 10);
```

```text
+-----------+
| gcd(0,10) |
+-----------+
|        10 |
+-----------+
```

```sql
select gcd(54, NULL);
```

```text
+---------------+
| gcd(54, NULL) |
+---------------+
|          NULL |
+---------------+
```