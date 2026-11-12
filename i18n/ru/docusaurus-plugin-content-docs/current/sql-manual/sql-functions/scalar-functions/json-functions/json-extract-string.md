---
{
    "title": "JSON_EXTRACT_STRING",
    "language": "ru",
    "description": "JSONEXTRACTSTRING извлекает из объекта JSON поле, указанное с помощью <jsonpath>, и преобразует его в тип STRING."
}
---

## Описание {#description}
`JSON_EXTRACT_STRING` извлекает из объекта JSON поле, указанное с помощью `<json_path>`, и преобразует его в тип [`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md).

## Синтаксис {#syntax}
```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<json_object>` | Обязательный. Значение JSON или корректный текст JSON, который можно преобразовать в JSON. |
| `<json_path>` | Обязательный. Путь JSON типа STRING; для обхода массивов явно указывайте подстановочный символ. |

## Возвращаемое значение {#return-value}
`Nullable(STRING)`: извлечённое значение типа STRING; в некоторых случаях возвращается NULL.

## Примечания по использованию {#usage-notes}
1. Если `<json_object>` или `<json_path>` имеет значение NULL, возвращается NULL.
2. Если элемент, указанный с помощью `<json_path>`, не существует, возвращается NULL.
3. Если элемент, указанный с помощью `<json_path>`, невозможно преобразовать в STRING, возвращается NULL.
4. Поведение соответствует сочетанию "cast + json_extract", то есть следующему выражению:
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
    Поэтому, даже если объект, на который указывает `<json_path>`, имеет тип, отличный от STRING, можно получить преобразованное значение, если объект поддерживает преобразование в STRING.
5. Возвращаемое значение STRING не содержит двойных кавычек (").
6. Для значений null в объектах JSON возвращается строка "null", а не NULL. 
Если нужно проверить, является ли элемент null, используйте функцию  [`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md).

## Примеры {#examples}
1. Обычные параметры
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name');
    ```
    ```text
```

```text
+---------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name') |
    +---------------------------------------------------------------+
    | doris                                                         |
    +---------------------------------------------------------------+
    ```
2. Case where path does not exist
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name2');
    ```
    ```text
    +----------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name2') |
    +----------------------------------------------------------------+
    | NULL                                                           |
    +----------------------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', NULl) |
    +-----------------------------------------------------------+
    | NULL                                                      |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_string(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_string(NULL, '$.id2') |
    +------------------------------------+
    | NULL                               |
    +------------------------------------+
    ```
4. Case where other types are converted to STRING
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}','$.id');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}','$.id') |
    +------------------------------------------------------------+
    | 123                                                        |
    +------------------------------------------------------------+
    ```
5. Null values will be converted to string "null" instead of NULL
    ```sql
    SELECT json_extract_string('{"id": null, "name": "doris"}','$.id');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_string('{"id": null, "name": "doris"}','$.id') |
    +-------------------------------------------------------------+
    | null                                                        |
    +-------------------------------------------------------------+
    ```

### Extracting the same field from array elements (Doris 4.0 and later)

Use `$[*].k1` to traverse array elements explicitly. `$.k1` only accesses object members and does not implicitly traverse an array, so the direct path below returns SQL `NULL`. Array elements without `k1` are omitted from the matches.

The result is a `STRING` containing JSON array text, rather than a SQL `ARRAY`.
```sql
SELECT json_extract_string('[{"k1":"v1"},{"k2":"v2"},{"k1":"v3"},{"k1":"v4"}]', '$.k1') AS direct_path,
       json_extract_string('[{"k1":"v1"},{"k2":"v2"},{"k1":"v3"},{"k1":"v4"}]', '$[*].k1') AS all_values;
```

```text
+-------------+------------------+
| direct_path | all_values       |
+-------------+------------------+
| NULL        | ["v1","v3","v4"] |
+-------------+------------------+
```
