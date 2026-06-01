---
{
    "title": "EXPLODE_JSON_ARRAY_INT_OUTER",
    "language": "zh-CN",
    "description": "explode_json_array_int_outer 表函数，接受一个 JSON 数组。"
}
---

## 描述
`explode_json_array_int_outer` 表函数，接受一个 JSON 数组，其实现逻辑是将 JSON 数组转换为数组类型然后再调用 `explode_outer` 函数处理，行为等价于：`explode_outer(cast(<json_array> as Array<BIGINT>))`。
需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法
```sql
EXPLODE_JSON_ARRAY_INT_OUTER(<json>)
```

## 参数
- `<json>` JSON 类型，其内容应该是数组。

## 返回值
- 返回由 `<json>` 所有元素组成的单列多行数据，列类型为 `Nullable<BIGINT>`。
- 如果 `<json>` 为 NULL 或为空数组（元素个数为 0），则返回包含一行 NULL 的结果。
- 如果 JSON 数组中的元素不是 INT 类型，函数会尝试将其转换为 INT；无法转换为 INT 的元素会被转换为 NULL。类型转换规则参见 [JSON 类型转换](../../basic-element/sql-data-types/conversion/json-conversion.md)。

## 举例
0. 准备数据
    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 常规参数
    ```sql
    select * from example lateral view explode_json_array_int_outer('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    5 |
    |    1 | NULL |
    +------+------+
    ```
2. 非 INT 类型元素
    ```sql
    select * from example 
        lateral view 
        explode_json_array_int_outer('["abc", "123.4", 9223372036854775808.0, 9223372036854775295.999999]') t2 as c;
    ```
    ```text
    +------+---------------------+
    | k1   | c                   |
    +------+---------------------+
    |    1 |                NULL |
    |    1 |                 123 |
    |    1 |                NULL |
    |    1 | 9223372036854774784 |
    +------+---------------------+
    ```
    > `9223372036854775808.0` 超出 `BIGINT` 的有效范围，因此转换为 NULL。
    > 字符串 `"123.4"` 转换为 `123`。
    > 字符串 `"abc"` 无法转换为 INT，结果为 NULL。
3. 空数组
    ```sql
    select * from example lateral view explode_json_array_int_outer('[]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. NULL 参数
    ```sql
    select * from example lateral view explode_json_array_int_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
5. 非数组参数
    ```sql
    select * from example lateral view explode_json_array_int_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
