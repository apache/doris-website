---
{
    "title": "ARRAY_POPFRONT",
    "language": "en",
    "description": "Remove the first element from array."
}
---

## description

Remove the first element from array.

## Syntax

```sql
ARRAY_POPFRONT(<arr>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<arr>` | ARRAY array |

## Return Value

Returns the array after removing the first element. Special cases:
- If the input parameter is NULL, returns NULL.



## example

```sql
select array_popfront(['test', NULL, 'value']);
```

```text
+-----------------------------------------------------+
| array_popfront(ARRAY('test', NULL, 'value'))        |
+-----------------------------------------------------+
| [NULL, "value"]                                       |
+-----------------------------------------------------+
```


