---
{
    "title": "STRIP_NULL_VALUE",
    "language": "ja",
    "description": "JSON の null 値を SQL の NULL に変換します。それ以外の VARIANT 値は変更しません。"
}
---

## 説明

`STRIP_NULL_VALUE` 関数は JSON の null 値を SQL の NULL に変換します。それ以外の VARIANT 値は変更しません。

## 構文

```sql
STRIP_NULL_VALUE( <json_doc> )
```

## 必須パラメータ
- `<json_doc>`: 処理する JSON 型の値です。

## 使用上の注意
1. 引数が SQL NULL の場合は NULL を返します。
2. 引数が JSON の null の場合は SQL NULL を返します。
3. JSON データが null でない場合は、元の入力を返します。

## 例
0. データを準備する
```sql
create table my_test(id INT, v json) properties('replication_num' = '1');
insert into my_test values(0, 'null'), (1, null), (2, 123), (3, '{"key": 445}'), (4, '{"key": null}');

select * from my_test;
```
1. 例 1
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
    5 rows in set (0.02 sec)
    ```

2. 例 2
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
