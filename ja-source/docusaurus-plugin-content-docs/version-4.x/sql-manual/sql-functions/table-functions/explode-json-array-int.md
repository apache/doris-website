---
{
  "title": "EXPLODE_JSON_ARRAY_INT",
  "description": "explodejsonarrayint table関数は JSON 配列を受け取ります。",
  "language": "ja"
}
---
## 説明
`explode_json_array_int`table関数はJSON配列を受け取ります。その実装ロジックは、JSON配列を配列型に変換してから処理のために`explode`関数を呼び出すことです。この動作は`explode(cast(<json_array> as Array<BIGINT>))`と同等です。
この関数は[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_JSON_ARRAY_INT(<json>)
```
## パラメータ
- `<json>` JSON型、内容は配列である必要があります。

## 戻り値
- `<json>`内のすべての要素で構成される単一列、複数行の結果を返します。列の型は`Nullable<BIGINT>`です。
- `<json>`がNULLまたは空の配列（要素数が0）の場合、0行が返されます。
- JSON配列内の要素がINT型でない場合、関数はそれらをINTに変換を試みます。INTに変換できない要素はNULLに変換されます。型変換ルールについては、[JSON タイプ Conversion](../../basic-element/sql-data-types/conversion/json-conversion.md)を参照してください。

## 例
0. データの準備

    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 通常のパラメータ

    ```sql
    select * from example lateral view explode_json_array_int('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    5 |
    |    1 | NULL |
    +------+------+
    ```
2. Non-INT型

    ```sql
    select * from example 
        lateral view 
        explode_json_array_int('["abc", "123.4", 9223372036854775808.0, 9223372036854775295.999999]') t2 as c;
    ```
    ```text
    +------+---------------------+
    | k1   | c                   |
    +------+---------------------+
    |    1 |                NULL |
    |    1 |                 123 |
    |    1 |                NULL |
    |    1 | 9223372036854774784 |
    +------+---------------------+
    ```
> `9223372036854775808.0`は`BIGINT`の有効範囲を超えているため、NULLに変換されます。
    > 文字列"123.4"は123に変換されます。
    > 文字列"abc"はINTに変換できないため、結果はNULLになります。
3. 空の配列

    ```sql
    select * from example lateral view explode_json_array_int('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULLパラメータ

    ```sql
    select * from example lateral view explode_json_array_int(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 非配列パラメータ

    ```sql
    select * from example lateral view explode_json_array_int('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
