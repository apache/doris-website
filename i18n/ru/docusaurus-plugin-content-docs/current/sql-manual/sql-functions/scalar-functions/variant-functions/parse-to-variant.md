---
{
    "title": "PARSE_TO_VARIANT",
    "language": "ru",
    "description": "Разбирает одно полное значение JSON из текста или выражения JSON/JSONB и преобразует его в типизированное значение VARIANT."
}
---

## Описание {#description}

`PARSE_TO_VARIANT` разбирает одно полное значение JSON и преобразует его в `VARIANT`. Функция принимает объекты JSON, массивы, строки, числа, логические значения и литерал JSON `null`. Эта функция доступна в Doris 4.1.4 и более поздних версиях; на этой странице описано её поведение в Doris 5.0.0 и более поздних версиях.

## Синтаксис {#syntax}

```sql
PARSE_TO_VARIANT(<json_value>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<json_value>` | Выражение типа `CHAR`, `VARCHAR` или `STRING`, содержащее одно полное значение JSON, либо выражение типа `JSON`/`JSONB`. Входные данные JSON/JSONB преобразуются в текст JSON, а затем разбираются как VARIANT. |

## Возвращаемое значение {#return-value}

Возвращает значение типа `VARIANT`.

- Если входное значение равно SQL `NULL`, возвращается SQL `NULL`.
- Для литерала JSON `null` возвращается VARIANT `null`, который отличается от SQL `NULL`.
- Текст, не являющийся корректным JSON, возвращается в виде строки VARIANT. То же происходит с JSON, содержащим целое число вне диапазона [-2^63, 2^64 - 1] или число вне диапазона `DOUBLE`: весь текст становится одной строкой. Это поведение определяется параметром конфигурации BE `variant_throw_exeception_on_invalid_json` (по умолчанию `false`); если он равен `true`, такие входные данные приводят к ошибке запроса.
- Для пустой строки возвращается пустой объект `{}`.
- Документ с такой глубокой вложенностью, что сам парсер JSON его отклоняет (около 1,000 уровней), считается некорректным JSON и также возвращается в виде строки.
- Запрос завершается с ошибкой, если длина ключа объекта превышает `variant_max_json_key_length` байт (параметр конфигурации BE, по умолчанию 255), если объект содержит повторяющиеся ключи (кроме случая, когда параметр конфигурации BE `variant_enable_duplicate_json_path_check` равен `true`: тогда сохраняется первое значение), если глубина вложенности превышает 128 уровней или если строка не является корректной строкой UTF-8.

## Пример {#example}

Разбор текста JSON:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------+
| value                            |
+----------------------------------+
| {"id":42,"tags":["doris","sql"]} |
+----------------------------------+
```

Разбор выражения JSON/JSONB:

```sql
SELECT CAST(
           PARSE_TO_VARIANT(CAST('{"id": 42}' AS JSON))
           AS STRING
       ) AS value;
```

```text
+-----------+
| value     |
+-----------+
| {"id":42} |
+-----------+
```

Извлечение значения и его приведение к конкретному типу SQL с помощью CAST:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"user": {"id": 42}}')['user']['id']
           AS BIGINT
       ) AS user_id;
```

```text
+---------+
| user_id |
+---------+
|      42 |
+---------+
```

SQL `NULL` остаётся SQL `NULL`:

```sql
SELECT PARSE_TO_VARIANT(NULL) IS NULL AS is_sql_null;
```

```text
+-------------+
| is_sql_null |
+-------------+
|           1 |
+-------------+
```

Текст, не являющийся корректным JSON, сохраняется в виде строки:

```sql
SELECT CAST(PARSE_TO_VARIANT('{"id":') AS STRING) AS value,
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS type;
```

```text
+--------+--------+
| value  | type   |
+--------+--------+
| {"id": | string |
+--------+--------+
```

Повторяющиеся ключи вызывают ошибку:

```sql
SELECT PARSE_TO_VARIANT('{"id": 1, "id": 2}');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INVALID_ARGUMENT]Duplicate Variant object key
```

## Примечания по использованию {#usage-notes}

- Используйте [TRY_PARSE_TO_VARIANT](./try-parse-to-variant.md), если при ошибке разбора нужно вернуть SQL `NULL` вместо завершения запроса с ошибкой.
- `PARSE_TO_VARIANT` явно выполняет разбор JSON. В отличие от этой функции, `CAST(string AS VARIANT)` и `INSERT` строки в столбец VARIANT сохраняют входное значение в виде строки VARIANT и не выполняют разбор JSON. Чтобы записать текст JSON с помощью `INSERT`, оберните его в вызов `PARSE_TO_VARIANT`. См. [Запись данных](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#write-data) и [Приведение к VARIANT](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#cast-to-variant).
