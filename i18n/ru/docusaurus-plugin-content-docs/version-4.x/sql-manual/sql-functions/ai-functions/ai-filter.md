---
{
    "title": "AI_FILTER",
    "language": "ru",
    "description": "Фильтрует текст по заданным условиям."
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

Фильтрует текст по заданным условиям.

## Синтаксис {#syntax}

```sql
AI_FILTER([<resource_name>], <text>)
```

## Параметры {#parameters}

| Параметр         | Описание                       |
|-------------------|-----------------------------------|
| `<resource_name>` | Имя используемого ресурса, необязательный параметр |
| `<text>`          | Информация для оценки   |

## Возвращаемое значение {#return-value}

Возвращает логическое значение.

Если хотя бы один из входных аргументов равен NULL, возвращает NULL.

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

Чтобы получить положительные отзывы, можно выполнить следующий запрос:
```sql
SELECT id, comment FROM user_comments
WHERE AI_FILTER('resource_name', CONCAT('This is a positive comment: ', comment));
```

Результат может выглядеть так:
```text
+------+--------------------------------------------+
| id   | comment                                    |
+------+--------------------------------------------+
|    1 | Absolutely fantastic, highly recommend it. |
|    3 | This product is amazing and I love it.     |
+------+--------------------------------------------+
```
