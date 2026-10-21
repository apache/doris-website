---
{
    "title": "ISINF",
    "language": "ko",
    "description": "지정된 값이 무한대인지 확인합니다."
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

## 설명 {#description}

지정된 값이 무한대인지 확인합니다.

## 구문 {#syntax}

```sql
ISINF(<value>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<value>` | 확인할 값으로, DOUBLE 또는 FLOAT 타입이어야 합니다. |

## 반환 값 {#return-value}

값이 무한대(양수 또는 음수)이면 1을 반환하고, 그렇지 않으면 0을 반환합니다.
값이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

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
