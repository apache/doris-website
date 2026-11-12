---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "ru",
    "description": "Пытается разобрать одно полное значение JSON и преобразовать его в VARIANT; при ошибке разбора или проверки возвращает SQL NULL."
}
---

## Описание {#description}

`TRY_PARSE_TO_VARIANT` пытается разобрать одно полное значение JSON и преобразовать его в `VARIANT`. Префикс `TRY_` означает, что при ошибке разбора или проверки возвращается SQL `NULL`, а выполнение запроса не завершается с ошибкой. Эта функция доступна в Doris 4.1.4 и более поздних версиях.

## Синтаксис {#syntax}

```sql
TRY_PARSE_TO_VARIANT(<json_value>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<json_value>` | Выражение типа `CHAR`, `VARCHAR` или `STRING`, содержащее одно полное значение JSON, либо выражение типа `JSON`/`JSONB`. Входные данные JSON/JSONB преобразуются в текст JSON, который затем разбирается и преобразуется в VARIANT. |

## Возвращаемое значение {#return-value}

Возвращает значение типа `VARIANT`, которое может быть NULL.

- Для корректных входных данных возвращается значение VARIANT, полученное в результате разбора.
- При некорректном JSON или другой ошибке разбора или проверки возвращается SQL `NULL`.
- Если на вход передан SQL `NULL`, возвращается SQL `NULL`.
- Корректный литерал JSON `null` возвращает Variant/JSON `null`, а не SQL `NULL`.

## Пример {#example}

Сохранение корректных значений и преобразование некорректного JSON в SQL `NULL`:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id":') IS NULL AS invalid_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-----------------+---------------+
| valid_value | invalid_is_null | input_is_null |
+-------------+-----------------+---------------+
| {"id":1}    |               1 |             1 |
+-------------+-----------------+---------------+
```

Разбор входных данных JSON/JSONB:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT(CAST('[10, 20, 30]' AS JSON))
           AS STRING
       ) AS value;
```

```text
+------------+
| value      |
+------------+
| [10,20,30] |
+------------+
```

JSON `null` и SQL `NULL` остаются различными значениями:

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       TRY_PARSE_TO_VARIANT('{') IS NULL AS error_is_sql_null;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | error_is_sql_null |
+-----------------------+-------------------+
|                     0 |                 1 |
+-----------------------+-------------------+
```

## Примечания по использованию {#usage-notes}

- Используйте [PARSE_TO_VARIANT](./parse-to-variant), если при некорректных входных данных запрос должен завершаться с ошибкой, указывающей на проблему с качеством данных.
- Эта функция преобразует в SQL `NULL` только ошибки разбора и проверки; смысл корректного значения JSON `null` не меняется.
