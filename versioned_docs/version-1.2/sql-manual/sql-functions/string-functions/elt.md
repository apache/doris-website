---
{
    "title": "ELT",
    "language": "en"
}
---

## elt
### Description
#### Syntax

`VARCHAR elt(INT, VARCHAR,...)`

Returns the string at specified index. Returns NULL if there is no string at specified index.

### example

```
mysql> select elt(1, 'aaa', 'bbb');
+----------------------+
| elt(1, 'aaa', 'bbb') |
+----------------------+
| aaa                  |
+----------------------+
mysql> select elt(2, 'aaa', 'bbb');
+-----------------------+
| elt(2, 'aaa', 'bbb')  |
+-----------------------+
| bbb                   |
+-----------------------+
mysql> select elt(0, 'aaa', 'bbb');
+----------------------+
| elt(0, 'aaa', 'bbb') |
+----------------------+
| NULL                 |
+----------------------+
mysql> select elt(2, 'aaa', 'bbb');
+-----------------------+
| elt(3, 'aaa', 'bbb')  |
+-----------------------+
| NULL                  |
+-----------------------+
```
### keywords
    ELT
