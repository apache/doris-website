---
{
    "title": "EXPLODE_MAP_OUTER",
    "language": "ja",
    "description": "explode_map_outer テーブル関数は MAP 型の値を受け取り、マップをキーと値のペアを含む複数の行に展開します。"
}
---

## 説明
`explode_map_outer` テーブル関数は MAP 型の値を受け取り、マップをキーと値のペアを含む複数の行に展開します。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) とともに使用します。

## 構文
```sql
EXPLODE_MAP_OUTER(<map>)
```

## パラメータ
- `<map>` MAP 型。

## 戻り値
- `<map>` のすべての要素からなる、複数行の単一列の結果を返します。列の型は `Nullable<Struct<K, V>>` です。
- `<map>` が NULL または空の場合、NULL を含む 1 行を返します。

## 例
0. データを準備する
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
2. キーと値のペアを別々の列に展開する
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
    select  * from example lateral view explode_map_outer(map()) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. NULL 引数
    ```sql
    select  * from example lateral view explode_map_outer(cast('ab' as map<string,string>)) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
