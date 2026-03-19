---
{
  "title": "POSEXPLODE",
  "language": "ja",
  "description": "posexplode テーブル関数は <array> カラムを複数の行に展開し、位置を示すカラムを追加して、STRUCT 型を返します。"
}
---
## 説明
`posexplode`テーブル関数は`<array>`列を複数の行に展開し、位置を示す列を追加して、[`STRUCT`](../../basic-element/sql-data-types/semi-structured/STRUCT.md)型を返します。
Lateral Viewと組み合わせて使用する必要があり、複数のLateral Viewをサポートします。
`posexplode`と[`posexplode_outer`](./posexplode-outer.md)の主な違いは、null値の処理方法です。

## 構文

```sql
POSEXPLODE(<array>)
```
## パラメータ
- `<array>` 配列型、NULLはサポートされていません。

## 戻り値
- 単一列、複数行のSTRUCTデータを返します。STRUCTは2つの列で構成されます：
1. 0から始まり1ずつ増加し、n – 1まで続く整数の列。nは結果行数を表します。
2. `<array>`のすべての要素を含む列。

- `<array>`がNULLまたは空の配列（要素数が0）の場合、0行が返されます。

## 使用上の注意
1. `<array>`はNULLまたは他の型にすることはできません。そうでなければエラーが報告されます。

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
1. 通常パラメータ

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
3. NULLパラメータ

    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode(NULL) t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got NULL
    ```
4. 非配列パラメータ

    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got VARCHAR(3)
    ```
