---
{
    "title": "EXPLODE_JSON_ARRAY_JSON_OUTER",
    "language": "zh-CN",
    "description": "explodejsonarrayjsonouter 表函数，接受一个 JSON 数组，其实现逻辑是将 JSON 数组转换为数组类型然后再调用 explodeouter 函数处理，行为等价于：explodeouter(cast(<jsonarray> as Array<JSON>)) 。"
}
---

## 描述
`explode_json_array_json_outer` 表函数，接受一个 JSON 数组，其实现逻辑是将 JSON 数组转换为数组类型然后再调用 `explode_outer` 函数处理，行为等价于：`explode_outer(cast(<json_array> as Array<JSON>))`
。需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法
```sql
EXPLODE_JSON_ARRAY_JSON_OUTER(<json>)
```

## 参数
- `<json>` JSON 类型，其内容应该是数组。

## 返回值
- 返回由 `<json>` 所有元素组成的单列多行数据，列类型为 `Nullable<JSON>`。
- 如果 `<json>` 为 NULL 或者为空数组（元素个数为 0），返回 1 行 NULL 数据。

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
    select * from example lateral view explode_json_array_json_outer('[4, "abc", {"key": "value"}, 5.23, null]') t2 as c;
    ```
    ```text
    +------+-----------------+
    | k1   | c               |
    +------+-----------------+
    |    1 | 4               |
    |    1 | "abc"           |
    |    1 | {"key":"value"} |
    |    1 | 5.23            |
    |    1 | NULL            |
    +------+-----------------+
    ```
2. 空数组
    ```sql
    select * from example lateral view explode_json_array_json_outer('[]') t2 as c;
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
    select * from example lateral view explode_json_array_json_outer(NULL) t2 as c;
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
    select * from example lateral view explode_json_array_json_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```