---
{
    "title": "ANY_VALUE",
    "language": "en"
}
---

## ANY_VALUE

ANY_VALUE


### description
#### Syntax

`ANY_VALUE(expr)`

If there is a non NULL value in expr, any non NULL value is returned; otherwise, NULL is returned.

Alias function: `ANY(expr)`

### example
```
mysql> select id, any_value(name) from cost2 group by id;
+------+-------------------+
| id   | any_value(`name`) |
+------+-------------------+
|    3 | jack              |
|    2 | jack              |
+------+-------------------+
```
### keywords
ANY_VALUE, ANY
