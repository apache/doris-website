---
{
    "title": "JSON_TYPE",
    "language": "zh-CN",
    "description": "用来判断 JSON 对象中 <jsonpath> 指定的字段的类型，如果字段不存在返回 NULL，如果存在返回下面的类型之一："
}
---

## 描述
用来判断 JSON 对象中 `<json_path>` 指定的字段的类型，如果字段不存在返回 NULL，如果存在返回下面的类型之一：
* object
* array
* null
* bool
* int
* bigint
* largeint
* double
* string

## 语法
```sql
JSON_TYPE(<json_object>, <json_path>)
```

## 参数
- `<json_object>`: [JSON 类型](../../../basic-element/sql-data-types/semi-structured/JSON.md) 的表达式。
- `<json_path>`: String 类型，比如 `"$.key"`。

## 返回值
`Nullable<String>`: 返回对应字段的类型。

## 使用说明
- 如果 `<json_object>` 或者 `<json_path>` 是 NULL，返回 NULL。
- 如果 `<json_path>` 不是一个合法路径，函数报错。
- 如果 `<json_path>` 指定的字段不存在，返回 NULL。

## 示例
1. Double 类型
    ```sql
    select json_type('{"key1": 1234.44}', '$.key1');
    ```
    ```
    +------------------------------------------+
    | json_type('{"key1": 1234.44}', '$.key1') |
    +------------------------------------------+
    | double                                   |
    +------------------------------------------+
    ```
2. BOOLEAN 类型
    ```sql
    select json_type('{"key1": true}', '$.key1');
    ```
    ```
    +---------------------------------------+
    | json_type('{"key1": true}', '$.key1') |
    +---------------------------------------+
    | bool                                  |
    +---------------------------------------+
    ```
3. NULL 参数
    ```sql
    select json_type(NULL, '$.key1');
    ```
    ```
    +---------------------------+
    | json_type(NULL, '$.key1') |
    +---------------------------+
    | NULL                      |
    +---------------------------+
    ```
4. NULL 参数 2
    ```sql
    select json_type('{"key1": true}', NULL);
    ```
    ```
    +-----------------------------------+
    | json_type('{"key1": true}', NULL) |
    +-----------------------------------+
    | NULL                              |
    +-----------------------------------+
    ```
5. `json_path` 参数指定的字段不存在
    ```sql
    select json_type('{"key1": true}', '$.key2');
    ```
    ```
    +---------------------------------------+
    | json_type('{"key1": true}', '$.key2') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```
6. 错误的 `json_path` 参数
    ```sql
    select json_type('{"key1": true}', '$.');
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Json path error: Invalid Json Path for value: $.
    ```