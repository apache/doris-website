---
{
  "title": "EXPLODE_NUMBERS",
  "language": "ja",
  "description": "explodenumbers関数は整数を受け取り、範囲内の各数値を別々の行にマッピングします。"
}
---
## 説明
`explode_numbers`関数は整数を受け取り、範囲内の各数値を別々の行にマップします。この関数は[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用し、ネストされたデータ構造を標準的なフラットテーブル形式に展開するために使用します。`explode_numbers`と[`explode_numbers_outer`](./explode-numbers-outer.md)の主な違いは、null値の処理方法です。

## 構文

```sql
EXPLODE_NUMBERS(<int>)
```
## パラメータ
- `<int>` 整数型

## 戻り値
- 整数カラム `[0, n)` を返し、カラム型は `INT` です。
- `<int>` が NULL または 0 または負の値の場合、0行が返されます。

## 例
0. データを準備

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
    select  * from example lateral view explode_numbers(10) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    0 |
    |    1 |    1 |
    |    1 |    2 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |    7 |
    |    1 |    8 |
    |    1 |    9 |
    +------+------+
    ```
2. パラメータ 0

    ```sql
    select  * from example lateral view explode_numbers(0) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULLパラメータ

    ```sql
    select  * from example lateral view explode_numbers(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 負のパラメータ

    ```sql
    select  * from example lateral view explode_numbers(-1) t2 as c;
    ```
    ```text
    Empty set (0.04 sec)
    ```
