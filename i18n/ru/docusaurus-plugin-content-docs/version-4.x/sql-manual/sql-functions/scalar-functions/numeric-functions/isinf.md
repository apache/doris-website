---
{
    "title": "ISINF",
    "language": "ru",
    "description": "Определяет, является ли указанное значение бесконечностью."
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

## Описание {#description}

Определяет, является ли указанное значение бесконечностью.

## Синтаксис {#syntax}

```sql
ISINF(<value>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<value>` | Проверяемое значение, которое должно иметь тип DOUBLE или FLOAT |

## Возвращаемое значение {#return-value}

Возвращает 1, если значение является бесконечностью (положительной или отрицательной), иначе возвращает 0.
Если значение равно NULL, возвращает NULL.

## Примеры {#examples}

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
