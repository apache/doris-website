---
{
    "title": "ARRAY_POPBACK",
    "language": "en"
}
---

## description

Remove the last element from array.

## Syntax

```sql
ARRAY_POPBACK(<arr>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<arr>` | ARRAY array |

## Return Value

Returns the array after removing the last element. Special cases:
- If the input parameter is NULL, returns NULL.

## example

```sql
select array_popback(['test', NULL, 'value']);
```

```text
+-----------------------------------------------------+
| array_popback(ARRAY('test', NULL, 'value'))         |
+-----------------------------------------------------+
| ["test", NULL]                                        |
+-----------------------------------------------------+
```


