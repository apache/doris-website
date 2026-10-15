---
{
    "title": "EXPLODE_JSON_ARRAY_STRING",
    "language": "ja",
    "description": "explodejsonarraystring テーブル関数は JSON 配列を受け取ります。"
}
---

## 説明
`explode_json_array_string` テーブル関数は JSON 配列を受け取ります。実装では、JSON 配列を配列型に変換してから `explode_outer` 関数で処理します。動作は `explode(cast(<json_array> as Array<STRING>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。

## 構文
```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
```

## 引数
- `<json>` JSON 型。内容は配列である必要があります。

## 戻り値
- `<json>` のすべての要素からなる、単一列、複数行の結果を返します。列の型は `Nullable<STRING>` です。
- `<json>` が NULL または空の配列（要素数が 0）の場合、0 行を返します。
- JSON 配列の要素が STRING 型でない場合、STRING 型への変換を試みます。STRING 型に変換できない要素は NULL になります。型変換の規則については、[JSON の型変換](../../basic-element/sql-data-types/conversion/json-conversion.md)を参照してください。

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
    select * from example lateral view explode_json_array_string('[4, "5", "abc", 5.23, null]') t2 as c;
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
    select * from example lateral view explode_json_array_string('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 引数
    ```sql
    select * from example lateral view explode_json_array_string(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 配列ではない引数
    ```sql
    select * from example lateral view explode_json_array_string('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
