---
{
    "title": "POSEXPLODE",
    "language": "zh-CN",
    "description": "posexplode 表函数，将 <array> 列展开成多行, 并且增加一列标明位置的列，组成 STRUCT 类型返回。 需配合 Lateral View 使用, 可以支持多个 Lateral view。 posexplode 和 posexplodeouter 区别主要在于空值处理。"
}
---

## 描述
`posexplode` 表函数，将 `<array>` 列展开成多行, 并且增加一列标明位置的列，组成 [`STRUCT`](../../basic-element/sql-data-types/semi-structured/STRUCT.md) 类型返回。
需配合 Lateral View 使用, 可以支持多个 Lateral view。
`posexplode` 和 [`posexplode_outer`](./posexplode-outer.md) 区别主要在于空值处理。

## 语法
```sql
POSEXPLODE(<array>)
```

## 参数
- `<array>` 数组类型，不支持 NULL 参数。

## 返回值
- 返回一列多行的 STRUCT 数据，STRUCT 由 2 列组成：
    1. 从 0 开始递增的整数列，步长为 1，直到 n – 1，其中 n 表示结果的行数。
    2. 由 `<array>` 所有元素组成的列。

- 如果 `<array>` 为 NULL 或者为空数组（元素个数为 0），返回 0 行数据。

## 使用说明
1. `<array>` 不能为 NULL 或者其他类型，否则报错。

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
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+-----------------------+
    | k1   | c                     |
    +------+-----------------------+
    |    1 | {"pos":0, "col":1}    |
    |    1 | {"pos":1, "col":2}    |
    |    1 | {"pos":2, "col":null} |
    |    1 | {"pos":3, "col":4}    |
    |    1 | {"pos":4, "col":5}    |
    +------+-----------------------+
    ```
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as pos, value;
    ```
    ```text
    +------+------+-------+
    | k1   | pos  | value |
    +------+------+-------+
    |    1 |    0 |     1 |
    |    1 |    1 |     2 |
    |    1 |    2 |  NULL |
    |    1 |    3 |     4 |
    |    1 |    4 |     5 |
    +------+------+-------+
    ```
2. 空数组
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode([]) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 参数
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode(NULL) t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got NULL
    ```
4. 非数组参数
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got VARCHAR(3)
    ```