---
{
    "title": "ISNAN",
    "language": "ru",
    "description": "Определяет, является ли указанное значение NaN (не число)."
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

Определяет, является ли указанное значение NaN (не число).

## Синтаксис {#syntax}

```sql
ISNAN(<value>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<value>` | Проверяемое значение, которое должно иметь тип DOUBLE или FLOAT |

## Возвращаемое значение {#return-value}

Возвращает 1, если значение является NaN, в противном случае возвращает 0.
Если значение равно NULL, возвращает NULL.

## Примеры {#examples}

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
