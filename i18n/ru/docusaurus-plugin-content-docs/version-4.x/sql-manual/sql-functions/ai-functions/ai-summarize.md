---
{
    "title": "AI_SUMMARIZE",
    "language": "ru",
    "description": "Используется для создания краткого изложения текста."
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

Используется для создания краткого изложения текста.

## Синтаксис {#syntax}

```sql
AI_SUMMARIZE([<resource_name>], <text>)
```

## Параметры {#parameters}

|    Параметр       | Описание                  |
| ----------------- | ------------------------- |
| `<resource_name>` | Имя указанного ресурса    |
| `<text>`          | Текст для краткого изложения |

## Возвращаемое значение {#return-value}

Возвращает краткое изложение текста.

Если любой из входных аргументов равен NULL, возвращает NULL.

Результат генерируется большой языковой моделью, поэтому вывод может различаться.

## Примеры {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SUMMARIZE('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.') AS Result;
```
```text
+-------------------------------------------------------------------+
| Result                                                            |
+-------------------------------------------------------------------+
| Apache Doris is a high-speed, MPP-based real-time data warehouse. |
+-------------------------------------------------------------------+
```

```sql
SELECT AI_SUMMARIZE('resource_name','Doris supports high-concurrency, real-time analytics and is widely used in business intelligence scenarios.') AS Result;
```

```text
+------------------------------------------------------------------------------------------------+
| Result                                                                                         |
+------------------------------------------------------------------------------------------------+
| Doris is a high-concurrency, real-time analytics tool commonly used for business intelligence. |
+------------------------------------------------------------------------------------------------+
```
