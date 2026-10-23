---
{
    "title": "SORT_JSON_OBJECT_KEYS",
    "language": "ru",
    "description": "SORTJSONOBJECTKEYS сортирует ключи объекта JSON. Эта функция принимает объект JSON и возвращает новый объект JSON с ключами, отсортированными в "
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

`SORT_JSON_OBJECT_KEYS` сортирует ключи объекта JSON. Эта функция принимает объект JSON и возвращает новый объект JSON с ключами, отсортированными в лексикографическом порядке.

Обратите внимание, что согласно стандарту JSON объекты JSON представляют собой неупорядоченные коллекции. Однако эта функция полезна, когда нужно обеспечить единый порядок ключей, например при сравнении двух объектов JSON на идентичность содержимого.

## Синтаксис {#syntax}

```sql
SORT_JSON_OBJECT_KEYS(json_value)
```

## Псевдоним {#alias}

SORT_JSONB_OBJECT_KEYS

## Параметры {#parameters}

**json_value** - Значение JSON, ключи которого нужно отсортировать. Должно иметь тип JSON.

## Возвращаемое значение {#return-value}

Возвращает новый объект JSON с ключами, отсортированными в лексикографическом порядке. Тип возвращаемого значения совпадает с типом входного значения JSON.

Если входное значение равно NULL, функция возвращает NULL.

## Примеры {#examples}

### Базовая сортировка ключей {#basic-key-sorting}

```sql
SELECT sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json));
```

```text
+------------------------------------------------------------------+
| sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json)) |
+------------------------------------------------------------------+
| {"a":789,"b":123}                                                |
+------------------------------------------------------------------+
```

### Обработка вложенных массивов JSON {#handling-nested-json-arrays}

```sql
SELECT sort_json_object_keys(cast('[{"b":123,"b":456,"a":789},{"b":123},{"b":456},{"a":789}]' as json));
```

```text
+----------------------------------------------------------------------------------------------------+
| sort_json_object_keys(cast('[{"b":123,"b":456,"a":789} ,{"b":123},{"b":456},{"a":789} ]' as json)) |
+----------------------------------------------------------------------------------------------------+
| [{"a":789,"b":123},{"b":123},{"b":456},{"a":789}]                                                  |
+----------------------------------------------------------------------------------------------------+
```

### Обработка значений NULL {#handling-null-values}

```sql
SELECT sort_json_object_keys(null);
```

```text
+-----------------------------+
| sort_json_object_keys(null) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

## Примечания {#notes}

1. Функция `SORT_JSON_OBJECT_KEYS` имеет псевдоним `SORT_JSONB_OBJECT_KEYS`; обе функции работают одинаково.

2. Эта функция сортирует только ключи объектов, не изменяя связанные с ними значения.

3. Функция сортирует только объекты, но не массивы, поскольку согласно стандарту массивы являются упорядоченными коллекциями.

4. Повторяющиеся ключи в объектах JSON объединяются при преобразовании в тип JSON в Doris: сохраняется только первая пара «ключ — значение».

5. Эта функция в основном используется для обеспечения единого порядка ключей объектов JSON при сравнении или отладке, поскольку по умолчанию тип JSON в Doris не гарантирует порядок ключей.
