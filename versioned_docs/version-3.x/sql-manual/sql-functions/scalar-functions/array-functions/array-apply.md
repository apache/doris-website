---
{
    "title": "ARRAY_APPLY",
    "language": "en",
    "description": "Filter array to match specific binary condition"
}
---

## Description

Filter array to match specific binary condition

## Syntax

```sql
ARRAY_APPLY(<arr>, <op>, <val>)
```

## Parameters
| Parameter | Description |
|---|---|
| `<arr>` | Input array |
| `<op>` | Filter condition, including `=`, `>=`, `<=`, `>`, `<`, `!=` |
| `<val>` | Filter value. If `null`, the result will be `null`. Only constant values are supported. |

## Return Value

The filtered array matched with condition.

## Example

```sql
select array_apply([1, 2, 3, 4, 5], ">=", 2);
```
```text
+--------------------------------------------+
| array_apply(ARRAY(1, 2, 3, 4, 5), '>=', 2) |
+--------------------------------------------+
| [2, 3, 4, 5]                               |
+--------------------------------------------+
```
```sql
select array_apply([1000000, 1000001, 1000002], "=", "1000002");
```
```text
+-------------------------------------------------------------+
| array_apply(ARRAY(1000000, 1000001, 1000002), '=', 1000002) |
+-------------------------------------------------------------+
| [1000002]                                                   |
+-------------------------------------------------------------+
```