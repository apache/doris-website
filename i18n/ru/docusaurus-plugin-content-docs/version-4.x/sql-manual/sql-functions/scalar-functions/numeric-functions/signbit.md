---
{
    "title": "SIGNBIT",
    "language": "ru",
    "description": "Определяет, установлен ли знаковый бит заданного числа с плавающей точкой."
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

Определяет, установлен ли знаковый бит заданного числа с плавающей точкой.

## Синтаксис {#syntax}

```sql
SIGNBIT(<a>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<a>` | Число с плавающей точкой, знаковый бит которого нужно проверить |

## Возвращаемое значение {#return-value}

Возвращает true, если знаковый бит `<a>` установлен (то есть `<a>` имеет отрицательное значение), в противном случае возвращает false.
Функция также позволяет различать положительный и отрицательный нули в числах с плавающей точкой.

## Примеры {#examples}

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
