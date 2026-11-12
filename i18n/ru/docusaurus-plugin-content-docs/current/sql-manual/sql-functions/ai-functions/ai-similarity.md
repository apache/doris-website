---
{
    "title": "AI_SIMILARITY",
    "language": "ru",
    "description": "Определяет семантическое сходство между двумя текстами."
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

Определяет семантическое сходство между двумя текстами.

## Синтаксис {#syntax}

```sql
AI_SIMILARITY([<resource_name>], <text_1>, <text_2>)
```

## Параметры {#parameters}

| Параметр         | Описание                |
|-------------------|---------------------------|
| `<resource_name>` | Имя указанного ресурса |
| `<text_1>`        | Текст                      |
| `<text_2>`        | Текст                      |

## Возвращаемое значение {#return-value}

Возвращает число с плавающей точкой в диапазоне от 0 до 10. 0 означает отсутствие сходства, а 10 означает высокую степень сходства.

Если хотя бы один входной аргумент равен NULL, возвращает NULL.

Результат генерируется большой языковой моделью, поэтому он может меняться.

## Пример {#example}

Предположим, у вас есть следующая таблица с отзывами, полученными курьерской компанией:
```sql
CREATE TABLE user_comments (
    id      INT,
    comment VARCHAR(500)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);
```

Чтобы упорядочить отзывы с учётом настроения клиентов, можно использовать:
```sql
SELECT comment,
    AI_SIMILARITY('resource_name', 'I am extremely dissatisfied with their service.', comment) AS score
FROM user_comments ORDER BY score DESC LIMIT 5;
```

Результат запроса может выглядеть так:
```text
+-------------------------------------------------+-------+
| comment                                         | score |
+-------------------------------------------------+-------+
| It arrived broken and I am really disappointed. |   7.5 |
| Delivery was very slow and frustrating.         |   6.5 |
| Not bad, but the packaging could be better.     |   3.5 |
| It is fine, nothing special to mention.         |     3 |
| Absolutely fantastic, highly recommend it.      |     1 |
+-------------------------------------------------+-------+
```
