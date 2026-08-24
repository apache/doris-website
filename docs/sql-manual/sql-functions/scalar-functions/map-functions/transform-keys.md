---
{
    "title": "TRANSFORM_KEYS",
    "language": "en",
    "description": "Transforms every key in a map"
}
---

## Description

Applies a lambda expression to every entry in a map and constructs a new map with the transformed keys and the original values. The lambda receives the key and value of each entry.

## Syntax

```sql
TRANSFORM_KEYS((<key>, <value>) -> <new_key>, <map>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<key>` | The lambda parameter representing the key of a map entry. |
| `<value>` | The lambda parameter representing the value of a map entry. |
| `<new_key>` | An expression that produces the key in the returned map. Its type must be supported by MAP keys. |
| `<map>` | A `MAP<K, V>` expression. |

## Return Value

Returns a `MAP<K2, V>`, where `K2` is the type returned by the lambda.

- The values in the input map are retained unchanged.
- If `<map>` is empty, returns an empty map.
- If `<map>` is `NULL`, returns `NULL`.
- A `NULL` key returned by the lambda is retained.
- If multiple entries are transformed to the same key, the value from the last occurrence is retained.

## Examples

```sql
SELECT transform_keys((k, v) -> k + 10, map(1, 10, 2, 20)) AS result;
```

```text
+----------------+
| result         |
+----------------+
| {11:10, 12:20} |
+----------------+
```

```sql
SELECT transform_keys((k, v) -> 1, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT transform_keys((k, v) -> k, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
