---
{
  "title": "EXPLODE_SPLIT",
  "description": "explodesplit table関数は、指定された区切り文字に従って文字列を複数の部分文字列に分割するために使用されます。",
  "language": "ja"
}
---
## 説明
`explode_split`table関数は、指定された区切り文字に従って文字列を複数の部分文字列に分割し、各部分文字列を別々の行に展開するために使用されます。
ネストされたデータ構造を標準的なフラットtable形式に平坦化するために、[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用する必要があります。
`explode_split`と[`explode_split_outer`](./explode-split-outer.md)の主な違いは、null値の処理方法です。

## 構文

```sql
EXPLODE_SPLIT(<str>, <delimiter>)
```
## パラメータ
- `<str>` String型、分割される文字列。
- `<delimiter>` String型、区切り文字。

## 戻り値
- 分割されたサブ文字列で構成される列を返します。列の型はStringです。

## 使用上の注意
1. `<str>`がNULLの場合、0行が返されます。
2. `<str>`が空文字列（""）または分割できない場合、1行が返されます。
3. `<delimiter>`がNULLの場合、0行が返されます。
4. `<delimiter>`が空文字列（""）の場合、`<str>`はバイト単位で分割されます（[`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md)）。

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
1. 通常パラメータ

    ```sql
    select  * from example lateral view explode_split("ab,cd,ef", ",") t2 as c;
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
2. 空文字列と分割不可能なケース

    ```sql
    select  * from example lateral view explode_split("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from example lateral view explode_split("abc", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | abc  |
    +------+------+
    ```
3. NULLパラメータ

    ```sql
    select  * from example lateral view explode_split(NULL, ',') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 空の区切り文字

    ```sql
    select  * from example lateral view explode_split('abc', '') t2 as c;
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
5. Delimiterは NULL です

    ```sql
    select  * from example lateral view explode_split('abc', null) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
