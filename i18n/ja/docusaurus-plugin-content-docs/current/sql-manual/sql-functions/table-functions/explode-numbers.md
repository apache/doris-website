---
{
    "title": "EXPLODE_NUMBERS",
    "language": "ja",
    "description": "explode_numbers 関数は整数を受け取り、指定された範囲内の各数値を別々の行に展開します。"
}
---

## 説明
`explode_numbers` 関数は整数を受け取り、指定された範囲内の各数値を別々の行に展開します。ネストされたデータ構造を通常のフラットなテーブル形式に変換するために、[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。`explode_numbers` と [`explode_numbers_outer`](./explode-numbers-outer.md) の主な違いは、NULL 値の処理方法です。

## 構文
```sql
EXPLODE_NUMBERS(<int>)
```

## 引数
- `<int>` 整数型

## 戻り値
- `[0, n)` の整数列を返します。列の型は `INT` です。
- `<int>` が NULL、0、または負の数の場合、0 行を返します。


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
2. 引数が 0 の場合
    ```sql
    select  * from example lateral view explode_numbers(0) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. 引数が NULL の場合
    ```sql
    select  * from example lateral view explode_numbers(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 引数が負の数の場合
    ```sql
    select  * from example lateral view explode_numbers(-1) t2 as c;
    ```
    ```text
    Empty set (0.04 sec)
    ```
