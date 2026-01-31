---
{
    "title": "MAP_CONCAT",
    "language": "en"
}
---

## Description

Concatenates multiple maps into a single map. When concatenating maps with different key or value types, the function finds common types for keys and values.

## Syntax

```sql
MAP_CONCAT(<map1> [, <map2> [, <map3> ... ]])
```

## Parameters
- `<map1>`, `<map2>`, `<map3>`, ...: [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) type, the input maps to concatenate.

**Supported key and value types:**
- **Key types**: All primitive types that support comparison (numeric, string, date/time, boolean, IP)
- **Value types**: All primitive types plus complex types (ARRAY, MAP, STRUCT)

**Type compatibility notes:**
- When concatenating maps with different key types, the function finds a common key type
- When concatenating maps with different value types, the function finds a common value type

## Return Value
Returns a concatenated `MAP` containing all key-value pairs from the input maps.

**Behavior:**
- The resulting map's key type is the common type of all input map key types
- The resulting map's value type is the common type of all input map value types
- If types cannot be converted (e.g., incompatible key types), an error is thrown

## Usage Notes
1. The function accepts zero or more map arguments.
2. If any argument is NULL, the result is NULL.
3. Duplicate keys: If multiple maps contain the same key, the value from the last map wins

## Examples
1. Basic usage
    ```sql
    select map_concat();
    ```
    ```text
    +--------------+
    | map_concat() |
    +--------------+
    | {}           |
    +--------------+
    ```

    ```sql
    select map_concat(map('single', 'argument'));
    ```
    ```text
    +---------------------------------------+
    | map_concat(map('single', 'argument')) |
    +---------------------------------------+
    | {"single":"argument"}                 |
    +---------------------------------------+
    ```

    ```sql
    select map_concat({'a': 'apple'}, {'b': 'banana'}, {'c': 'cherry'});
    ```
    ```text
    +-----------------------------------------------------------+
    | map_concat({'a':'apple'},{'b':'banana'},{'c':'cherry'})   |
    +-----------------------------------------------------------+
    | {"a":"apple", "b":"banana", "c":"cherry"}                 |
    +-----------------------------------------------------------+
    ```

2. NULL parameters
    ```sql
    select map_concat({'a': 'apple'}, NULL);
    ```
    ```text
    +---------------------------------+
    | map_concat({'a':'apple'}, NULL) |
    +---------------------------------+
    | NULL                            |
    +---------------------------------+
    ```

    Map concatenation containing null elements: null elements will be normally retained in the concatenation result.

3. Type conversion examples
    ```sql
    -- INT and DOUBLE value types
    select map_concat({'a': 1, 'b': 2}, {'c': 3.5, 'd': 4.7});
    ```
    ```text
    +----------------------------------------------------+
    | map_concat({'a': 1, 'b': 2}, {'c': 3.5, 'd': 4.7}) |
    +----------------------------------------------------+
    | {"a":1.0, "b":2.0, "c":3.5, "d":4.7}               |
    +----------------------------------------------------+
    ```
    INT values are converted to DOUBLE to match the common type.

    ```sql
    -- INT and VARCHAR key types
    select map_concat({1: 'one', 2: 'two'}, {'a': 'apple', 'b': 'banana'});
    ```
    ```text
    +-----------------------------------------------------------------+
    | map_concat({1: 'one', 2: 'two'}, {'a': 'apple', 'b': 'banana'}) |
    +-----------------------------------------------------------------+
    | {"1":"one", "2":"two", "a":"apple", "b":"banana"}               |
    +-----------------------------------------------------------------+
    ```
    INT keys are converted to VARCHAR to match the common type.

    ```sql
    -- INT and BIGINT value types
    select map_concat({'small': 100}, {'large': 10000000000});
    ```
    ```text
    +----------------------------------------------------+
    | map_concat({'small': 100}, {'large': 10000000000}) |
    +----------------------------------------------------+
    | {"small":100, "large":10000000000}                 |
    +----------------------------------------------------+
    ```
    INT values are converted to BIGINT to match the common type.

    ```sql
    -- INT and VARCHAR value types
    select map_concat({'a': 1}, {'b': '2'});
    ```
    ```text
    +----------------------------------+
    | map_concat({'a': 1}, {'b': '2'}) |
    +----------------------------------+
    | {"a":"1", "b":"2"}               |
    +----------------------------------+
    ```
    INT values are converted to VARCHAR to match the common type.

    ```sql
    -- Complex types with nested arrays
    select map_concat({'a':[1,2,3]},{1:['1','2']});
    ```
    ```text
    +-----------------------------------------+
    | map_concat({'a':[1,2,3]},{1:['1','2']}) |
    +-----------------------------------------+
    | {"a":["1", "2", "3"], "1":["1", "2"]}   |
    +-----------------------------------------+
    ```
    For complex types (like ARRAY), type conversion is performed recursively.

    ```sql
    -- Error example: cannot find common type
    select map_concat({'a':[1,2,3]},{1:3});
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = mapconcat cannot find the common value type of map_concat(map('a', [1, 2, 3]), map(1, 3))
    ```
    When a common type cannot be found (e.g., ARRAY and INT), an error is thrown.
