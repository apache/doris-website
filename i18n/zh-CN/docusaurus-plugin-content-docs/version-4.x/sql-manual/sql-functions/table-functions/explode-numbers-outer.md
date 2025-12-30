---
{
    "title": "EXPLODE_NUMBERS_OUTER",
    "language": "zh-CN",
    "description": "explodenumbersouter 函数接受一个数组，会将数组的每个元素映射为单独的行。需要与 LATERAL VIEW 配合使用，以将嵌套数据结构展开为标准的平面表格式。 explodenumbersouter 和 explodenumbers 区别主要在于空值处理。"
}
---

## 描述
`explode_numbers_outer` 函数接受一个数组，会将数组的每个元素映射为单独的行。需要与 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 配合使用，以将嵌套数据结构展开为标准的平面表格式。 `explode_numbers_outer` 和 [`explode_numbers`](./explode-numbers.md) 区别主要在于空值处理。

## 语法
```sql
EXPLODE_NUMBERS_OUTER(<int>)
```

## 参数
- `<int>` 数组类型

## 返回值
- 返回一个 `[0, n)` 整数列，列类型为 `Nullable<INT>`。
- 如果 `<int>` 为 NULL 或者为空数组（元素个数为 0），返回 1 行 NULL 数据。

## 示例
1. 常规参数
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(10) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    0 |
    |    1 |    1 |
    |    1 |    2 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |    7 |
    |    1 |    8 |
    |    1 |    9 |
    +------+------+
    ```
2. 参数 0
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(0) t2 as c;
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
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 负数参数
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(-1) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```