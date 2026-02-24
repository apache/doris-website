---
{
    "title": "JSON_EXTRACT_INT",
    "language": "zh-CN",
    "description": "JSONEXTRACTINT 从 JSON 对象中提取 <jsonpath> 指定的字段，并将其转换为 INT 类型。"
}
---

## 描述
`JSON_EXTRACT_INT` 从 JSON 对象中提取 `<json_path>` 指定的字段，并将其转换为 [`INT`](../../../basic-element/sql-data-types/numeric/INT.md) 类型。

## 语法
```sql
JSON_EXTRACT_INT(<json_object>, <json_path>)
```

## 参数
- `<json_object>` JSON 类型，要提取的目标参数。
- `<json_path>` String 类型，要从目标 JSON 中提取目标元素的 JSON 路径。

## 返回值
`Nullable(INT)` 返回提取出的 INT 值，某些情况会得到 NULL

## 使用说明
1. 如果 `<json_object>` 或则 `<json_path>` 为 NULL，返回 NULL。
2. 如果 `<json_path>` 指定的元素不存在返回 NULL。
3. 如果 `<json_path>` 指定的元素无法转换为 INT 返回 NULL。
4. 其行为与 "cast + json_extract" 一致，即等价于：
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as INT)
    ```

## 示例
1. 正常参数
    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}', '$.id');
    ```
    ```text
    +----------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}', '$.id') |
    +----------------------------------------------------------+
    |                                                      123 |
    +----------------------------------------------------------+
    ```
2. 路径不存在的情况
    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}', '$.id2');
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}', '$.id2') |
    +-----------------------------------------------------------+
    |                                                      NULL |
    +-----------------------------------------------------------+
    ```
3. NULL 参数
    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +--------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}', NULl) |
    +--------------------------------------------------------+
    |                                                   NULL |
    +--------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_int(NULL, '$.id2');
    ```
    ```text
    +---------------------------------+
    | json_extract_int(NULL, '$.id2') |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
4. 无法转换为 INT 的情况
    ```sql
    SELECT json_extract_int('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_int('{"id": 123, "name": "doris"}','$.name') |
    +-----------------------------------------------------------+
    |                                                      NULL |
    +-----------------------------------------------------------+
    ```