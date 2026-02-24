---
{
    "title": "JSON_PARSE",
    "language": "zh-CN",
    "description": "将原始 JSON 字符串解析成 JSON 二进制格式。为了满足不同的异常数据处理需求，提供不同的 JSONPARSE 系列函数，具体如下："
}
---

## 描述
将原始 JSON 字符串解析成 JSON 二进制格式。为了满足不同的异常数据处理需求，提供不同的 JSON_PARSE 系列函数，具体如下：
* `JSON_PARSE`  解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，报错。
* `JSON_PARSE_ERROR_TO_NULL` 解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，返回 NULL。
* `JSON_PARSE_ERROR_TO_VALUE` 解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，返回参数 default_json_value 指定的默认值。

## 语法

```sql
JSON_PARSE (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_NULL (<json_str>)
```

```sql
JSON_PARSE_ERROR_TO_VALUE (<json_str>, <default_json_value>)
```

## 参数
### 必须参数
- `<json_str>` String 类型，其内容应是合法的 JSON 字符串。
### 可选参数
- `<default_json_value>` JSON 类型，可以是 NULL，当 `<json_str>` 解析失败时，`<default_json_value>` 作为默认值返回。

## 返回值
`Nullable<JSON>` 返回解析后得到的 JSON 对象

## 使用说明
1. 如果 `<json_str>` 是 NULL，得到的结果也是 NULL。
2. `JSONB_PARSE`/`JSONB_PARSE_ERROR_TO_NULL`/`JSONB_PARSE_ERROR_TO_VALUE` 行为基本一致，只是在解析失败时得到的结果不同。

## 示例
1. 正常 JSON 字符串解析
    ```sql
    SELECT json_parse('{"k1":"v31","k2":300}');
    ```
    ```text
    +-------------------------------------+
    | json_parse('{"k1":"v31","k2":300}') |
    +-------------------------------------+
    | {"k1":"v31","k2":300}               |
    +-------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null('{"k1":"v31","k2":300}','{}');
    ```
    ```text
    +---------------------------------------------------+
    | json_parse_error_to_null('{"k1":"v31","k2":300}') |
    +---------------------------------------------------+
    | {"k1":"v31","k2":300}                             |
    +---------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}','{}');
    ```
    ```text
    +---------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}','{}') |
    +---------------------------------------------------------+
    | {"k1":"v31","k2":300}                                   |
    +---------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('{"k1":"v31","k2":300}', NULL);
    ```
    ```text
    +----------------------------------------------------------+
    | json_parse_error_to_value('{"k1":"v31","k2":300}', NULL) |
    +----------------------------------------------------------+
    | {"k1":"v31","k2":300}                                    |
    +----------------------------------------------------------+
    ```
2. 非法 JSON 字符串解析
    ```sql
    SELECT json_parse('invalid json');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INTERNAL_ERROR]simdjson parse exception:
    ```
    ```sql
    SELECT json_parse_error_to_null('invalid json');
    ```
    ```text
    +------------------------------------------+
    | json_parse_error_to_null('invalid json') |
    +------------------------------------------+
    | NULL                                     |
    +------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json');
    ```
    ```text
    +-------------------------------------------+
    | json_parse_error_to_value('invalid json') |
    +-------------------------------------------+
    | {}                                        |
    +-------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', '{"key": "default value"}');
    ```
    ```text
    +-----------------------------------------------------------------------+
    | json_parse_error_to_value('invalid json', '{"key": "default value"}') |
    +-----------------------------------------------------------------------+
    | {"key":"default value"}                                               |
    +-----------------------------------------------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value('invalid json', NULL);
    ```
    ```text
    +-------------------------------------------------+
    | json_parse_error_to_value('invalid json', NULL) |
    +-------------------------------------------------+
    | NULL                                            |
    +-------------------------------------------------+
    ```
3. NULL 参数
    ```sql
    SELECT json_parse(NULL);
    ```
    ```text
    +------------------+
    | json_parse(NULL) |
    +------------------+
    | NULL             |
    +------------------+
    ```
    ```sql
    SELECT json_parse_error_to_null(NULL);
    ```
    ```text
    +--------------------------------+
    | json_parse_error_to_null(NULL) |
    +--------------------------------+
    | NULL                           |
    +--------------------------------+
    ```
    ```sql
    SELECT json_parse_error_to_value(NULL, '{}');
    ```
    ```text
    +---------------------------------------+
    | json_parse_error_to_value(NULL, '{}') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```