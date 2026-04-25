---
{
    "title": "EXPLODE_JSON_ARRAY_STRING_OUTER",
    "language": "zh-CN",
    "description": "explodejsonarraystringouter 表函数，接受一个 JSON 数组，其实现逻辑是将 JSON 数组转换为数组类型然后再调用 explodeouter 函数处理，行为等价于：explodeouter(cast(<jsonarray> as Array<STRING>)) 。"
}
---

## 描述
`explode_json_array_string_outer` 表函数，接受一个 JSON 数组，其实现逻辑是将 JSON 数组转换为数组类型然后再调用 `explode_outer` 函数处理，行为等价于：`explode_outer(cast(<json_array> as Array<STRING>))`
。需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法
```sql
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```

## 参数
- `<json>` JSON 类型，其内容应该是数组。

## 返回值
- 返回由 `<json>` 所有元素组成的单列多行数据，列类型为 `Nullable<STRING>`。
- 如果 `<json>` 为 NULL 或者为空数组（元素个数为 0），返回 1 行 NULL 数据。
- 如果 JSON 数组的元素不是 INT 类型，会尝试将其转换为 STRING，如果无法转换为 STRING 类型会被转换为 NULL，关于类型转换的规则请参考 [JSON 类型转换](../../basic-element/sql-data-types/conversion/json-conversion.md)。

## 示例
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
    select * from example lateral view explode_json_array_string_outer('[4, "5", "abc", 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | 4    |
    |    1 | 5    |
    |    1 | abc  |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. 空数组
    ```sql
    select * from example lateral view explode_json_array_string_outer('[]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. NULL 参数
    ```sql
    select * from example lateral view explode_json_array_string_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 非数组参数
    ```sql
    select * from example lateral view explode_json_array_string_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```