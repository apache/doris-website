---
{
    "title": "SIGNBIT",
    "language": "ja",
    "description": "指定された浮動小数点数の符号ビットが立っているかどうかを判定します。"
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

指定された浮動小数点数の符号ビットが立っているかどうかを判定します。

## 構文

```sql
SIGNBIT(<a>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<a>` | 符号ビットを調べる浮動小数点数 |

## 戻り値

`<a>` の符号ビットが立っている場合（つまり `<a>` が負の場合）は true を、それ以外の場合は false を返します。
浮動小数点数の正のゼロと負のゼロも区別できます。

## 例

```sql
select signbit(-1.0);
```

```text
+---------------+
| signbit(-1.0) |
+---------------+
|             1 |
+---------------+
```

```sql
select signbit(0.0);
```

```text
+--------------+
| signbit(0.0) |
+--------------+
|            0 |
+--------------+
```

```sql
select signbit(1.0);
```

```text
+--------------+
| signbit(1.0) |
+--------------+
|            0 |
+--------------+
```

```sql
select signbit(cast('+0.0' as double)) , signbit(cast('-0.0' as double));
```

```text
+---------------------------------+---------------------------------+
| signbit(cast('+0.0' as double)) | signbit(cast('-0.0' as double)) |
+---------------------------------+---------------------------------+
|                               0 |                               1 |
+---------------------------------+---------------------------------+
```
