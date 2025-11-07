---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
    "language": "en"
}
---

## append_trailing_char_if_absent

### description

#### Syntax

`VARCHAR append_trailing_char_if_absent(VARCHAR str, VARCHAR trailing_char)`

If the @str string is non-empty and does not contain the @trailing_char character at the end, it appends the @trailing_char character to the end.
@trailing_char contains only one character, and it will return NULL if contains more than one character

### example

```
MySQL [test]> select append_trailing_char_if_absent('a','c');
+------------------------------------------+
| append_trailing_char_if_absent('a', 'c') |
+------------------------------------------+
| ac                                       |
+------------------------------------------+
1 row in set (0.02 sec)

MySQL [test]> select append_trailing_char_if_absent('ac','c');
+-------------------------------------------+
| append_trailing_char_if_absent('ac', 'c') |
+-------------------------------------------+
| ac                                        |
+-------------------------------------------+
1 row in set (0.00 sec)
```

### keywords

    APPEND_TRAILING_CHAR_IF_ABSENT
