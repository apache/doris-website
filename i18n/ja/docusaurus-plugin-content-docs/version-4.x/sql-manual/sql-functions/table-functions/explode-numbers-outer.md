---
{
    "title": "EXPLODE_NUMBERS_OUTER",
    "language": "ja",
    "description": "explode_numbers_outer 関数は整数を受け取り、指定された範囲内の各数値を個別の行に展開します。"
}
---

## 説明
`explode_numbers_outer` 関数は整数を受け取り、指定された範囲内の各数値を個別の行に展開します。ネストされたデータ構造を標準的なフラットテーブル形式に展開するために、[`LATERAL VIEW`](../../../query-data/lateral-view.md) とともに使用します。`explode_numbers_outer` と [`explode_numbers`](./explode-numbers.md) の主な違いは、NULL 値の扱いです。

## 構文
```sql
EXPLODE_NUMBERS_OUTER(<int>)
```

## パラメータ
- `<int>` 整数型の値

## 戻り値
- 整数の列 `[0, n)` を返します。列の型は `Nullable<INT>` です。
- `<int>` が NULL、0、または負の値の場合、NULL を含む 1 行を返します。

## 例
1. 通常のパラメータ
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(10) t2 as c;
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
2. パラメータが 0 の場合
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(0) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. パラメータが NULL の場合
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. パラメータが負の値の場合
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(-1) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
