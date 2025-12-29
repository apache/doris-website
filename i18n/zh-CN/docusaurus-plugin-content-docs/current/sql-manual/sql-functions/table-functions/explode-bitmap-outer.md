---
{
    "title": "EXPLODE_BITMAP_OUTER",
    "language": "zh-CN",
    "description": "explodebitmap 表函数，接受一个位图（bitmap）类型的数据，将位图中的每个 bit（位）映射为单独的行。 通常用于处理位图数据，将位图中的每个元素展开成单独的记录。需配合 LATERAL VIEW 使用。 explodebitmapouter 与 explodebitmap 类似，"
}
---

## 描述
explode_bitmap 表函数，接受一个位图（bitmap）类型的数据，将位图中的每个 bit（位）映射为单独的行。
通常用于处理位图数据，将位图中的每个元素展开成单独的记录。需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。
explode_bitmap_outer 与 explode_bitmap 类似，但在处理空值或 NULL 时行为有所不同。它允许空位图或 NULL 位图的记录存在，并在返回结果中将空位图或者 NULL 位图展开为 NULL 行。

## 语法
```sql
EXPLODE_BITMAP_OUTER(<bitmap>)
```

## 参数
- `<bitmap>` [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 类型

## 返回值
- 返回 `<bitmap>` 中每一位对应的行，其中每一行包含一个位值。
- 如果 `<bitmap>` 为 NULL 返回 1 行 NULL 数据。
- 如果 `<bitmap>` 为空，返回 1 行 NULL 数据。


## 使用说明
1. 如果 `<bitmap>` 参数的类型不是 [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) 会报错。

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
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 |    1 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |   10 |
    +------+------+
    ```
2. 空 BITMAP
    ```sql
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. NULL 参数
    ```sql
    select  * from example lateral view explode_bitmap_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 非数组参数
    ```sql
    select  * from example lateral view explode_bitmap_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap_outer(VARCHAR(3))
    ```