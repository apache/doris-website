---
{
    "title": "EXPLODE_MAP",
    "language": "ja",
    "description": "explode_map テーブル関数は MAP 型の値を受け取り、マップをキーと値のペアを含む複数の行に展開します。"
}
---

## 説明
`explode_map` テーブル関数は MAP 型の値を受け取り、マップを複数の行に展開します。各行にはキーと値のペアが含まれます。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。

## 構文
```sql
EXPLODE_MAP(<map>)
```

## パラメータ
- `<map>` MAP 型。

## 戻り値
- `<map>` のすべての要素からなる単一列・複数行の結果を返します。列の型は `Nullable<Struct<K, V>>` です。
- `<map>` が NULL または空の場合は、0 行を返します。

## 使用例
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
    select  * from example lateral view explode_map(map("k", "v", "k2", 123, null, null)) t2 as c;
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
    select  * from example lateral view explode_map(map("k", "v", "k2", 123, null, null)) t2 as k, v;
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
4. NULL 引数
    ```sql
    select  * from example lateral view explode_map(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
