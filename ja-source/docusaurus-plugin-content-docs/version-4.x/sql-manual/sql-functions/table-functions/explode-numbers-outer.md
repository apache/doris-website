---
{
  "title": "EXPLODE_NUMBERS_OUTER",
  "description": "explodenumbersouter関数は整数を受け取り、範囲内の各数値を個別の行にマップします。",
  "language": "ja"
}
---
## 説明
`explode_numbers_outer`関数は整数を受け取り、範囲内の各数値を別々の行にマッピングします。この関数は[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用し、ネストされたデータ構造を標準的なフラットtable形式に展開する必要があります。`explode_numbers_outer`と[`explode_numbers`](./explode-numbers.md)の主な違いは、null値の処理方法です。

## 構文

```sql
EXPLODE_NUMBERS_OUTER(<int>)
```
## パラメータ
- `<int>` Integer型

## 戻り値
- 整数列`[0, n)`を返します。列型は`Nullable<INT>`です。
- `<int>`がNULL、0、または負の値の場合、NULLを含む1行が返されます。

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
2. パラメータ 0

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
3. NULLパラメータ

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
4. 負のパラメータ

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
