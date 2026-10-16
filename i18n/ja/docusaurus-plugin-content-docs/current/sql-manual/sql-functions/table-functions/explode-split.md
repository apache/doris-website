---
{
    "title": "EXPLODE_SPLIT",
    "language": "ja",
    "description": "explodesplit テーブル関数は、指定した区切り文字に従って文字列を複数の部分文字列に分割します。"
}
---

## 説明
`explode_split` テーブル関数は、指定した区切り文字に従って文字列を複数の部分文字列に分割し、各部分文字列を個別の行に展開します。
ネストしたデータ構造を標準的なフラットテーブル形式に展開するには、[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用します。
`explode_split` と [`explode_split_outer`](./explode-split-outer.md) の主な違いは、NULL 値の扱い方です。

## 構文
```sql
EXPLODE_SPLIT(<str>, <delimiter>)
```

## パラメータ
- `<str>` String 型。分割する文字列。
- `<delimiter>` String 型。区切り文字。

## 戻り値
- 分割された部分文字列からなる列を返します。列の型は String です。

## 使用上の注意
1. `<str>` が NULL の場合、0 行を返します。
2. `<str>` が空文字列（""）の場合、または分割できない場合、1 行を返します。
3. `<delimiter>` が NULL の場合、0 行を返します。
4. `<delimiter>` が空文字列（""）の場合、`<str>` をバイト単位で分割します（[`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md)）。

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
2. 空文字列と分割できない場合
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
3. NULL 引数
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
5. 区切り文字が NULL の場合
    ```sql
    select  * from example lateral view explode_split('abc', null) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
