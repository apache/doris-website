---
{
    "title": "JSON_VALID",
    "language": "en",
    "description": "The JSONVALID function returns 0 or 1 to indicate whether the input is a valid JSON. If the input is NULL, it returns NULL."
}
---

## Description

The JSON_VALID function is used to validate whether the input is valid JSON format. This function accepts String type or JSON type input and validates the JSON format.

## Syntax

```sql
JSON_VALID(<str>)
JSON_VALID(<json>)
```

## Parameters

- `<str>`: String type, the JSON format string to be validated
- `<json>`: JSON type, the JSON value to be validated

## Return Values

- `1`: When the input is valid JSON format
- `0`: When the input is not valid JSON format
- `NULL`: When the input parameter is NULL

## Notes

The support for JSON type parameters is to avoid potential issues that might occur with implicit type conversion (JSON to String) when passing a JSON column. Typically, data stored in JSON type columns is valid JSON data, so calling JSON_VALID on a JSON type parameter usually returns 1.

## Alias

- JSONB_VALID

## Examples

1. Validate a valid JSON string
    ```sql
    SELECT json_valid('{"k1":"v31","k2":300}');
    ```
    ```text
    +-------------------------------------+
    | json_valid('{"k1":"v31","k2":300}') |
    +-------------------------------------+
    |                                   1 |
    +-------------------------------------+
    ```

2. Validate an invalid JSON string
    ```sql
    SELECT json_valid('invalid json');
    ```
    ```text
    +----------------------------+
    | json_valid('invalid json') |
    +----------------------------+
    |                          0 |
    +----------------------------+
    ```

3. Validate NULL parameter
    ```sql
    SELECT json_valid(NULL);
    ```
    ```text
    +------------------+
    | json_valid(NULL) |
    +------------------+
    |             NULL |
    +------------------+
    ```

4. Validate JSON type parameter
    ```sql
    SELECT json_valid(cast('{"k1":"v31","k2":300}' as json));
    ```
    ```text
    +----------------------------------------------------+
    | json_valid(cast('{"k1":"v31","k2":300}' as json)) |
    +----------------------------------------------------+
    |                                                  1 |
    +----------------------------------------------------+
    ```
