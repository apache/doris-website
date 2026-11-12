---
{
    "title": "AI_MASK",
    "language": "ru",
    "description": "Маскирует в тексте конфиденциальную информацию, соответствующую указанным меткам."
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

Маскирует в тексте конфиденциальную информацию, соответствующую указанным меткам.

## Синтаксис {#syntax}

```sql
AI_MASK([<resource_name>], <text>, <labels>)
```

## Параметры {#parameters}

|    Параметр       | Описание                                                         |
| ----------------- | ---------------------------------------------------------------- |
| `<resource_name>` | Имя указанного ресурса                                           |
| `<text>`          | Текст, который может содержать конфиденциальную информацию        |
| `<labels>`        | Массив меток для маскирования, например `ARRAY('name', 'phone', 'email')` |

## Возвращаемое значение {#return-value}

Возвращает текст с замаскированной конфиденциальной информацией. Замаскированные фрагменты заменяются на "[MASKED]".

Если какой-либо входной параметр равен NULL, возвращает NULL.

Результат генерируется большой языковой моделью, поэтому вывод может различаться.

## Примеры {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_MASK('Wccccat is a 20-year-old Doris community contributor.', ['name', 'age']) AS Result;
```
```text
+-----------------------------------------------------+
| Result                                              |
+-----------------------------------------------------+
| [MASKED] is a [MASKED] Doris community contributor. |
+-----------------------------------------------------+
```

```sql
SELECT AI_MASK('resource_name', 'My email is rarity@example.com and my phone is 123-456-7890',
                ['email', 'phone_num']) AS RESULT;
```

```text
+-----------------------------------------------+
| RESULT                                        |
+-----------------------------------------------+
| My email is [MASKED] and my phone is [MASKED] |
+-----------------------------------------------+
```
