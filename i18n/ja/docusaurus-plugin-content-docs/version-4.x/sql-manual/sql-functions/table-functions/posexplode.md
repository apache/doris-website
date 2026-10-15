---
{
    "title": "POSEXPLODE",
    "language": "ja",
    "description": "posexplode テーブル関数は <array> 列を複数の行に展開し、位置を示す列を追加して、STRUCT 型を返します。"
}
---

## 説明
`posexplode` テーブル関数は `<array>` 列を複数の行に展開し、位置を示す列を追加して、[`STRUCT`](../../basic-element/sql-data-types/semi-structured/STRUCT.md) 型を返します。
Lateral View と組み合わせて使用します。複数の Lateral View に対応しています。
`posexplode` と [`posexplode_outer`](./posexplode-outer.md) の主な違いは、null 値の扱いです。

## 構文
```sql
POSEXPLODE(<array>)
```

## パラメータ
- `<array>` 配列型。NULL はサポートされません。

## 戻り値
- 単一列、複数行の STRUCT データを返します。STRUCT は次の二つの列で構成されます。
1. 0 から始まり、1 ずつ増加して n – 1 まで続く整数の列。n は結果の行数を表します。
2. `<array>` のすべての要素を含む列。

- `<array>` が NULL または空の配列（要素数が 0）の場合、0 行を返します。

## 使用上の注意
1. `<array>` には NULL や配列型以外の値を指定できません。指定するとエラーが発生します。

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
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+-----------------------+
    | k1   | c                     |
    +------+-----------------------+
    |    1 | {"pos":0, "col":1}    |
    |    1 | {"pos":1, "col":2}    |
    |    1 | {"pos":2, "col":null} |
    |    1 | {"pos":3, "col":4}    |
    |    1 | {"pos":4, "col":5}    |
    +------+-----------------------+
    ```
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as pos, value;
    ```
    ```text
    +------+------+-------+
    | k1   | pos  | value |
    +------+------+-------+
    |    1 |    0 |     1 |
    |    1 |    1 |     2 |
    |    1 |    2 |  NULL |
    |    1 |    3 |     4 |
    |    1 |    4 |     5 |
    +------+------+-------+
    ```
2. 空の配列
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode([]) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL パラメータ
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode(NULL) t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got NULL
    ```
4. 配列型以外のパラメータ
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got VARCHAR(3)
    ```