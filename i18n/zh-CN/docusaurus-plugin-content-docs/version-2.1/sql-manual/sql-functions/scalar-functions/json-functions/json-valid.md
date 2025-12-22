---
{
    "title": "JSON_VALID",
    "language": "zh-CN",
    "description": "JSONVALID 函数返回 0 或 1 以表明是否为有效的 JSON, 如果参数是 NULL 则返回 NULL。"
}
---

## 描述

JSON_VALID 函数返回 0 或 1 以表明是否为有效的 JSON, 如果参数是 NULL 则返回 NULL。

## 语法

```sql
JSON_VALID( <str> )
```

## 必选参数
| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 格式的输入字符串。 |

## 别名

- JSONB_VALID

## 举例

1. 正常 JSON 字符串

```sql
SELECT json_valid('{"k1":"v31","k2":300}');
+-------------------------------------+
| json_valid('{"k1":"v31","k2":300}') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
1 row in set (0.02 sec)
```

2. 无效的 JSON 字符串

```sql
SELECT json_valid('invalid json');
+----------------------------+
| json_valid('invalid json') |
+----------------------------+
|                          0 |
+----------------------------+

```

3. NULL 参数

```sql
SELECT json_valid(NULL);
+------------------+
| json_valid(NULL) |
+------------------+
|             NULL |
+------------------+

```