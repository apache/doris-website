---
{
    "title": "AI_SENTIMENT",
    "language": "ru",
    "description": "Используется для анализа тональности текста."
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

Используется для анализа тональности текста.

## Синтаксис {#syntax}

```sql
AI_SENTIMENT([<resource_name>], <text>)
```

## Параметры {#parameters}

|    Параметр      | Описание                |
| ----------------- | ------------------------- |
| `<resource_name>` | Имя используемого ресурса|
| `<text>`          | Текст для анализа тональности |

## Возвращаемое значение {#return-value}

Возвращает результат анализа тональности. Возможные значения:
- positive
- negative
- neutral
- mixed

Если любой из входных параметров равен NULL, возвращает NULL.

Результат генерируется большой языковой моделью, поэтому может меняться.

## Примеры {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DB system.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| positive |
+----------+
```

```sql
SELECT AI_SENTIMENT('resource_name', 'I hate sunny days.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| negative |
+----------+
```
