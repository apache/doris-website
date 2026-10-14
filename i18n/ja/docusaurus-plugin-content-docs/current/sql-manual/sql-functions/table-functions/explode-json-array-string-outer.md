---
{
    "title": "EXPLODE_JSON_ARRAY_STRING_OUTER",
    "language": "ja",
    "description": "explodejsonarraystringouter テーブル関数は JSON 配列を受け取ります。"
}
---

## 説明
`explode_json_array_string_outer` テーブル関数は JSON 配列を受け取ります。内部では JSON 配列を配列型に変換し、`explode_outer` 関数を呼び出して処理します。動作は `explode_outer(cast(<json_array> as Array<STRING>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。

## 構文
```sql
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```

## パラメータ
- `<json>` JSON 型。内容は配列である必要があります。

## 戻り値
- `<json>` のすべての要素を、単一列の複数行として返します。列の型は `Nullable<STRING>` です。
- `<json>` が NULL または空の配列（要素数が 0）の場合、NULL を含む 1 行を返します。
- JSON 配列の要素が STRING 型でない場合、STRING への変換を試みます。STRING に変換できない要素は NULL に変換されます。型変換の規則については、[JSON 型変換](../../basic-element/sql-data-types/conversion/json-conversion.md)を参照してください。

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
3. NULL 引数
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
4. 配列以外の引数
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
