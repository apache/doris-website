---
{
  "title": "EXPLODE_MAP",
  "language": "ja",
  "description": "explodemap テーブル関数は map 型を受け取り、map を複数の行に展開し、各行にはキー値ペアが含まれます。"
}
---
## 説明
`explode_map`テーブル関数はマップ型を受け取り、マップを複数の行に展開します。各行にはキー値ペアが含まれます。
[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_MAP(<map>)
```
## パラメータ
- `<map>` MAP型。

## 戻り値
- `<map>`内のすべての要素で構成された単一列、複数行の結果を返します。列の型は`Nullable<Struct<K, V>>`です。
- `<map>`がNULLまたは空の場合、0行が返されます。

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
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as c;
    ```
    ```text
    +------+-----------------------------+
    | k1   | c                           |
    +------+-----------------------------+
    |    1 | {"col1":"k", "col2":"v"}    |
    |    1 | {"col1":"k2", "col2":"123"} |
    |    1 | {"col1":null, "col2":null}  |
    +------+-----------------------------+
    ```
2. キー値ペアを個別の列に展開する

    ```sql
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k    | v    |
    |    1 | k2   | 123  |
    |    1 | NULL | NULL |
    +------+------+------+
    ```
3. 空のオブジェクト

    ```sql
    select  * from example lateral view explode_map(map()) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULLパラメータ

    ```sql
    select  * from example lateral view explode_map(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
