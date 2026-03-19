---
{
  "title": "STRIP_NULL_VALUE",
  "language": "ja",
  "description": "STRIPNULLVALUE関数は、JSON内のNULL値をSQL内のNULL値に変換します。その他のすべてのvariant値は変更されません。"
}
---
## 説明

`STRIP_NULL_VALUE`関数は、JSON内のNULL値をSQL内のNULL値に変換します。その他のvariant値はすべて変更されません。

## 構文

```sql
STRIP_NULL_VALUE( <json_doc> )
```
## 必須パラメータ
- `<json_doc>`: JSON型、処理対象のJSONオブジェクト。

## 使用上の注意
1. 引数がNULLの場合、NULLを返します。
2. 引数がjson nullの場合、NULLを返します。
3. nullでないjsonデータの場合、元の入力を返します。

## 例
0. データの準備

```sql
create table my_test(id, v json) properties('replication_num' = '1');
insert into my_test values(0, 'null'), (1, null), (2, 123), (3, '{"key": 445}'), (4, '{"key": null}');

select * from my_test;
```
1. 例1

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
2. 例2

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
