---
{
    "title": "EXPLODE_JSON_ARRAY_JSON",
    "language": "ja",
    "description": "explodejsonarrayjson テーブル関数は JSON 配列を受け取ります。"
}
---

## 概要
`explode_json_array_json` テーブル関数は JSON 配列を受け取ります。内部では、JSON 配列を配列型に変換し、`explode_outer` 関数を呼び出して処理します。動作は `explode(cast(<json_array> as Array<JSON>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。

## 構文
```sql
EXPLODE_JSON_ARRAY_JSON(<json>)
```

## パラメータ
- `<json>` JSON 型で、内容は配列である必要があります。

## 戻り値
- `<json>` のすべての要素からなる、単一列・複数行の結果を返します。列の型は `Nullable<JSON>` です。
- `<json>` が NULL または空の配列（要素数が 0）の場合、0 行を返します。

## 使用例
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
    select * from example lateral view explode_json_array_json('[4, "abc", {"key": "value"}, 5.23, null]') t2 as c;
    ```
    ```text
    +------+-----------------+
    | k1   | c               |
    +------+-----------------+
    |    1 | 4               |
    |    1 | NULL            |
    |    1 | {"key":"value"} |
    |    1 | 5.23            |
    |    1 | NULL            |
    +------+-----------------+
    ```
2. 空の配列
    ```sql
    select * from example lateral view explode_json_array_json('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL 引数
    ```sql
    select * from example lateral view explode_json_array_json(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 配列ではない引数
    ```sql
    select * from example lateral view explode_json_array_json('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
