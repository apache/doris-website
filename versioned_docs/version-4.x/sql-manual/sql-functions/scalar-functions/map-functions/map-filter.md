---
{
    "title": "MAP_FILTER",
    "language": "en",
    "description": "Filters map entries using a lambda expression or a Boolean array"
}
---

## Description

Filters entries in a map and returns a map containing only the selected entries.

The lambda form evaluates a Boolean expression for every entry. The lambda receives the key and value of each entry. The Boolean-array form selects entries by their corresponding positions.

:::note
This function is supported since Apache Doris 4.2.
:::

## Syntax

```sql
MAP_FILTER((<key>, <value>) -> <predicate>, <map>)
MAP_FILTER(<map>, <filter_array>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<key>` | The lambda parameter representing the key of a map entry. |
| `<value>` | The lambda parameter representing the value of a map entry. |
| `<predicate>` | A Boolean expression evaluated for each map entry. Entries for which it returns `TRUE` are retained. |
| `<map>` | A `MAP<K, V>` expression. |
| `<filter_array>` | An `ARRAY<BOOLEAN>` expression. Each element selects the map entry at the same position. The array length must equal the number of entries in the map. |

## Return Value

Returns a `MAP<K, V>` containing the selected entries.

- In the lambda form, entries for which the predicate returns `FALSE` or `NULL` are removed.
- In the Boolean-array form, entries corresponding to `FALSE` or `NULL` elements are removed.
- If `<map>` is empty, returns an empty map.
- If `<map>` is `NULL`, returns `NULL`.
- In the Boolean-array form, if `<filter_array>` is `NULL`, returns `NULL`.

## Examples

```sql
SELECT map_filter((k, v) -> v >= 20, map(1, 10, 2, 20, 3, 30)) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {2:20, 3:30} |
+--------------+
```

```sql
SELECT map_filter(
    (k, v) -> if(k = 1, CAST(NULL AS BOOLEAN), TRUE),
    map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {2:20} |
+--------+
```

```sql
SELECT map_filter(map(1, 10, 2, 20), [TRUE, FALSE]) AS result;
```

```text
+--------+
| result |
+--------+
| {1:10} |
+--------+
```

```sql
SELECT map_filter((k, v) -> TRUE, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
