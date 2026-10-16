---
{
    "title": "ISNAN",
    "language": "ja",
    "description": "指定した値が NaN（非数）かどうかを判定します。"
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

## 説明

指定した値が NaN（非数）かどうかを判定します。

## 構文

```sql
ISNAN(<value>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<value>` | 判定する値。DOUBLE 型または FLOAT 型である必要があります。 |

## 戻り値

値が NaN の場合は 1、それ以外の場合は 0 を返します。
値が NULL の場合は NULL を返します。

## 例

```sql
SELECT isnan(1);
```

```text
+----------+
| isnan(1) |
+----------+
|        0 |
+----------+
```

```sql
SELECT cast('nan' as double),isnan(cast('nan' as double));
```

```text
+-----------------------+------------------------------+
| cast('nan' as double) | isnan(cast('nan' as double)) |
+-----------------------+------------------------------+
|                   NaN |                            1 |
+-----------------------+------------------------------+
```

```sql
SELECT isnan(NULL)
```

```text
+-------------+
| isnan(NULL) |
+-------------+
|        NULL |
+-------------+
```
