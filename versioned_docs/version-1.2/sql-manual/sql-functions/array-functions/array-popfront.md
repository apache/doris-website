---
{
    "title": "ARRAY_POPFRONT",
    "language": "en"
}
---

## array_popfront

<version since="1.2.3">

array_popfront

</version>

### description

#### Syntax

`ARRAY<T> array_popfront(ARRAY<T> arr)`

Remove the first element from array.

### notice

`Only supported in vectorized engine`

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

