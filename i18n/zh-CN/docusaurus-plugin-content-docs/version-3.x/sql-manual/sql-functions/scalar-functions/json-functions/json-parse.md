---
{
    "title": "JSON_PARSE",
    "language": "zh-CN"
}
---

## 描述
将原始 JSON 字符串解析成 JSON 二进制格式。为了满足不同的异常数据处理需求，提供不同的 JSON_PARSE 系列函数，具体如下：
* JSON_PARSE  解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，报错。
* JSON_PARSE_ERROR_TO_INVALID 解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，返回 NULL。
* JSON_PARSE_ERROR_TO_NULL 解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，返回 NULL。
* JSON_PARSE_ERROR_TO_VALUE 解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，返回参数 default_json_str 指定的默认值。
* JSON_PARSE_NOTNULL 解析 JSON 字符串，当输入的字符串不是合法的 JSON 字符串时，返回 NULL。

## 别名
* JSONB_PARSE 同 `JSON_PARSE`
* JSONB_PARSE_ERROR_TO_INVALID 同 `JSON_PARSE_ERROR_TO_INVALID`
* JSONB_PARSE_ERROR_TO_NULL 同 `JSON_PARSE_ERROR_TO_NULL`
* JSONB_PARSE_ERROR_TO_VALUE 同 `JSON_PARSE_ERROR_TO_VALUE`
* JSONB_PARSE_NOTNULL 同 `JSON_PARSE_NOTNULL`

## 语法

```sql
JSON_PARSE (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_INVALID (<json_str>)
```
```sql
JSON_PARSE_ERROR_TO_NULL (<json_str>)
```

```sql
JSON_PARSE_ERROR_TO_VALUE (<json_str>, <default_json_str>)
```
```sql
JSONB_PARSE_NOTNULL (<json_str>)
```

## 参数
| 参数           | 描述                          |
|--------------|-----------------------------|
| `<json_str>` | 要提取的 JSON 类型的参数或者字段         |
| `<default_json_str>`     | 当输入的字符串不是合法的 JSON 字符串时，返回参数 default_json_str 指定的默认值。 |

## 返回值
* json_str 为 NULL 时，都返回 NULL
* json_str 为非法 JSON 字符串时
  - JSON_PARSE 报错
  - JSON_PARSE_ERROR_TO_INVALID 返回 NULL
  - JSON_PARSE_ERROR_TO_NULL 返回 NULL
  - JSON_PARSE_ERROR_TO_VALUE 返回参数 default_json_str 指定的默认值
  - JSON_PARSE_NOTNULL 返回 NULL



## 示例

1. 正常 JSON 字符串解析
```sql
SELECT json_parse('{"k1":"v31","k2":300}');
```
```text
+--------------------------------------+
| json_parse('{"k1":"v31","k2":300}') |
+--------------------------------------+
| {"k1":"v31","k2":300}                |
+--------------------------------------+
```
```sql
SELECT json_parse_error_to_invalid('{"k1":"v31","k2":300}');
```
```text
+-------------------------------------------------------+
| jsonb_parse_error_to_invalid('{"k1":"v31","k2":300}') |
+-------------------------------------------------------+
| {"k1":"v31","k2":300}                                 |
+-------------------------------------------------------+
```
```sql
SELECT json_parse_notnull('{"a":"b"}');
```
```text
+----------------------------------+
| jsonb_parse_notnull('{"a":"b"}') |
+----------------------------------+
| {"a":"b"}                        |
+----------------------------------+
```
```sql
SELECT json_parse_error_to_value('{"k1":"v31","k2":300}','{}');
```
```text
+-----------------------------------------------------------+
| jsonb_parse_error_to_value('{"k1":"v31","k2":300}', '{}') |
+-----------------------------------------------------------+
| {"k1":"v31","k2":300}                                     |
+-----------------------------------------------------------+
```
2. 非法 JSON 字符串解析
```sql
SELECT json_parse('invalid json');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = json parse error: Invalid document: document must be an object or an array for value: invalid json
```
```sql
SELECT json_parse_error_to_invalid('invalid json');
```
```text
+----------------------------------------------+
| jsonb_parse_error_to_invalid('invalid json') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
```sql
SELECT json_parse_notnull('invalid json');
```
```text
+-------------------------------------------+
| jsonb_parse_error_to_null('invalid json') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
```sql
SELECT json_parse_error_to_value('invalid json', '{}');
```
```text
+--------------------------------------------------+
| json_parse_error_to_value('invalid json', '{}') |
+--------------------------------------------------+
| {}                                               |
+--------------------------------------------------+
```