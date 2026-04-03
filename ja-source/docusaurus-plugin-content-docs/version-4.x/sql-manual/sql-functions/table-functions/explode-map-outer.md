---
{
  "title": "EXPLODE_MAP_OUTER",
  "description": "explodemapouter table関数は map 型を受け取り、そのマップを複数の行に展開し、各行にキーと値のペアを含めます。",
  "language": "ja"
}
---
## 説明
`explode_map_outer` table関数はmap型を受け取り、そのmapを複数の行に展開します。各行にはキーと値のペアが含まれます。
この関数は[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_MAP_OUTER(<map>)
```
## パラメータ
- `<map>` MAP型。

## Return Value
- `<map>`内のすべての要素で構成された単一列、複数行の結果を返します。列の型は`Nullable<Struct<K, V>>`です。
- `<map>`がNULLまたは空の場合、NULLを含む1行が返されます。

## Examples
0. データを準備

    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 通常パラメータ

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
2. キー・バリューペアを個別の列に展開する

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
4. NULLパラメータ

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
