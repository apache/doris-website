---
{
    "title": "EXPLODE_MAP",
    "language": "zh-CN",
    "description": "explodemap 表函数，接受一个 map (映射类型)，将 map（映射类型）展开成多个行，每行包含一个键值对。 需配合 LATERAL VIEW 使用。"
}
---

## 描述
`explode_map` 表函数，接受一个 map (映射类型)，将 map（映射类型）展开成多个行，每行包含一个键值对。
需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法
```sql
EXPLODE_MAP(<map>)
```

## 参数
- `<map>` MAP 类型。

## 返回值
- 返回由 `<map>` 所有元素组成的单列多行数据，列类型为 `Nullable<Struct<K, V>>`。
- 如果 `<map>` 为 NULL 或者 `<map>` 为空，返回 0 行数据。

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
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as c;
    ```
    ```text
    +------+-----------------------------+
    | k1   | c                           |
    +------+-----------------------------+
    |    1 | {"col1":"k", "col2":"v"}    |
    |    1 | {"col1":"k2", "col2":"123"} |
    |    1 | {"col1":null, "col2":null}  |
    +------+-----------------------------+
    ```
2. 将键值对展开为独立的列
    ```sql
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k    | v    |
    |    1 | k2   | 123  |
    |    1 | NULL | NULL |
    +------+------+------+
    ```
3. 空对象
    ```sql
    select  * from example lateral view explode_map(map()) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 参数
    ```sql
    select  * from example lateral view explode_map(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```