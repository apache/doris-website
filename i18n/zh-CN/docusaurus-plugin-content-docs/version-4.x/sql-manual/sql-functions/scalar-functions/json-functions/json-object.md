---
{
    "title": "JSON_OBJECT",
    "language": "zh-CN",
    "description": "生成一个包含指定 Key-Value 对的 json object, 当 Key 值为 NULL 或者传入参数为奇数个时，返回异常错误。"
}
---

## 描述

生成一个包含指定 Key-Value 对的 json object, 当 Key 值为 NULL 或者传入参数为奇数个时，返回异常错误。

## 语法

```sql
JSON_OBJECT (<key>, <value>[, <key>, <value>, ...])
```

```sql
JSON_OBJECT(*)
```

## 参数
- `<key>` String 类型
- `<value>` 多种类型，Doris 会自动将非 Json 类型的参数通过 [`TO_JSON`](./to-json.md) 函数将其转换为 Json 类型。
：`*` 当使用星号（通配符）调用时，会使用指定数据中的引用名成作为键（key），对应的值作为值（value），从而构造出一个 JSON 类型的值。

    当向该函数传入通配符时，可以用表的名称或别名对通配符进行限定。例如，若要传入名为 mytable 的表中的所有列，请按如下方式指定：

    ```sql
    (mytable.*)
    ```

## 注意事项
- 参数数量必须为偶数个，可以是 0 个参数（返回一个空的 Json 对象）。
- 按照惯例，参数列表由交替的键和值组成。
- Key 按照JSON 定义强制转换为文本。
- 如果传入的 Key 为 NULL，返回异常错误。
- Value 参数按照可以转换为 json 的方式进行转换，必须是 [`TO_JSON`](./to-json.md) 支持的类型。
- 如果传入的 Value 为 NULL，返回的 json object 中该 Key-Value 对的 Value 值为 Json 的 null 值。
- 如果支持其他类型的作为 value，可以使用 CAST 将其转换为 Json/String.
- Doris 目前没有对 Json 对象去重，也就是允许重复的 key。但是重复 key 可能会引起意外的结果:
    1. 其他系统中可能会丢掉重复的 key 对应的值，或者报错。
    2. [`JSON_EXTRACT`](./json-extract.md) 返回的结果不确定。

## 返回值

[`JSON`](../../../basic-element/sql-data-types/semi-structured/JSON.md)： 返回由参数列表组成的 JSON 对象。

## 示例
1. 没有参数的情况
    ```sql
    select json_object();
    ```
    ```text
    +---------------+
    | json_object() |
    +---------------+
    | {}            |
    +---------------+
    ```
2. 不支持的 value 类型 
    ```sql
    select json_object('time',curtime());
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(TIMEV2(0))
    ```
    可以通过 cast 将其转换为 String
    ```sql
    select json_object('time', cast(curtime() as string));
    ```
    ```text
    +------------------------------------------------+
    | json_object('time', cast(curtime() as string)) |
    +------------------------------------------------+
    | {"time":"17:09:42"}                            |
    +------------------------------------------------+
    ```
3. 非 String 类型的 key 会被转换为 String
    ```sql
    SELECT json_object(123, 456);
    ```
    ```text
    +-----------------------+
    | json_object(123, 456) |
    +-----------------------+
    | {"123":456}           |
    +-----------------------+
    ```
4. Null 不能作为 key
    ```sql
    select json_object(null, 456);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = json_object key can't be NULL: json_object(NULL, 456)
    ```
    Null 可以做为 value
    ```sql
    select json_object('key', null);
    ```
    ```text
    +--------------------------+
    | json_object('key', null) |
    +--------------------------+
    | {"key":null}             |
    +--------------------------+
    ```

5. Json 字符串可以通过 [`JSON_PARSE`](./json-parse.md) 解析为 Json 对象后传入到 `JSON_OBJECT`
    ```sql
    select json_object(123, json_parse('{"key": "value"}'));
    ```
    ```text
    +--------------------------------------------------+
    | json_object(123, json_parse('{"key": "value"}')) |
    +--------------------------------------------------+
    | {"123":{"key":"value"}}                          |
    +--------------------------------------------------+
    ```
    否则将作为字符串处理
    ```sql
    select json_object(123,'{"key": "value"}');
    ```
    ```text
    +-------------------------------------+
    | json_object(123,'{"key": "value"}') |
    +-------------------------------------+
    | {"123":"{\"key\": \"value\"}"}      |
    +-------------------------------------+
    ```
6. [`TO_JSON`](./to-json.md) 不支持的类型
    ```sql
    select json_object('key', map('abc', 'efg'));
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(MAP<VARCHAR(3),VARCHAR(3)>)
    ```

    可以通过 CAST 语句将其转换为 Json 再传入：
    ```sql
    select json_object('key', cast(map('abc', 'efg') as json));
    ```
    ```text
    +-----------------------------------------------------+
    | json_object('key', cast(map('abc', 'efg') as json)) |
    +-----------------------------------------------------+
    | {"key":{"abc":"efg"}}                               |
    +-----------------------------------------------------+
    ```
7. 重复 key 的情况
    ```sql
    select
        json_object('key', 123, 'key', 4556) v1
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.key') v2
        , jsonb_extract(json_object('key', 123, 'key', 4556), '$.*') v3;
    ```
    ```text
    +------------------------+------+------------+
    | v1                     | v2   | v3         |
    +------------------------+------+------------+
    | {"key":123,"key":4556} | 123  | [123,4556] |
    +------------------------+------+------------+
    ```