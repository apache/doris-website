---
{
    "title": "DEDUPLICATE_MAP",
    "language": "en",
    "description": "Removes duplicate keys from a Map. By default, Doris deduplicates generated Maps (such as when importing data). However,"
}
---

## Description

Removes duplicate keys from a Map.
By default, Doris deduplicates generated Maps (such as when importing data).
However, Maps obtained in certain special scenarios may not be deduplicated, such as data read from external tables or Maps converted from strings.
This function can be used to deduplicate Map types.

## Syntaxntax

```sql
DEDUPLICATE_MAP(<map>)
```

## Parameters

- `<map>`: The input map content.

## Return Value

`Map`: Returns the deduplicated Map (type matches the input parameter type).

## Examples
    ```sql
    select m, deduplicate_map(m) from (select cast('{"a": 123, "a": 345}' as map<string, int>) m ) t;
    ```

    ```text
    +--------------------+--------------------+
    | m                  | deduplicate_map(m) |
    +--------------------+--------------------+
    | {"a":123, "a":345} | {"a":345}          |
    +--------------------+--------------------+
    ```
> Maps converted from strings are not deduplicated.