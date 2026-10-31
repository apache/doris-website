---
{
    "title": "JSON_VALID",
    "language": "zh-CN"
}
---

## json_valid
## 描述

json_valid 函数返回0或1以表明是否为有效的JSON, 如果参数是NULL则返回NULL。

## 语法

`JSONB json_valid(VARCHAR json_str)`

## 举例

1. 正常JSON字符串

```
MySQL > SELECT json_valid('{"k1":"v31","k2":300}');
+-------------------------------------+
| json_valid('{"k1":"v31","k2":300}') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
1 row in set (0.02 sec)
```

2. 无效的JSON字符串

```
MySQL > SELECT json_valid('invalid json');
+----------------------------+
| json_valid('invalid json') |
+----------------------------+
|                          0 |
+----------------------------+
1 row in set (0.02 sec)
```

3. NULL参数

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
