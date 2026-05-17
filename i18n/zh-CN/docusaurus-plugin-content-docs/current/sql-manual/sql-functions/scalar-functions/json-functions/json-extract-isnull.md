---
{
    "title": "JSON_EXTRACT_ISNULL",
    "language": "zh-CN",
    "description": "JSONEXTRACTISNULL 判断 JSON 对象中 <jsonpath> 指定的字段是否是 null 值。"
}
---

## 描述
`JSON_EXTRACT_ISNULL` 判断 JSON 对象中 `<json_path>` 指定的字段是否是 null 值。

## 语法
```sql
JSON_EXTRACT_ISNULL(<json_object>, <json_path>)
```

## 参数
- `<json_object>` JSON 类型，要提取的目标参数。
- `<json_path>` String 类型，要从目标 JSON 中提取目标元素的 JSON 路径。

## 返回值
`Nullable(BOOL)` 如果值为 null 返回 true，否则返回 false。

## 使用说明
1. 如果 `<json_object>` 或则 `<json_path>` 为 NULL，返回 NULL。
2. 如果 `<json_path>` 指定的元素不存在返回 NULL。
3. 如果 `<json_path>` 指定的元素不是 null 则返回 false。

## 示例
1. 正常参数
    ```sql
    SELECT json_extract_isnull('{"id": 123, "name": "doris"}', '$.id');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_isnull('{"id": 123, "name": "doris"}', '$.id') |
    +-------------------------------------------------------------+
    |                                                           0 |
    +-------------------------------------------------------------+
    ```

    ```sql
    SELECT json_extract_isnull('{"id": null, "name": "doris"}', '$.id');
    ```
    ```text
    +--------------------------------------------------------------+
    | json_extract_isnull('{"id": null, "name": "doris"}', '$.id') |
    +--------------------------------------------------------------+
    |                                                            1 |
    +--------------------------------------------------------------+
    ```
2. 路径不存在的情况
    ```sql
    SELECT json_extract_isnull('{"id": null, "name": "doris"}', '$.id2');
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_isnull('{"id": null, "name": "doris"}', '$.id2') |
    +---------------------------------------------------------------+
    |                                                          NULL |
    +---------------------------------------------------------------+
    ```
3. NULL 参数
    ```sql
    SELECT json_extract_isnull('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_isnull('{"id": 123, "name": "doris"}', NULl) |
    +-----------------------------------------------------------+
    |                                                      NULL |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_isnull(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_isnull(NULL, '$.id2') |
    +------------------------------------+
    |                               NULL |
    +------------------------------------+
    ```