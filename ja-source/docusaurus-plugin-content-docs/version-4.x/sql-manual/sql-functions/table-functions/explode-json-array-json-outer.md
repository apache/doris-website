---
{
  "title": "EXPLODE_JSON_ARRAY_JSON_OUTER",
  "description": "explodejsonarrayjsonouter table関数は JSON 配列を受け取ります。",
  "language": "ja"
}
---
## 説明
`explode_json_array_json_outer`table関数はJSON配列を受け取ります。その実装ロジックは、JSON配列を配列型に変換してから`explode_outer`関数を呼び出して処理することです。この動作は`explode_outer(cast(<json_array> as Array<JSON>))`と等価です。
この関数は[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_JSON_ARRAY_JSON_OUTER(<json>)
```
## パラメータ
- `<json>` JSON型、内容は配列である必要があります。

## 戻り値
- `<json>`内のすべての要素で構成される単一列、複数行の結果を返します。列の型は`Nullable<JSON>`です。
- `<json>`がNULLまたは空の配列（要素数が0）の場合、NULLを含む1行が返されます。

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
    select * from example lateral view explode_json_array_json_outer('[4, "abc", {"key": "value"}, 5.23, null]') t2 as c;
    ```
    ```text
    +------+-----------------+
    | k1   | c               |
    +------+-----------------+
    |    1 | 4               |
    |    1 | "abc"           |
    |    1 | {"key":"value"} |
    |    1 | 5.23            |
    |    1 | NULL            |
    +------+-----------------+
    ```
2. 空の配列

    ```sql
    select * from example lateral view explode_json_array_json_outer('[]') t2 as c;
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
    select * from example lateral view explode_json_array_json_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. 非配列パラメータ

    ```sql
    select * from example lateral view explode_json_array_json_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
