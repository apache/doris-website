---
{
    "title": "EXPLODE_JSON_ARRAY_INT",
    "language": "ja",
    "description": "explodejsonarrayint テーブル関数は JSON 配列を受け取ります。"
}
---

## 説明
`explode_json_array_int` テーブル関数は JSON 配列を受け取ります。内部では JSON 配列を配列型に変換し、`explode_outer` 関数を呼び出して処理します。動作は `explode(cast(<json_array> as Array<BIGINT>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。

## 構文
```sql
EXPLODE_JSON_ARRAY_INT(<json>)
```

## パラメータ
- `<json>` JSON 型。内容は配列である必要があります。

## 戻り値
- `<json>` のすべての要素を、単一列の複数行として返します。列の型は `Nullable<BIGINT>` です。
- `<json>` が NULL または空の配列（要素数が 0）の場合、0 行を返します。
- JSON 配列の要素が INT 型でない場合、INT への変換を試みます。INT に変換できない要素は NULL に変換されます。型変換の規則については、[JSON 型変換](../../basic-element/sql-data-types/conversion/json-conversion.md)を参照してください。

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
1. 通常の引数
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
2. INT 以外の型
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
    > `9223372036854775808.0` は `BIGINT` の有効範囲を超えるため、NULL に変換されます。
    > 文字列 "123.4" は 123 に変換されます。
    > 文字列 "abc" は INT に変換できないため、結果は NULL です。
3. 空の配列
    ```sql
    select * from example lateral view explode_json_array_int('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 引数
    ```sql
    select * from example lateral view explode_json_array_int(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 配列以外の引数
    ```sql
    select * from example lateral view explode_json_array_int('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
