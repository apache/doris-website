---
{
    "title": "GREATEST",
    "language": "en",
    "description": "Compares multiple expressions and returns the greatest value among them. If any argument is NULL, the function returns NULL."
}
---

## Description

Compares multiple expressions and returns the greatest value among them. If any argument is `NULL`, the function returns `NULL`.

## Syntax

```sql
GREATEST(<expr> [, ...])
```

## Parameters

| Parameter   | Description |
|------------|-------------|
| `<expr>`  | A list of expressions to compare. Supports `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, `STRING`, `DATETIME`, and `DECIMAL` types. |

## Return Value

- Returns the largest value among the given expressions.
- If any argument is `NULL`, returns `NULL`.

## Examples

```sql
SELECT GREATEST(-1, 0, 5, 8);
```

```text
+-----------------------+
| GREATEST(-1, 0, 5, 8) |
+-----------------------+
|                     8 |
+-----------------------+
```

```sql
SELECT GREATEST(-1, 0, 5, NULL);
```

```text
+--------------------------+
| GREATEST(-1, 0, 5, NULL) |
+--------------------------+
| NULL                     |
+--------------------------+
```

```sql
SELECT GREATEST(6.3, 4.29, 7.6876);
```

```text
+-----------------------------+
| GREATEST(6.3, 4.29, 7.6876) |
+-----------------------------+
|                      7.6876 |
+-----------------------------+
```

```sql
SELECT GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11');
```

```text
+-------------------------------------------------------------------------------+
| GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11') |
+-------------------------------------------------------------------------------+
| 2022-02-26 20:02:11                                                           |
+-------------------------------------------------------------------------------+
```