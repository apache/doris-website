---
{
  "title": "EXPLODE",
  "description": "explode関数は1つ以上の配列を受け取り、配列の各要素を個別の行にマッピングします。",
  "language": "ja"
}
---
## 説明
`explode`関数は1つ以上の配列を受け取り、配列の各要素を別々の行にマッピングします。ネストされたデータ構造を標準的なフラットtable形式に平坦化するため、[`LATERAL VIEW`](../../../query-data/lateral-view.md)と一緒に使用する必要があります。`explode`と[`explode_outer`](./explode-outer.md)の主な違いは、null値の処理方法です。

## 構文

```sql
EXPLODE(<array>[, ...])
```
## 可変長パラメータ
- `<array>` 配列型。

## 戻り値
- `<array>`内のすべての要素で構成される単一列、複数行の結果を返します。
- `<array>`がNULLまたは空の配列（要素数が0）の場合、0行が返されます。

## 使用上の注意
1. `<array>`パラメータが[`Array`](../../basic-element/sql-data-types/semi-structured/ARRAY.md)型でない場合、エラーが報告されます。
2. 複数の配列パラメータがある場合、展開される行数は最も多くの要素を持つ配列によって決定されます。要素数が少ない配列はNULLで埋められます。

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
    select  * from example lateral view explode([1, 2, null, 4, 5]) t2 as c;
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
2. 複数のパラメータ

    ```sql
    select  * from example lateral view explode([], [1, 2, null, 4, 5], ["ab", "cd", "ef"], [null, null, 1, 2, 3, 4, 5]) t2 as c0, c1, c2, c3;
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
> 展開後に最も多くの行を持つ配列は`[null, null, 1, 2, 3, 4, 5]` (c3)で、7行あります。したがって、最終結果は7行となり、他の3つの配列(c0, c1, c2)は不足する行についてNULLでパディングされます。
3. 空の配列

    ```sql
    select  * from example lateral view explode([]) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULLパラメータ

    ```sql
    select  * from example lateral view explode(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 非配列パラメータ

    ```sql
    select  * from example lateral view explode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode(VARCHAR(3))
    ```
