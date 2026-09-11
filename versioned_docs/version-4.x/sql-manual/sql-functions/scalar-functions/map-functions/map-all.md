---
{
    "title": "MAP_ALL",
    "language": "en",
    "description": "Tests whether every entry in a map satisfies a condition"
}
---

## Description

Tests every entry in a map with a lambda expression and returns whether all entries satisfy the specified condition. The lambda receives the key and value of each entry.

:::note
This function is supported since Apache Doris 4.2.
:::

## Syntax

```sql
MAP_ALL((<key>, <value>) -> <predicate>, <map>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<key>` | The lambda parameter representing the key of a map entry. |
| `<value>` | The lambda parameter representing the value of a map entry. |
| `<predicate>` | A Boolean expression evaluated for each map entry. |
| `<map>` | A `MAP<K, V>` expression. |

## Return Value

Returns a `BOOLEAN` value.

- Returns `FALSE` if the predicate returns `FALSE` for any entry.
- Returns `TRUE` if the predicate returns `TRUE` for every entry, including when the map is empty.
- Returns `NULL` if no entry returns `FALSE` and at least one entry returns `NULL`.
- If `<map>` is `NULL`, returns `NULL`.

## Examples

```sql
SELECT map_all((k, v) -> v >= 10, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      1 |
+--------+
```

```sql
SELECT map_all((k, v) -> v > 10, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      0 |
+--------+
```

```sql
SELECT map_all((k, v) -> CAST(NULL AS BOOLEAN), map(1, 10)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

```sql
SELECT map_all((k, v) -> v > 0, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
