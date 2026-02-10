---
{
    "title": "JSON_CONTAINS",
    "language": "zh-CN",
    "description": "用于判断一个 JSON 文档是否包含指定的 JSON 元素。如果指定的元素存在于 JSON 文档中，则返回 1，否则返回 0。如果 JSON 文档或查询的元素无效，则返回 NULL。"
}
---

## 描述

用于判断一个 JSON 文档是否包含指定的 JSON 元素。如果指定的元素存在于 JSON 文档中，则返回 1，否则返回 0。如果 JSON 文档或查询的元素无效，则返回 `NULL`。

## 语法

```sql
JSON_CONTAINS(<json_object>, <candidate>[, <json_path>])
```

## 参数
### 必选参数
- `<json_object>` JSON 类型，检查其中是否存在 `<candidate>`。
- `<candidate>` JSON 类型，要判断的候选值。
### 可选参数
- `<json_path>` String 类型，搜索起始路径，如果不提供默认从 root 开始。

## 返回值
- Null 如果三个参数任意一个为 NULL，返回 NULL
- True 如果`<json_object>` 存在 `<candidate>`，返回 True。
- False 如果`<json_object>` 不存在 `<candidate>`，返回 False。
- 如果 `<json_object>` 或 `<candidate>` 不是 JSON 类型，报错。

## 示例 
1. 示例 1
    ```sql
    SET @j = '{"a": 1, "b": 2, "c": {"d": 4}}';
    SET @j2 = '1';
    SELECT JSON_CONTAINS(@j, @j2, '$.a');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, @j2, '$.a') |
    +-------------------------------+
    |                             1 |
    +-------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS(@j, @j2, '$.b');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, @j2, '$.b') |
    +-------------------------------+
    |                             0 |
    +-------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS(@j, '{"a": 1}');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, '{"a": 1}') |
    +-------------------------------+
    |                             1 |
    +-------------------------------+
    ```
2. NULL 参数
    ```sql
    SELECT JSON_CONTAINS(NULL, '{"a": 1}');
    ```
    ```text
    +---------------------------------+
    | JSON_CONTAINS(NULL, '{"a": 1}') |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS('{"a": 1}', NULL);
    ```
    ```text
    +---------------------------------+
    | JSON_CONTAINS('{"a": 1}', NULL) |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS('{"a": 1}', '{"a": 1}', NULL);
    ```
    ```text
    +---------------------------------------------+
    | JSON_CONTAINS('{"a": 1}', '{"a": 1}', NULL) |
    +---------------------------------------------+
    |                                        NULL |
    +---------------------------------------------+
    ```