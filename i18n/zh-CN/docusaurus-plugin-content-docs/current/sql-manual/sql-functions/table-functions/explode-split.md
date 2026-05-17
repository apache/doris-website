---
{
    "title": "EXPLODE_SPLIT",
    "language": "zh-CN",
    "description": "explodesplit 表函数用于将字符串按照指定分隔符拆分为多个子字符串，并将每个子字符串展开为一行。 需要与 LATERAL VIEW 配合使用，以将嵌套数据结构展开为标准的平面表格式。 explodesplit 和 explodesplitouter 区别主要在于空值处理。"
}
---

## 描述
`explode_split` 表函数用于将字符串按照指定分隔符拆分为多个子字符串，并将每个子字符串展开为一行。
需要与 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 配合使用，以将嵌套数据结构展开为标准的平面表格式。
`explode_split` 和 [`explode_split_outer`](./explode-split-outer.md) 区别主要在于空值处理。

## 语法
```sql
EXPLODE_SPLIT(<str>, <delimiter>)
```

## 参数
- `<str>` String 类型，要分隔的字符串。
- `<delimiter>` String 类型，分隔符。

## 返回值
- 返回由分隔后的字符串组成的列，列类型为 String。

## 使用说明
1. `<str>` 为 NULL 时返回 0 行数据。
2. `<str>` 为空字符串（""）或者无法被拆分时，会返回一行数据。
3. `<delimiter>` 如果为 NULL，会返回 0 行数据。
4. `<delimiter>` 如果为空字符串（""），`<str>` 会被按字节进行拆分(参考：[`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md))。

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
    select  * from example lateral view explode_split("ab,cd,ef", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | ab   |
    |    1 | cd   |
    |    1 | ef   |
    +------+------+
    ```
2. 空字符串和无法分隔的情况
    ```sql
    select  * from example lateral view explode_split("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from example lateral view explode_split("abc", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | abc  |
    +------+------+
    ```
3. NULL 参数
    ```sql
    select  * from example lateral view explode_split(NULL, ',') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 空的分隔符
    ```sql
    select  * from example lateral view explode_split('abc', '') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | a    |
    |    1 | b    |
    |    1 | c    |
    +------+------+
    ```
5. 分隔符为 NULL
    ```sql
    select  * from example lateral view explode_split('abc', null) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```