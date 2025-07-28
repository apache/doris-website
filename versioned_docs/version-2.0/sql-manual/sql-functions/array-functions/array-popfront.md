---
{
    "title": "ARRAY_POPFRONT",
    "language": "en"
}
---

## array_popfront

array_popfront

### description

#### Syntax

`ARRAY<T> array_popfront(ARRAY<T> arr)`

Remove the first element from array.

### example

```
mysql> select array_popfront(['test', NULL, 'value']);
+-----------------------------------------------------+
| array_popfront(ARRAY('test', NULL, 'value'))        |
+-----------------------------------------------------+
| [NULL, value]                                       |
+-----------------------------------------------------+

```

### keywords

ARRAY,POPFRONT,ARRAY_POPFRONT

