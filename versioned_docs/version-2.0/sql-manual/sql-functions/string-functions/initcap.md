---
{
    "title": "INITCAP",
    "language": "en"
}
---

## initcap
### description
#### Syntax

`VARCHAR initcap(VARCHAR str)`

Convert the first letter of each word to upper case and the rest to lower case. 
Words are sequences of alphanumeric characters separated by non-alphanumeric characters.

### example

```
mysql> select initcap('hello hello.,HELLO123HELlo');
+---------------------------------------+
| initcap('hello hello.,HELLO123HELlo') |
+---------------------------------------+
| Hello Hello.,Hello123hello            |
+---------------------------------------+
```
### keywords
    INITCAP