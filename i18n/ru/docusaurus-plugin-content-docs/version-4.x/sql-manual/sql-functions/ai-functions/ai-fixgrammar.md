---
{
    "title": "AI_FIXGRAMMAR",
    "language": "ru",
    "description": "Используется для исправления грамматических ошибок в тексте."
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

Используется для исправления грамматических ошибок в тексте.

## Синтаксис {#syntax}

```sql
AI_FIXGRAMMAR([<resource_name>], <text>)
```

## Параметры {#parameters}

|    Параметр       | Описание                                    |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | Имя используемого ресурса, необязательный параметр |
| `<text>`          | Текст, в котором требуется исправить грамматические ошибки |

## Возвращаемое значение {#return-value}

Возвращает строку текста после исправления грамматических ошибок.

Если любой из входных параметров равен NULL, возвращает NULL.

Результат генерируется большой языковой моделью, поэтому вывод может различаться.

## Примеры {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_FIXGRAMMAR('Apache Doris a great system DB') AS Result;
```
```text
+------------------------------------------+
| Result                                   |
+------------------------------------------+
| Apache Doris is a great database system. |
+------------------------------------------+
```

```sql
SELECT AI_FIXGRAMMAR('resource_name', 'I am like to using Doris') AS Result;
```
```text
+--------------------+
| Result             |
+--------------------+
| I like using Doris |
+--------------------+
```
