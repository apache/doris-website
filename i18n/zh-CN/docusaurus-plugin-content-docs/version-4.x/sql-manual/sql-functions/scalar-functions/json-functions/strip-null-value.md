---
{
    "title": "STRIP_NULL_VALUE",
    "language": "zh-CN",
    "description": "STRIPNULLVALUE 函数将 JSON 中的 NULL 值转换为 SQL 中的 NULL 值。所有其他变体值保持不变。"
}
---

## 描述

`STRIP_NULL_VALUE` 函数将 JSON 中的 NULL 值转换为 SQL 中的 NULL 值。所有其他变体值保持不变。

## 语法

```sql
STRIP_NULL_VALUE( <json_doc> )
```

## 必选参数
- `<json_doc>` JSON 类型，需要处理的 JSON 对象。

## 使用说明
1. 如果参数是 NULL 返回 NULL。
2. 如果参数是 json null 返回 NULL。
3. 对于不是 null 的 json 数据返回原始输入。

## 举例
0. 准备数据
```sql
create table my_test(id, v json) properties('replication_num' = '1');
insert into my_test values(0, 'null'), (1, null), (2, 123), (3, '{"key": 445}'), (4, '{"key": null}');

select * from my_test;
```
1. 示例 1
    ```sql
    select id, v, strip_null_value(v) from my_test order by id;
    ```
    ```text
    +------+--------------+---------------------+
    | id   | v            | strip_null_value(v) |
    +------+--------------+---------------------+
    |    0 | null         | NULL                |
    |    1 | NULL         | NULL                |
    |    2 | 123          | 123                 |
    |    3 | {"key":445}  | {"key":445}         |
    |    4 | {"key":null} | {"key":null}        |
    +------+--------------+---------------------+
    1 row in set (0.02 sec)
    ```

2. 示例 2
    ```sql
    select
        id
        , v
        , strip_null_value(json_extract(v, '$.key')) 
    from my_test order by id;
    ```
    ```text
    +------+--------------+--------------------------------------------+
    | id   | v            | strip_null_value(json_extract(v, '$.key')) |
    +------+--------------+--------------------------------------------+
    |    0 | null         | NULL                                       |
    |    1 | NULL         | NULL                                       |
    |    2 | 123          | NULL                                       |
    |    3 | {"key":445}  | 445                                        |
    |    4 | {"key":null} | NULL                                       |
    +------+--------------+--------------------------------------------+
    ```
