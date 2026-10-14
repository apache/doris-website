---
{
    "title": "EXPLODE_SPLIT_OUTER",
    "language": "ja",
    "description": "explode_split_outer テーブル関数は、指定した区切り文字で文字列を複数の部分文字列に分割し、それぞれを個別の行に展開します。"
}
---

## 説明
`explode_split_outer` テーブル関数は、指定した区切り文字で文字列を複数の部分文字列に分割し、各部分文字列を個別の行に展開します。
入れ子になったデータ構造を通常のフラットなテーブル形式に展開するには、[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。
`explode_split_outer` と [`explode_split`](./explode-split.md) の主な違いは、NULL 値の扱いです。

## 構文
```sql
EXPLODE_SPLIT_OUTER(<str>, <delimiter>)
```

## パラメータ
- `<str>` String 型。分割する文字列。
- `<delimiter>` String 型。区切り文字。

## 戻り値
- 分割された部分文字列からなる列を返します。列の型は String です。

## 使用上の注意
1. `<str>` が NULL の場合、NULL を含む 1 行を返します。
2. `<str>` が空文字列（""）の場合、または分割できない場合、1 行を返します。
3. `<delimiter>` が NULL の場合、NULL を含む 1 行を返します。
4. `<delimiter>` が空文字列（""）の場合、`<str>` をバイト単位で分割します（[`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md)）。

## 例
0. データを準備する
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
    select  * from example lateral view explode_split_outer("ab,cd,ef", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | ab   |
    |    1 | cd   |
    |    1 | ef   |
    +------+------+
    ```
2. 空文字列および分割できない場合
    ```sql
    select  * from example lateral view explode_split_outer("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from example lateral view explode_split_outer("abc", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | abc  |
    +------+------+
    ```
3. NULL パラメータ
    ```sql
    select  * from example lateral view explode_split_outer(NULL, ',') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 空の区切り文字
    ```sql
    select  * from example lateral view explode_split_outer('abc', '') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | a    |
    |    1 | b    |
    |    1 | c    |
    +------+------+
    ```
5. 区切り文字が NULL の場合
    ```sql
    select  * from example lateral view explode_split_outer('abc', null) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
