---
{
    "title": "JSON_VALID",
    "language": "en"
}
---

## json_valid
### description

json_valid functions returns 0 or 1 to indicate whether a value is valid JSON and Returns NULL if the argument is NULL.

#### Syntax

`JSONB json_valid(VARCHAR json_str)`

### example

1. parse valid JSON string

```
MySQL > SELECT json_valid('{"k1":"v31","k2":300}');
+-------------------------------------+
| json_valid('{"k1":"v31","k2":300}') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
1 row in set (0.02 sec)
```

2. parse invalid JSON string

```
MySQL > SELECT json_valid('invalid json');
+----------------------------+
| json_valid('invalid json') |
+----------------------------+
|                          0 |
+----------------------------+
1 row in set (0.02 sec)
```

3. parse NULL

```
MySQL > select json_valid(NULL);
+------------------+
| json_valid(NULL) |
+------------------+
|             NULL |
+------------------+
1 row in set (0.02 sec)
```

### keywords
JSON, VALID, JSON_VALID
