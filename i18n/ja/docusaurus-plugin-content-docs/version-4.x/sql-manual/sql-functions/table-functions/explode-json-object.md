---
{
    "title": "EXPLODE_JSON_OBJECT",
    "language": "ja",
    "description": "explodejsonobject テーブル関数は JSON オブジェクトを複数の行に展開し、各行にキーと値のペアを含めます。"
}
---

# EXPLODE_JSON_OBJECT
## 説明
`explode_json_object` テーブル関数は JSON オブジェクトを複数の行に展開し、各行にキーと値のペアを含めます。
JSON オブジェクトをクエリで扱いやすい形式に変換する際によく使用します。この関数がサポートするのは、要素を含む JSON オブジェクトのみです。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用してください。

## 構文
```sql
EXPLODE_JSON_OBJECT(<json>)
```

## パラメータ
- `<json>` JSON 型。内容は JSON オブジェクトである必要があります。

## 戻り値
- `<json>` のすべての要素からなる、単一列で複数行の結果を返します。列の型は `Nullable<Struct<String, JSON>>` です。
- `<json>` が NULL、または JSON オブジェクトではない場合（配列 `[]` など）、0 行を返します。
- `<json>` が空のオブジェクト（`{}` など）の場合、0 行を返します。

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
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as c;
    ```
    ```text
    +------+------------------------------+
    | k1   | c                            |
    +------+------------------------------+
    |    1 | {"col1":"k1", "col2":""v1""} |
    |    1 | {"col1":"k2", "col2":"123"}  |
    +------+------------------------------+
    ```
2. キーと値のペアを別々の列に展開
    ```sql
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k1   | "v1" |
    |    1 | k2   | 123  |
    +------+------+------+
    ```
    > `v` の型は JSON です。
3. 空のオブジェクト
    ```sql
    select  * from example lateral view explode_json_object('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL 引数
    ```sql
    select  * from example lateral view explode_json_object(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. オブジェクト以外の引数
    ```sql
    select  * from example lateral view explode_json_object('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
