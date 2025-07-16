---
{
    "title": "GROUP_CONCAT",
    "language": "en"
}
---

## Description

The GROUP_CONCAT function concatenates multiple rows of results in the result set into a string.

## Syntax

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```

## Parameters

| Parameters | Description |
| ------------ | ---------------------- |
| `<str>`      | Required. The expression of the value to be concatenated. |
| `<sep>`      | Optional. The separator between strings. |
| `<col_name>` | Optional. The column used for sorting.   |
| `<expr>`     | Optional. The expression used for sorting. |

## Return Value

Returns a value of type VARCHAR.

## Example

```sql
select value from test;
```

```text
+-------+
| value |
+-------+
| a     |
| b     |
| c     |
| c     |
+-------+
```

```sql
select GROUP_CONCAT(value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+
```

```sql 
select GROUP_CONCAT(value, " ") from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                    |
+----------------------------+
```

```sql
select GROUP_CONCAT(value, NULL) from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```

