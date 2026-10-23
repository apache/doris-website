---
{
    "title": "EVEN",
    "language": "ru",
    "description": "Округляет до следующего чётного числа в направлении от нуля."
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

Округляет до следующего чётного числа в направлении от нуля.

## Синтаксис {#syntax}

```sql
EVEN(<a>)
```


## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<a>` | Числовое выражение, которое нужно округлить до следующего чётного целого числа |

## Возвращаемое значение {#return-value}

Возвращает чётное целое число по следующим правилам:

- Если x > 0, округляет вверх до ближайшего чётного числа.
- Если x < 0, округляет вниз до ближайшего чётного числа.
- Если x уже является чётным числом, возвращает его без изменений.
- Если x равен NULL, возвращает NULL.

## Примеры {#examples}

```sql
select even(2.9);
```

```text
+-----------+
| even(2.9) |
+-----------+
|         4 |
+-----------+
```

```sql
select even(-2.9);
```

```text
+------------+
| even(-2.9) |
+------------+
|         -4 |
+------------+
```

```sql
select even(4);
```

```text
+---------+
| even(4) |
+---------+
|       4 |
+---------+
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
