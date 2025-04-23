---
{
    "title": "RANDOM",
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

返回 0-1 之间的随机数，或者根据参数返回需要的随机数。

- 注意：所有参数必须为常量。

## 别名

- RAND

## 语法

```sql
RANDOM() --生成 0-1 之间的随机数

RANDOM(<seed>) --根据 seed 种子值，生成一个 0-1 之间的固定随机数序列

RANDOM(<a> , <b>) --生成 a-b 之间的随机数
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<seed>` | 随机数生成器的种子值 根据种子值返回一个 0-1 之间的固定随机数序列 |
| `<a>` | 随机数的下限 |
| `<b>` | 随机数的上限 必须小于下限 |

## 返回值

- 不传参时：返回 0-1 之间的随机数。

- 传入单个参数`seed`时：根据传入的种子值`seed`，返回一个 0-1 之间的固定随机数序列。

- 传入两个参数`a`和`b`时：返回 a-b 之间的随机整数。

## 举例

```sql
select random();
```

```text
+--------------------+
| random()           |
+--------------------+
| 0.8047437125910604 |
+--------------------+
```

```sql
select rand(1.2);
```

```text
+---------------------+
| rand(1)             |
+---------------------+
| 0.13387664401253274 |
+---------------------+
```

```sql
select rand(-20, -10);
```

```text
+------------------+
| random(-20, -10) |
+------------------+
|              -10 |
+------------------+
```
