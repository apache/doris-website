---
{
    "title": "TRANSFORM_VALUES",
    "language": "en",
    "description": "Transforms every value in a map"
}
---

## Description

Applies a lambda expression to every entry in a map and constructs a new map with the original keys and the transformed values. The lambda receives the key and value of each entry.

## Syntax

```sql
TRANSFORM_VALUES((<key>, <value>) -> <new_value>, <map>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<key>` | The lambda parameter representing the key of a map entry. |
| `<value>` | The lambda parameter representing the value of a map entry. |
| `<new_value>` | An expression that produces the value in the returned map. |
| `<map>` | A `MAP<K, V>` expression. |

## Return Value

Returns a `MAP<K, V2>`, where `V2` is the type returned by the lambda.

- The keys in the input map are retained unchanged.
- If `<map>` is empty, returns an empty map.
- If `<map>` is `NULL`, returns `NULL`.
- A `NULL` value returned by the lambda is retained.

## Examples

```sql
SELECT transform_values((k, v) -> v + k, map(1, 10, 2, 20)) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:11, 2:22} |
+--------------+
```

```sql
SELECT transform_values(
    (k, v) -> if(k = 1, CAST(NULL AS INT), v),
    map(1, 10, 2, 20)) AS result;
```

```text
+----------------+
| result         |
+----------------+
| {1:null, 2:20} |
+----------------+
```

```sql
SELECT transform_values((k, v) -> v, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
