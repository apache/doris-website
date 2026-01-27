---
{
    "title": "EXPLODE_JSON_ARRAY_DOUBLE",
    "language": "zh-CN",
    "description": "explodejsonarraydouble 表函数，接受一个 JSON 数组，其实现逻辑是将 JSON 数组转换为数组类型然后再调用 explode 函数处理，行为等价于：explode(cast(<jsonarray> as Array<DOUBLE>)) 。"
}
---

## 描述
`explode_json_array_double` 表函数，接受一个 JSON 数组，其实现逻辑是将 JSON 数组转换为数组类型然后再调用 `explode` 函数处理，行为等价于：`explode(cast(<json_array> as Array<DOUBLE>))`
。需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法
```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
```

## 参数
- `<json>` JSON 类型，其内容应该是数组。

## 返回值
- 返回由 `<json>` 所有元素组成的单列多行数据，列类型为 `Nullable<DOUBLE>`。
- 如果 `<json>` 为 NULL 或者为空数组（元素个数为 0），返回 0 行数据。
- 如果 JSON 数组的元素不是 DOUBLE 类型，会尝试将其转换为 DOUBLE 类型，无法转换为 DOUBLE 类型的被转换为 NULL，类型转换规则参考：[JSON 类型转换](../../basic-element/sql-data-types/conversion/json-conversion.md)。

## 示例
0. 准备数据
    ```sql
        create table example(
            id int
        ) properties(
            "replication_num" = "1"
        );

        insert into example values(1);
    ```
1. 常规参数
    ```sql
    select * from example lateral view explode_json_array_double('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | id   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. double 类型
    ```sql
    select * from example
        lateral view 
        explode_json_array_double('[123.445, 9223372036854775807.0, 9223372036854775808.0, -9223372036854775808.0, -9223372036854775809.0]') t2 as c;
    ```
    ```text
    +------+------------------------+
    | id   | c                      |
    +------+------------------------+
    |    1 |                123.445 |
    |    1 |  9.223372036854776e+18 |
    |    1 |  9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    +------+------------------------+
    ```
3. 空数组
    ```sql
    select * from example lateral view explode_json_array_double('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 参数
    ```sql
    select * from example lateral view explode_json_array_double(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 非数组参数
    ```sql
    select * from example lateral view explode_json_array_double('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```