---
{
    "title": "JSON_ARRAY_IGNORE_NULL",
    "language": "zh-CN",
    "description": "生成一个包含指定元素的 json 数组，未传入参数时返回空数组，它与 JSONARRAY 只有一个区别：会忽略值为 NULL 的参数。"
}
---

# JSON_ARRAY_IGNORE_NULL
## 功能
生成一个包含指定元素的 json 数组，未传入参数时返回空数组，它与 [`JSON_ARRAY`](./json-array.md) 只有一个区别：会忽略值为 NULL 的参数。
## 语法
```sql
JSON_ARRAY_IGNORE_NULL([<expression>, ...]) 
```
## 参数
### 可变参数：
- `<expression>`: 要包含在 JSON 数组中的元素。可以是单个或者多种类型的值，包括NULL。
## 返回值
[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md)： 返回由参数列表组成的 JSON 数组。

## 使用说明
- JSON_ARRAY_IGNORE_NULL 的实现是通过将不同类型的参数通过隐式调用 [`TO_JSON`](./to-json.md) 函数将其转换为 Json 值，所以参数必须是 [`TO_JSON`](./to-json.md) 支持的类型
- NULL 会丢弃, 如果希望在数组中保留 NULL 值，可以使用函数 [`JSON_ARRAY`](./json-array.md).
- 如果参数类型不被 [`TO_JSON`](./to-json.md) 支持，那么会得到错误，可以先将该参数转换为 String 类型，比如:
    ```sql
    select JSON_ARRAY_IGNORE_NULL(CAST(NOW() as String));
    ```
    > NOW() 函数得到的是 DateTime 类型，需要通过 CAST 函数转换为 String 类型
- 如果参数是 Json 字符串并且希望将其作为 Json 对象加入到数组中，应该显式调用 [`JSON_PARSE`](./json-parse.md) 函数将其解析为 Json 对象：
  ```sql
  select JSON_ARRAY_IGNORE_NULL(JSON_PARSE('{"key": "value"}'));
  ```

## 示例
1. 常规参数
    ```sql
    select json_array_ignore_null() as empty_array, json_array_ignore_null(1) v1, json_array_ignore_null(1, 'abc') v2;
    ```
    ```
    +-------------+------+-----------+
    | empty_array | v1   | v2        |
    +-------------+------+-----------+
    | []          | [1]  | [1,"abc"] |
    +-------------+------+-----------+
    ```
2. NULL 参数
    ```sql
    select json_array_ignore_null(null) v1, json_array_ignore_null(1, null, 'I am a string') v2;
    ```
    ```
    +------+---------------------+
    | v1   | v2                  |
    +------+---------------------+
    | []   | [1,"I am a string"] |
    +------+---------------------+
    ```
3. 不支持的参数类型
    ```sql
    select json_array_ignore_null('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<TINYINT,VARCHAR(3)>)
    ```
4. Map 类型参数可以先显式转换为 JSON

    ```sql
    select json_array_ignore_null(1, cast(map('key', 'value') as json));
    ```
    ```
    +--------------------------------------------------------------+
    | json_array_ignore_null(1, cast(map('key', 'value') as json)) |
    +--------------------------------------------------------------+
    | [1,{"key":"value"}]                                          |
    +--------------------------------------------------------------+
    ```
5. Json 字符串可以用 json_parse 解析
    ```sql
    select json_array_ignore_null(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}'));
    ```
    ```
    +------------------------------------------------------------------------------------------+
    | json_array_ignore_null(json_parse('{"key1": "value", "key2": [1, "I am a string", 3]}')) |
    +------------------------------------------------------------------------------------------+
    | [{"key1":"value","key2":[1,"I am a string",3]}]                                          |
    +------------------------------------------------------------------------------------------+
    ```