---
{
    "title": "MAP_APPLY",
    "language": "en",
    "description": "Transforms the keys and values of a map"
}
---

## Description

Applies a lambda expression to every entry in a map and constructs a new map from the transformed keys and values. The lambda receives the key and value of each entry and returns a pair of expressions. The first expression is used as the new key and the second expression as the new value.

:::note
This function is supported since Apache Doris 4.2.
:::

## Syntax

```sql
MAP_APPLY((<key>, <value>) -> (<new_key>, <new_value>), <map>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<key>` | The lambda parameter representing the key of a map entry. |
| `<value>` | The lambda parameter representing the value of a map entry. |
| `<new_key>` | An expression that produces the key in the returned map. Its type must be supported by MAP keys. |
| `<new_value>` | An expression that produces the value in the returned map. |
| `<map>` | A `MAP<K, V>` expression. |

## Return Value

Returns a `MAP<K2, V2>`, where `K2` and `V2` are the types of the first and second fields returned by the lambda.

- If `<map>` is empty, returns an empty map.
- If `<map>` is `NULL`, returns `NULL`.
- `NULL` fields returned by the lambda are retained as `NULL` keys or values.
- If multiple entries are transformed to the same key, the value from the last occurrence is retained.
- If the lambda does not return exactly two expressions, an analysis error is reported.

## Examples

```sql
SELECT map_apply((k, v) -> (k + 10, v * 2), map(1, 10, 2, 20)) AS result;
```

```text
+------------------+
| result           |
+------------------+
| {11:20, 12:40}   |
+------------------+
```

```sql
SELECT map_apply((k, v) -> (1, v), map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_apply((k, v) -> (k, v), CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
