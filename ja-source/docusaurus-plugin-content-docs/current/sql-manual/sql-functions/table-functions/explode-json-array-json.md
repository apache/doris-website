---
{
  "title": "EXPLODE_JSON_ARRAY_JSON",
  "language": "ja",
  "description": "explodejsonarrayjson テーブル関数は JSON 配列を受け取ります。"
}
---
## 説明
`explode_json_array_json`テーブル関数はJSON配列を受け取ります。この実装ロジックは、JSON配列を配列型に変換してから`explode`関数を呼び出して処理することです。この動作は`explode(cast(<json_array> as Array<JSON>))`と等価です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_JSON_ARRAY_JSON(<json>)
```
## パラメータ
- `<json>` JSON型、内容は配列である必要があります。

## 戻り値
- `<json>`内のすべての要素で構成される単一列、複数行の結果を返します。列の型は`Nullable<JSON>`です。
- `<json>`がNULLまたは空の配列（要素数が0）の場合、0行が返されます。

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
    select * from example lateral view explode_json_array_json('[4, "abc", {"key": "value"}, 5.23, null]') t2 as c;
    ```
    ```text
    +------+-----------------+
    | k1   | c               |
    +------+-----------------+
    |    1 | 4               |
    |    1 | NULL            |
    |    1 | {"key":"value"} |
    |    1 | 5.23            |
    |    1 | NULL            |
    +------+-----------------+
    ```
2. 空の配列

    ```sql
    select * from example lateral view explode_json_array_json('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL パラメータ

    ```sql
    select * from example lateral view explode_json_array_json(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 非配列パラメータ

    ```sql
    select * from example lateral view explode_json_array_json('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
