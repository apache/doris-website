---
{
    "title": "EXPLODE_OUTER",
    "language": "ja",
    "description": "explode 関数は配列を受け取り、配列の各要素を個別の行に展開します。"
}
---

## 説明
`explode` 関数は配列を受け取り、配列の各要素を個別の行に展開します。[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用し、ネストされたデータ構造を通常のフラットなテーブル形式に変換します。`explode_outer` と [`explode`](./explode.md) の主な違いは、NULL 値の扱い方です。

## 構文
```sql
EXPLODE_OUTER(<array>[, ...])
```

## 可変長引数
- `<array>` 配列型。

## 戻り値
- `<array>` のすべての要素で構成される、単一列・複数行の結果を返します。
- `<array>` が NULL または空の配列（要素数が 0）の場合、NULL を含む 1 行を返します。

## 使用上の注意
1. `<array>` 引数の型が [`Array`](../../basic-element/sql-data-types/semi-structured/ARRAY.md) でない場合、エラーが報告されます。
2. 配列引数が複数ある場合、展開後の行数は要素数が最も多い配列によって決まります。要素数が少ない配列は NULL で埋められます。

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
    select  * from example lateral view explode_outer([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    1 |
    |    1 |    2 |
    |    1 | NULL |
    |    1 |    4 |
    |    1 |    5 |
    +------+------+
    ```
2. 複数の引数
    ```sql
    select  * from example lateral view explode_outer([], [1, 2, null, 4, 5], ["ab", "cd", "ef"], [null, null, 1, 2, 3, 4, 5]) t2 as c0, c1, c2, c3;
    ```
    ```text
    +------+------+------+------+------+
    | k1   | c0   | c1   | c2   | c3   |
    +------+------+------+------+------+
    |    1 | NULL |    1 | ab   | NULL |
    |    1 | NULL |    2 | cd   | NULL |
    |    1 | NULL | NULL | ef   |    1 |
    |    1 | NULL |    4 | NULL |    2 |
    |    1 | NULL |    5 | NULL |    3 |
    |    1 | NULL | NULL | NULL |    4 |
    |    1 | NULL | NULL | NULL |    5 |
    +------+------+------+------+------+
    ```
    > 展開後の行数が最も多い配列は `[null, null, 1, 2, 3, 4, 5]`（c3）で、7 行あります。そのため、最終結果は 7 行となり、ほかの三つの配列（c0、c1、c2）では不足する行が NULL で埋められます。
3. 空の配列
    ```sql
    select  * from example lateral view explode_outer([]) t2 as c;
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
    select  * from example lateral view explode_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
5. 配列以外の引数
    ```sql
    select  * from example lateral view explode_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_outer(VARCHAR(3))
    ```
