---
{
  "title": "EXPLODE_JSON_ARRAY_STRING_OUTER",
  "language": "ja",
  "description": "explodejsonarraystringouter テーブル関数は JSON 配列を受け取ります。"
}
---
## 説明
`explode_json_array_string_outer` テーブル関数は JSON 配列を受け取ります。その実装ロジックは、JSON 配列を配列型に変換してから処理のために `explode_outer` 関数を呼び出すことです。この動作は `explode_outer(cast(<json_array> as Array<STRING>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```
## パラメータ
- `<json>` JSON型、内容は配列である必要があります。

## 戻り値
- `<json>`内のすべての要素で構成された単一列、複数行の結果を返します。列の型は`Nullable<STRING>`です。
- `<json>`がNULLまたは空の配列（要素数が0）の場合、NULLを含む1行が返されます。
- JSON配列内の要素がSTRING型でない場合、関数はそれらをSTRINGに変換しようとします。STRINGへの変換が失敗した場合、その要素はNULLに変換されます。型変換規則については、[JSON Type Conversion](../../basic-element/sql-data-types/conversion/json-conversion.md)を参照してください。

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
    select * from example lateral view explode_json_array_string_outer('[4, "5", "abc", 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | 4    |
    |    1 | 5    |
    |    1 | abc  |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. 空の配列

    ```sql
    select * from example lateral view explode_json_array_string_outer('[]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. NULLパラメータ

    ```sql
    select * from example lateral view explode_json_array_string_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 非配列パラメータ

    ```sql
    select * from example lateral view explode_json_array_string_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
