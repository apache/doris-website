---
{
    "title": "JSON_EXTRACT_STRING",
    "language": "zh-CN",
    "description": "JSONEXTRACTSTRING 从 JSON 对象中提取 <jsonpath> 指定的字段，并将其转换为 STRING 类型。"
}
---

## 描述
`JSON_EXTRACT_STRING` 从 JSON 对象中提取 `<json_path>` 指定的字段，并将其转换为 [`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md) 类型。

## 语法
```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```

## 参数
- `<json_object>` JSON 类型，要提取的目标参数。
- `<json_path>` String 类型，要从目标 JSON 中提取目标元素的 JSON 路径。

## 返回值
`Nullable(STRING)` 返回提取出的 STRING 值，某些情况会得到 NULL

## 使用说明
1. 如果 `<json_object>` 或则 `<json_path>` 为 NULL，返回 NULL。
2. 如果 `<json_path>` 指定的元素不存在返回 NULL。
3. 如果 `<json_path>` 指定的元素无法转换为 STRING 返回 NULL。
4. 其行为与 "cast + json_extract" 一致，即等价于：
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
    所以即使 `<json_path>` 指向的对象不是 STRING 类型，但是只要支持转换为 STRING 类型也能得到转换后的值。
5. 这里返回的 STRING 是不带有双引号的(")。
6. 对于 JSON 对象中的 null 值，得到的不是 NULL 而是字符串 null，如果想要判断一个元素是否为 null 请使用函数 [`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md)。

## 示例
1. 正常参数
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name');
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name') |
    +---------------------------------------------------------------+
    | doris                                                         |
    +---------------------------------------------------------------+
    ```
2. 路径不存在的情况
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name2');
    ```
    ```text
    +----------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name2') |
    +----------------------------------------------------------------+
    | NULL                                                           |
    +----------------------------------------------------------------+
    ```
3. NULL 参数
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', NULl) |
    +-----------------------------------------------------------+
    | NULL                                                      |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_string(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_string(NULL, '$.id2') |
    +------------------------------------+
    | NULL                               |
    +------------------------------------+
    ```
4. 其他类型被转换为 STRING 的情况
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}','$.id');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}','$.id') |
    +------------------------------------------------------------+
    | 123                                                        |
    +------------------------------------------------------------+
    ```
5. null 值会被转换为字符串 "null" 而不是 NULL
    ```sql
    SELECT json_extract_string('{"id": null, "name": "doris"}','$.id');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_string('{"id": null, "name": "doris"}','$.id') |
    +-------------------------------------------------------------+
    | null                                                        |
    +-------------------------------------------------------------+
    ```