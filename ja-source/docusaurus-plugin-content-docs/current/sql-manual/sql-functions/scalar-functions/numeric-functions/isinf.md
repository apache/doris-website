---
{
  "title": "ISINF",
  "language": "ja",
  "description": "指定された値が無限大かどうかを判定します。"
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

指定された値が無限大かどうかを判定します。

## 構文

```sql
ISINF(<value>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<value>` | チェックする値。DOUBLE型またはFLOAT型である必要があります |

## 戻り値

値が無限大（正または負）の場合は1を返し、そうでなければ0を返します。
値がNULLの場合は、NULLを返します。

## 例

```sql
SELECT isinf(1);
```
```text
+----------+
| isinf(1) |
+----------+
|        0 |
+----------+
```
```sql
SELECT cast('inf' as double),isinf(cast('inf' as double))
```
```text
+-----------------------+------------------------------+
| cast('inf' as double) | isinf(cast('inf' as double)) |
+-----------------------+------------------------------+
|              Infinity |                            1 |
+-----------------------+------------------------------+
```
```sql
SELECT isinf(NULL)
```
```text
+-------------+
| isinf(NULL) |
+-------------+
|        NULL |
+-------------+
```
