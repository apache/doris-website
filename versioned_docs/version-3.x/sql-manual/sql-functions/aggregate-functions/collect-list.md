---
{
    "title": "COLLECT_LIST",
    "language": "en",
    "description": "Aggregation function, used to aggregate all values of a column into an array."
}
---

## Description

Aggregation function, used to aggregate all values of a column into an array.

## Alias

- GROUP_ARRAY

## Syntax

```sql
COLLECT_LIST(<expr> [,<max_size>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Column or expression to aggregate |
| `<max_size>` | Optional parameter that can be set to limit the size of the resulting array to max_size elements |

## Return Value

The return type is ARRAY, which contains all values. Special circumstances:

- If the value is NULL, it will filter

## Example

```sql
select k1,k2,k3 from collect_list_test order by k1;
```

```text
+------+------------+-------+
| k1   | k2         | k3    |
+------+------------+-------+
|    1 | 2023-01-01 | hello |
|    2 | 2023-01-02 | NULL  |
|    2 | 2023-01-02 | hello |
|    3 | NULL       | world |
|    3 | 2023-01-02 | hello |
|    4 | 2023-01-02 | sql   |
|    4 | 2023-01-03 | sql   |
+------+------------+-------+
```

```sql
select collect_list(k1),collect_list(k1,3) from collect_list_test;
```

```text
+-------------------------+--------------------------+
| collect_list(`k1`)      | collect_list(`k1`,3)     |
+-------------------------+--------------------------+
| [1,2,2,3,3,4,4]         | [1,2,2]                  |
+-------------------------+--------------------------+
```

```sql
select k1,collect_list(k2),collect_list(k3,1) from collect_list_test group by k1 order by k1;
```

```text
+------+-------------------------+--------------------------+
| k1   | collect_list(`k2`)      | collect_list(`k3`,1)     |
+------+-------------------------+--------------------------+
|    1 | [2023-01-01]            | [hello]                  |
|    2 | [2023-01-02,2023-01-02] | [hello]                  |
|    3 | [2023-01-02]            | [world]                  |
|    4 | [2023-01-02,2023-01-03] | [sql]                    |
+------+-------------------------+--------------------------+
```
