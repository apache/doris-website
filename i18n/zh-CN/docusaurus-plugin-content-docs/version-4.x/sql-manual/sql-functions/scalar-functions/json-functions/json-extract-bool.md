---
{
    "title": "JSON_EXTRACT_BOOL",
    "language": "zh-CN",
    "description": "JSONEXTRACTBOOL 从 JSON 对象中提取 <jsonpath> 指定的字段，并将其转换为 BOOLEAN 类型。"
}
---

## 描述
`JSON_EXTRACT_BOOL` 从 JSON 对象中提取 `<json_path>` 指定的字段，并将其转换为 [`BOOLEAN`](../../../basic-element/sql-data-types/numeric/BOOLEAN.md) 类型。

## 语法
```sql
JSON_EXTRACT_BOOL(<json_object>, <json_path>)
```

## 参数
- `<json_object>` JSON 类型，要提取的目标参数。
- `<json_path>` String 类型，要从目标 JSON 中提取目标元素的 JSON 路径。

## 返回值
`Nullable(BOOLEAN)` 返回提取出的 BOOLEAN 值，某些情况会得到 NULL

## 使用说明
1. 如果 `<json_object>` 或则 `<json_path>` 为 NULL，返回 NULL。
2. 如果 `<json_path>` 指定的元素不存在返回 NULL。
3. 如果 `<json_path>` 指定的元素无法转换为 BOOLEAN 返回 NULL。
4. 其行为与 "cast + json_extract" 一致，即等价于：
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as BOOLEAN)
    ```

## 示例
1. 正常参数
    ```sql
    SELECT json_extract_bool('{"id": true, "name": "doris"}', '$.id');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_bool('{"id": true, "name": "doris"}', '$.id') |
    +------------------------------------------------------------+
    |                                                          1 |
    +------------------------------------------------------------+
    ```
2. 路径不存在的情况
    ```sql
    SELECT json_extract_bool('{"id": true, "name": "doris"}', '$.id2');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_bool('{"id": true, "name": "doris"}', '$.id2') |
    +-------------------------------------------------------------+
    |                                                        NULL |
    +-------------------------------------------------------------+
    ```
3. NULL 参数
    ```sql
    SELECT json_extract_bool('{"id": true, "name": "doris"}', NULl);
    ```
    ```text
    +----------------------------------------------------------+
    | json_extract_bool('{"id": true, "name": "doris"}', NULl) |
    +----------------------------------------------------------+
    |                                                     NULL |
    +----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_bool(NULL, '$.id2');
    ```
    ```text
    +----------------------------------+
    | json_extract_bool(NULL, '$.id2') |
    +----------------------------------+
    |                             NULL |
    +----------------------------------+
    ```
4. 无法转换为 BOOLEAN 的情况
    ```sql
    SELECT json_extract_bool('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_bool('{"id": 123, "name": "doris"}','$.name') |
    +------------------------------------------------------------+
    |                                                       NULL |
    +------------------------------------------------------------+
    ```