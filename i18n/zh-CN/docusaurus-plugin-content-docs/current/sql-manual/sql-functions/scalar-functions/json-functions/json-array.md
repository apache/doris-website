---
{
    "title": "JSON_ARRAY",
    "language": "zh-CN"
}
---

# JSON_ARRAY
## 功能
生成一个包含指定元素的 json 数组，未传入参数时返回空数组。
## 语法
```sql
JSON_ARRAY([<expression>, ...]) 
```
## 参数
### 可变参数：
- `<expression>`: 要包含在 JSON 数组中的元素。可以是单个或者多种类型的值，包括NULL。
## 返回值
[`Nullable(JSON)`](../../../basic-element/sql-data-types/semi-structured/JSON.md)： 返回由参数列表组成的 JSON 数组。

## 使用说明
- JSON_ARRAY 的实现是通过将不同类型的参数通过隐式调用 `TO_JSON` 函数将其转换为 Json 值，所以参数必须是 `TO_JSON` 支持的类型
- Null 会被转换为 Json 的 null, 如果不希望在数组中保留 null 值，可以使用函数 `JSON_ARRAY_IGNORE_NULL`.
- 如果参数类型不被 `TO_JSON` 支持，那么会得到错误，可以先将该参数转换为 String 类型，比如:
    ```sql
    select JSON_ARRAY(CAST(SOME_UNSUPPORTED_TYPE as String));
    ```
- 如果参数是 Json 字符串并且希望将其作为 Json 对象加入到数组中，应该显式调用 `JSON_PARSE` 函数将其解析为 Json 对象：
  ```sql
  select JSON_ARRAY(JSON_PARSE('{"key": "value"}'));
  ```

## 示例
1. 单个参数
    ```sql
    select json_array('item1');
    ```
    ```
    +---------------------+
    | json_array('item1') |
    +---------------------+
    | ["item1"]           |
    +---------------------+
    ```
2. NULL 参数
    ```sql
    select json_array(null);
    ```
    ```
    +------------------+
    | json_array(null) |
    +------------------+
    | [null]           |
    +------------------+
    ```
3. 多个参数
    ```sql
    select json_array('item1', null, {"key": "map value"}, 123.3333, now(), 'duplicated', 'duplicated');
    ```
    ```
    +----------------------------------------------------------------------------------------------+
    | json_array('item1', null, {"key": "map value"}, 123.3333, now(), 'duplicated', 'duplicated') |
    +----------------------------------------------------------------------------------------------+
    | ["item1",null,{"key":"map value"},123.3333,"2025-06-03 15:39:09","duplicated","duplicated"]  |
    +----------------------------------------------------------------------------------------------+
    ```
    > 参数支持任意类型，支持重复的值。
4. 没有参数
    ```sql
    select json_array();
    ```
    ```
    +--------------+
    | json_array() |
    +--------------+
    | []           |
    +--------------+
    ```
5. 无法转换成 JSON 的半结构化类型数据
    ```sql
    select json_array('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = cannot cast MAP<TINYINT,VARCHAR(3)> to JSON
    ```

