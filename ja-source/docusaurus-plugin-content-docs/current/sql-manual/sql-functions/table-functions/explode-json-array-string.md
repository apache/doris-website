---
{
  "title": "EXPLODE_JSON_ARRAY_STRING",
  "language": "ja",
  "description": "explodejsonarraystring テーブル関数は JSON 配列を受け入れます。"
}
---
## 説明
`explode_json_array_string`テーブル関数はJSON配列を受け取ります。その実装ロジックは、JSON配列をarray型に変換してから`explode`関数を呼び出して処理することです。この動作は`explode(cast(<json_array> as Array<STRING>))`と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md)と組み合わせて使用する必要があります。

## 構文

```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
```
## パラメータ
- `<json>` JSON型、内容は配列である必要があります。

## 戻り値
- `<json>` 内のすべての要素で構成される単一列、複数行の結果を返します。列の型は `Nullable<STRING>` です。
- `<json>` が NULL または空の配列（要素数が 0）の場合、0 行が返されます。
- JSON 配列内の要素が STRING 型でない場合、関数はそれらを STRING に変換しようとします。STRING への変換が失敗した場合、その要素は NULL に変換されます。型変換規則については、[JSON Type Conversion](../../basic-element/sql-data-types/conversion/json-conversion.md) を参照してください。

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
    select * from example lateral view explode_json_array_string('[4, "5", "abc", 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | 4    |
    |    1 | 5    |
    |    1 | abc  |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. 空の配列

    ```sql
    select * from example lateral view explode_json_array_string('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULLパラメータ

    ```sql
    select * from example lateral view explode_json_array_string(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. 非配列パラメータ

    ```sql
    select * from example lateral view explode_json_array_string('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
