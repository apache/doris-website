---
{
    "title": "JSON_PARSE",
    "language": "en"
}
---

## Description
Parse raw JSON strings into JSON binary format. To meet different exception data processing requirements, different JSON_PARSE series functions are provided, as follows:
* `JSON_PARSE` Parse JSON strings. When the input string is not a valid JSON string, an error is reported.
* `JSON_PARSE_ERROR_TO_NULL` Parse JSON strings. When the input string is not a valid JSON string, return NULL.
* `JSON_PARSE_ERROR_TO_VALUE` Parse JSON strings. When the input string is not a valid JSON string, return the default value specified by the parameter default_json_value.

## Syntax

```sql
JSON_PARSE (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_NULL (<json_str>)
```

```sql
JSON_PARSE_ERROR_TO_VALUE (<json_str>, <default_json_value>)
```

## Parameters
### Required Parameters
- `<json_str>` String type, whose content should be a valid JSON string.
### Optional Parameters
- `<default_json_value>` JSON type, can be NULL. When `<json_str>` parsing fails, `<default_json_value>` is returned as the default value.

## Return Value
`Nullable<JSON>` Returns the parsed JSON object.

## Usage Notes
1. If `<json_str>` is NULL, the result is also NULL.
2. `JSONB_PARSE`/`JSONB_PARSE_ERROR_TO_NULL`/`JSONB_PARSE_ERROR_TO_VALUE` have basically the same behavior, except that the results obtained when parsing fails are different.

## Examples
1. Normal JSON string parsing
    ```sql
    SELECT json_parse('{"k1":"v31","k2":300}');
    ```
    ```text
    +-------------------------------------+
    | json_parse('{"k1":"v31","k2":300}') |
    +-------------------------------------+
    | {"k1":"v31","k2":300}               |
    +-------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null('{"k1":"v31","k2":300}','{}');
    ```
    ```text
    +---------------------------------------------------+
    | json_parse_error_to_null('{"k1":"v31","k2":300}') |
    +---------------------------------------------------+
    | {"k1":"v31","k2":300}                             |
    +---------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}','{}');
    ```
    ```text
    +---------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}','{}') |
    +---------------------------------------------------------+
    | {"k1":"v31","k2":300}                                   |
    +---------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}', NULL);
    ```
    ```text
    +----------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}', NULL) |
    +----------------------------------------------------------+
    | {"k1":"v31","k2":300}                                    |
    +----------------------------------------------------------+
    ```
2. Invalid JSON string parsing
    ```sql
    SELECT json_parse('invalid json');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INTERNAL_ERROR]simdjson parse exception:
    ```
    ```sql
    SELECT json_parse_error_to_null('invalid json');
    ```
    ```text
    +------------------------------------------+
    | json_parse_error_to_null('invalid json') |
    +------------------------------------------+
    | NULL                                     |
    +------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json');
    ```
    ```text
    +-------------------------------------------+
    | json_parse_error_to_value('invalid json') |
    +-------------------------------------------+
    | {}                                        |
    +-------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', '{"key": "default value"}');
    ```
    ```text
    +-----------------------------------------------------------------------+
    | json_parse_error_to_value('invalid json', '{"key": "default value"}') |
    +-----------------------------------------------------------------------+
    | {"key":"default value"}                                               |
    +-----------------------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', NULL);
    ```
    ```text
    +-------------------------------------------------+
    | json_parse_error_to_value('invalid json', NULL) |
    +-------------------------------------------------+
    | NULL                                            |
    +-------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT json_parse(NULL);
    ```
    ```text
    +------------------+
    | json_parse(NULL) |
    +------------------+
    | NULL             |
    +------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null(NULL);
    ```
    ```text
    +--------------------------------+
    | json_parse_error_to_null(NULL) |
    +--------------------------------+
    | NULL                           |
    +--------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value(NULL, '{}');
    ```
    ```text
    +---------------------------------------+
    | json_parse_error_to_value(NULL, '{}') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```