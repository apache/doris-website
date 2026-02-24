---
{
    "title": "EXPLODE-OUTER",
    "language": "zh-CN",
    "description": "explode 函数接受一个数组，会将数组的每个元素映射为单独的行。需要与 LATERAL VIEW 配合使用，以将嵌套数据结构展开为标准的平面表格式。 explodeouter 和 explode 区别主要在于空值处理。"
}
---

## 描述
`explode` 函数接受一个数组，会将数组的每个元素映射为单独的行。需要与 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 配合使用，以将嵌套数据结构展开为标准的平面表格式。 `explode_outer` 和 [`explode`](./explode.md) 区别主要在于空值处理。

## 语法
```sql
EXPLODE(<array>[, ...])
```

## 可变参数
- `<array>` 数组类型。

## 返回值
- 返回由 `<array>` 所有元素组成的单列多行数据。
- 如果 `<array>` 为 NULL 或者为空数组（元素个数为 0），返回 1 行 NULL 数据。

## 使用说明
1. 如果 `<array>` 参数的类型不是 [`Array`](../../basic-element/sql-data-types/semi-structured/ARRAY.md) 会报错。
2. 如果有多个数组参数，展开的行数由数组展开后最多的行数决定，行数不足的用 NULL 补齐。

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
    select  * from example lateral view explode([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    1 |
    |    1 |    2 |
    |    1 | NULL |
    |    1 |    4 |
    |    1 |    5 |
    +------+------+
    ```
2. 多个参数
    ```sql
    select  * from example lateral view explode([], [1, 2, null, 4, 5], ["ab", "cd", "ef"], [null, null, 1, 2, 3, 4, 5]) t2 as c0, c1, c2, c3;
    ```
    ```text
    +------+------+------+------+------+
    | k1   | c0   | c1   | c2   | c3   |
    +------+------+------+------+------+
    |    1 | NULL |    1 | ab   | NULL |
    |    1 | NULL |    2 | cd   | NULL |
    |    1 | NULL | NULL | ef   |    1 |
    |    1 | NULL |    4 | NULL |    2 |
    |    1 | NULL |    5 | NULL |    3 |
    |    1 | NULL | NULL | NULL |    4 |
    |    1 | NULL | NULL | NULL |    5 |
    +------+------+------+------+------+
    ```
    > 展开后行数最多的数组是 `[null, null, 1, 2, 3, 4, 5]`（c3）, 一共有 7 行数据，所以最终展开得到 7 行，其余三个数组（c0、c1、c2）不足的行用 NULL 补齐。
3. 空数组
    ```sql
    select  * from example lateral view explode_outer([]) t2 as c;
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
    select  * from example lateral view explode_outer(NULL) t2 as c;
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
    select  * from example lateral view explode_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_outer(VARCHAR(3))
    ```