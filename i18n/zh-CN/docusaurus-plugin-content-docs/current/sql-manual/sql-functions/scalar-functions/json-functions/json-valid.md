---
{
    "title": "JSON_VALID",
    "language": "zh-CN",
    "description": "JSONVALID 函数用以判断字符串是否为有效的 JSON 字符串, 如果参数是 NULL 则返回 NULL。"
}
---

## 描述

JSON_VALID 函数用以判断字符串是否为有效的 JSON 字符串, 如果参数是 NULL 则返回 NULL。

## 语法

```sql
JSON_VALID( <str> )
```

## 必选参数
- `<str>` String 类型，需要判断的 JSON 格式字符串。


## 举例

1. 正常 JSON 字符串
    ```sql
    SELECT json_valid('{"k1":"v31","k2":300}');
    ```
    ```text
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
    ```
    ```text
    +----------------------------+
    | json_valid('invalid json') |
    +----------------------------+
    |                          0 |
    +----------------------------+

    ```

3. NULL 参数
    ```sql
    SELECT json_valid(NULL);
    ```
    ```text
    +------------------+
    | json_valid(NULL) |
    +------------------+
    |             NULL |
    +------------------+
    ```