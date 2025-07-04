---
{
    "title": "ARRAY_POPBACK",
    "language": "en"
}
---

## array_popback

array_popback

### description

#### Syntax

`ARRAY<T> array_popback(ARRAY<T> arr)`

Remove the last element from array.

### example

```
mysql> select array_popback(['test', NULL, 'value']);
+-----------------------------------------------------+
| array_popback(ARRAY('test', NULL, 'value'))         |
+-----------------------------------------------------+
| [test, NULL]                                        |
+-----------------------------------------------------+

```

### keywords

ARRAY,POPBACK,ARRAY_POPBACK

