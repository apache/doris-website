---
{
    "title": "EXPLODE_JSON_OBJECT",
    "language": "zh-CN",
    "description": "explodejsonobject 表函数，将 JSON 对象展开为多行，每行包含一个键值对。 通常用于将 JSON 对象展开为更易查询的格式。该函数只支持包含元素的 JSON 对象。 需配合 LATERAL VIEW 使用。"
}
---

## 描述
`explode_json_object` 表函数，将 JSON 对象展开为多行，每行包含一个键值对。
通常用于将 JSON 对象展开为更易查询的格式。该函数只支持包含元素的 JSON 对象。
需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法
```sql
EXPLODE_JSON_OBJECT(<json>)
```

## 参数
- `<json>` JSON 类型，其内容应该是 JSON 对象。

## 返回值
- 返回由 `<json>` 所有元素组成的单列多行数据，列类型为 `Nullable<Struct<String, JSON>>`。
- 如果 `<json>` 为 NULL 或者不是 JSON 对象（比如是数组 `[]`）返回 0 行数据。
- 如果 `<json>` 为空对象（比如 `{}`），返回 0 行数据。

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
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as c;
    ```
    ```text
    +------+------------------------------+
    | k1   | c                            |
    +------+------------------------------+
    |    1 | {"col1":"k1", "col2":""v1""} |
    |    1 | {"col1":"k2", "col2":"123"}  |
    +------+------------------------------+
    ```
2. 将键值对展开为独立的列
    ```sql
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k1   | "v1" |
    |    1 | k2   | 123  |
    +------+------+------+
    ```
    > `v` 的类型为 JSON
3. 空对象
    ```sql
    select  * from example lateral view explode_json_object('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 参数
    ```sql
    select  * from example lateral view explode_json_object(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 非对象参数
    ```sql
    select  * from example lateral view explode_json_object('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```