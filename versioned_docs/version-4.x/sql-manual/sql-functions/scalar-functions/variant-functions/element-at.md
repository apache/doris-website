---
{
    "title": "ELEMENT_AT",
    "language": "en",
    "description": "The ELEMENTAT function is used to extract the element value from an array or map based on the specified index or key."
}
---

## Function

The `ELEMENT_AT` function is used to extract the element value from an array or map based on the specified index or key.

- When applied to an **ARRAY**, it returns the element at the specified position.  
- When applied to a **MAP**, it returns the value corresponding to the specified key.  
- When applied to a **VARIANT**, it returns the value of the specified subfield.

## Syntax

```sql
ELEMENT_AT(container, key_or_index)
```

## Parameters

- `container`: Can be `ARRAY`, `MAP`, or `VARIANT`.
- `key_or_index`:
  - For `ARRAY`: An integer, with indexing starting from **1**.  
  - For `MAP`: The key type (`K`) of the `MAP`, which can be any supported primitive type.  
  - For `VARIANT`: A string type.

## Return Value

- For `ARRAY`: Returns the element at the specified index (`T` type).  
- For `MAP`: Returns the value corresponding to the specified key (`V` type).  
- For `VARIANT`: Returns a `VARIANT` type value.  
- If the index or key does not exist, returns `NULL`.  
- If the parameter is `NULL`, returns `NULL`.

## Notes

1. **Array indexes start from 1**, not 0.  
2. Negative indexes are supported: `-1` represents the last element, `-2` the second-to-last, and so on.  
3. The `ELEMENT_AT(container, key_or_index)` function behaves the same as `container[key_or_index]` (see examples for details).

## Examples

1. The `ELEMENT_AT` function works the same as `[]`.

    ```SQL
    SELECT ELEMENT_AT([1, 2, 3], 2);
    +--------------------------+
    | ELEMENT_AT([1, 2, 3], 2) |
    +--------------------------+
    |                        2 |
    +--------------------------+

    SELECT [1, 2, 3][2];
    +--------------+
    | [1, 2, 3][2] |
    +--------------+
    |            2 |
    +--------------+
    ```

2. Array indexing starts from 1; out-of-bounds access returns `NULL`.

    ```SQL
    SELECT ELEMENT_AT([1, 2, 3], 0);
    +--------------------------+
    | ELEMENT_AT([1, 2, 3], 0) |
    +--------------------------+
    |                     NULL |
    +--------------------------+

    SELECT ELEMENT_AT([1, 2, 3], 4);
    +--------------------------+
    | ELEMENT_AT([1, 2, 3], 4) |
    +--------------------------+
    |                     NULL |
    +--------------------------+
    ```

3. Accessing a non-existent KEY in a `MAP` returns `NULL`.

    ```SQL
    SELECT ELEMENT_AT({"a": 1, "b": 2}, "c");
    +-----------------------------------+
    | ELEMENT_AT({"a": 1, "b": 2}, "c") |
    +-----------------------------------+
    |                              NULL |
    +-----------------------------------+
    ```

4. When accessing a subfield of a `VARIANT`, if the `VARIANT` value is not an OBJECT, an empty value is returned.

    ```SQL
    SELECT ELEMENT_AT(CAST('{"a": 1, "b": 2}' AS VARIANT), "a");
    +------------------------------------------------------+
    | ELEMENT_AT(CAST('{"a": 1, "b": 2}' AS VARIANT), "a") |
    +------------------------------------------------------+
    | 1                                                    |
    +------------------------------------------------------+

    SELECT ELEMENT_AT(CAST('123' AS VARIANT), "");
    +----------------------------------------+
    | ELEMENT_AT(CAST('123' AS VARIANT), "") |
    +----------------------------------------+
    |                                        |
    +----------------------------------------+
    ```
