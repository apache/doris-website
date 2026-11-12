---
{
    "title": "AI_GENERATE",
    "language": "ru",
    "description": "Генерирует ответ на основе входного текста запроса."
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

Генерирует ответ на основе входного текста запроса.

## Синтаксис {#syntax}

```sql
AI_GENERATE([<resource_name>], <prompt>)
```

## Параметры {#parameters}

|    Параметр       | Описание                                        |
| ----------------- | ------------------------------------------------|
| `<resource_name>` | Имя используемого ресурса; необязательный параметр |
| `<prompt>`        | Текст запроса, задающий направление генерации ИИ |

## Возвращаемое значение {#return-value}

Возвращает текст, сгенерированный на основе запроса.

Если какой-либо входной аргумент равен NULL, возвращает NULL.

Результат генерируется большой языковой моделью, поэтому ответы могут различаться.

## Примеры {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_GENERATE('Describe Apache Doris in a few words') AS Result;
```
```text
+---------------------------------------------------------+
| Result                                                  |
+---------------------------------------------------------+
| "Apache Doris is a fast, real-time analytics database." |
+---------------------------------------------------------+
```

```sql
SELECT AI_GENERATE('resource_name', 'What is the founding time of Apache Doris? Return only the date.') AS Result;
```
```text
+--------+
| Result |
+--------+
| 2017   |
+--------+
```
