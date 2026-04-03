---
{
  "title": "EXPLODE_JSON_ARRAY_DOUBLE",
  "description": "explodejsonarraydouble table関数は JSON 配列を受け取ります。",
  "language": "ja"
}
---
## 説明
`explode_json_array_double` table関数は JSON 配列を受け取ります。その実装ロジックは、JSON 配列を配列型に変換してから `explode` 関数を呼び出して処理することです。この動作は `explode(cast(<json_array> as Array<DOUBLE>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
```
## パラメータ
- `<json>` JSON型、内容は配列である必要があります。

## 戻り値
- `<json>`内のすべての要素で構成される単一列、複数行の結果を返します。列の型は`Nullable<DOUBLE>`です。
- `<json>`がNULLまたは空の配列（要素数が0）の場合、0行が返されます。
- JSON配列内の要素がDOUBLE型でない場合、関数はそれらをDOUBLEに変換しようとします。DOUBLEに変換できない要素はNULLに変換されます。型変換ルールについては、[JSON タイプ Conversion](../../basic-element/sql-data-types/conversion/json-conversion.md)を参照してください。

## 例
0. データを準備する

    ```sql
    create table example(
        id int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 通常パラメータ

    ```sql
    select * from example lateral view explode_json_array_double('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | id   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. DOUBLE型

    ```sql
    select * from example
        lateral view 
        explode_json_array_double('[123.445, 9223372036854775807.0, 9223372036854775808.0, -9223372036854775808.0, -9223372036854775809.0]') t2 as c;
    ```
    ```text
    +------+------------------------+
    | id   | c                      |
    +------+------------------------+
    |    1 |                123.445 |
    |    1 |  9.223372036854776e+18 |
    |    1 |  9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    +------+------------------------+
    ```
3. 空の配列

    ```sql
    select * from example lateral view explode_json_array_double('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULLパラメータ

    ```sql
    select * from example lateral view explode_json_array_double(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 非配列パラメータ

    ```sql
    select * from example lateral view explode_json_array_double('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
