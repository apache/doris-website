---
{
    "title": "MAP_FROM_ENTRIES",
    "language": "en",
    "description": "Constructs a MAP from an array of two-field STRUCT entries"
}
---

## Description

Constructs a `MAP<K, V>` from an array whose elements are two-field `STRUCT`s. The first field is used as the key and the second field as the value.

## Syntax

```sql
MAP_FROM_ENTRIES(<entries>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<entries>` | An `ARRAY<STRUCT<K, V>>`. Each STRUCT must contain exactly two fields. The array can be `NULL`, and the two fields inside a STRUCT can be `NULL`, but a STRUCT array element itself cannot be `NULL`. `K` must be a type supported by MAP keys. |

## Return Value

Returns a `MAP<K, V>`.

- If `<entries>` is `NULL`, returns `NULL`.
- `NULL` fields inside a non-`NULL` STRUCT are retained as `NULL` keys or values.
- If a STRUCT array element itself is `NULL`, a runtime error is reported.
- If the input is not an array of STRUCTs, or a STRUCT has fewer or more than two fields, an analysis error is reported.
- If `K` is not a type supported by MAP keys, an analysis error is reported.
- If a key occurs more than once, the value from the last occurrence is retained.

## Examples

```sql
SELECT map_from_entries(array(struct(1, 10), struct(2, 20))) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_entries(array(struct(1, 10), struct(1, 20))) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>));
```

```text
+------------------------------------------------------------+
| map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>)) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```

```sql
SELECT map_from_entries(array(
    struct(CAST(NULL AS INT), 10),
    struct(2, CAST(NULL AS INT)))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

The following example fails because the array contains a `NULL` STRUCT element:

```sql
SELECT map_from_entries(array(CAST(NULL AS STRUCT<k:INT,v:INT>)));
```

```text
ERROR 1105 (HY000): Map entry of function map_from_entries cannot be null
```

The following example fails during analysis because the STRUCT has three fields:

```sql
SELECT map_from_entries(array(struct(1, 2, 3)));
```

```text
ERROR 1105 (HY000): map_from_entries requires an array of structs with exactly two fields
```
