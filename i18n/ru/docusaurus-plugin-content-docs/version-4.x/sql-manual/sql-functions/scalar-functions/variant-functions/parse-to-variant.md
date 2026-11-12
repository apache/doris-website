---
{
    "title": "PARSE_TO_VARIANT",
    "language": "ru",
    "description": "Разбирает одно полное значение JSON из текста или выражения JSON/JSONB и преобразует его в типизированное значение VARIANT."
}
---

## Описание {#description}

`PARSE_TO_VARIANT` разбирает одно полное значение JSON и преобразует его в `VARIANT`. Функция принимает объекты, массивы, строки, числа, логические значения JSON и JSON-литерал `null`. Эта функция доступна в Doris 4.1.4 и более поздних версиях.

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

- Если на вход подано SQL `NULL`, возвращается SQL `NULL`.
- Для JSON-литерала `null` возвращается значение Variant/JSON `null`, которое отличается от SQL `NULL`.
- Некорректный JSON, повторяющиеся ключи объекта, отклоняемые текущими настройками валидации, неподдерживаемая глубина вложенности или другая ошибка валидации приводят к ошибке выполнения запроса.

## Пример {#example}

Разбор текста JSON:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------------+
| value                                  |
+----------------------------------------+
| {"id":42,"tags":["doris","sql"]}     |
+----------------------------------------+
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

Извлечение значения и приведение его к конкретному типу SQL с помощью CAST:

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

Некорректный JSON приводит к ошибке:

```sql
SELECT PARSE_TO_VARIANT('{"id":');
```

```text
ERROR: Parse json document failed
```

## Примечания по использованию {#usage-notes}

- Используйте [TRY_PARSE_TO_VARIANT](./try-parse-to-variant), если некорректные входные данные должны преобразовываться в SQL `NULL`, а не приводить к ошибке выполнения запроса.
- `PARSE_TO_VARIANT` явно выполняет разбор JSON. В отличие от этого, `CAST(string AS VARIANT)` сохраняет входное значение как строку VARIANT и не выполняет разбор JSON; см. [правила приведения типов VARIANT](../../../basic-element/sql-data-types/semi-structured/VARIANT#supported-operations-and-cast-rules).
