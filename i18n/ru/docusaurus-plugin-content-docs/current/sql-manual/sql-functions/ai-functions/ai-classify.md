---
{
    "title": "AI_CLASSIFY",
    "language": "ru",
    "description": "Используется для классификации текста по заданному набору меток."
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

Используется для классификации текста по заданному набору меток.

## Синтаксис {#syntax}

```sql
AI_CLASSIFY([<resource_name>], <text>, <labels>)
```

## Параметры {#parameters}

|    Параметр       | Описание                                    |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | Имя используемого ресурса, необязательно     |
| `<text>`          | Текст для классификации                     |
| `<labels>`        | Массив меток классификации                  |

## Возвращаемое значение {#return-value}

Возвращает одну метку, которая лучше всего соответствует тексту.

Если хотя бы один входной аргумент имеет значение NULL, возвращает NULL.

Результат генерируется большой языковой моделью, поэтому вывод может различаться.

## Примеры {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_CLASSIFY('Apache Doris is a databases system.', ['usage', 'introduce']) AS Result;
```
```text
+-----------+
| Result    |
+-----------+
| introduce |
+-----------+
```

```sql
SELECT AI_CLASSIFY('resource_name', 'Apache Doris is developing rapidly.', ['science', 'sport']) AS Result;
```
```text
+---------+
| Result  |
+---------+
| science |
+---------+
```
