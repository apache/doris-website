---
{
    "title": "EXPLODE_JSON_ARRAY_DOUBLE",
    "language": "ja",
    "description": "explodejsonarraydouble テーブル関数は JSON 配列を受け取ります。"
}
---

## 説明
`explode_json_array_double` テーブル関数は JSON 配列を受け取ります。実装では、JSON 配列を配列型に変換してから、`explode_outer` 関数を呼び出して処理します。動作は `explode(cast(<json_array> as Array<DOUBLE>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用してください。

## 構文
```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
```

## パラメータ
- `<json>` JSON 型。内容は配列である必要があります。

## 戻り値
- `<json>` のすべての要素からなる、単一列で複数行の結果を返します。列の型は `Nullable<DOUBLE>` です。
- `<json>` が NULL または空の配列（要素数が 0）の場合、0 行を返します。
- JSON 配列の要素が DOUBLE 型でない場合、DOUBLE 型への変換を試みます。DOUBLE 型に変換できない要素は NULL に変換されます。型変換の規則については、[JSON 型変換](../../basic-element/sql-data-types/conversion/json-conversion.md)を参照してください。

## 使用例
0. データの準備
    ```sql
    create table example(
        id int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. 通常のパラメータ
    ```sql
    select * from example lateral view explode_json_array_double('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | id   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. DOUBLE 型
    ```sql
    select * from example
        lateral view 
        explode_json_array_double('[123.445, 9223372036854775807.0, 9223372036854775808.0, -9223372036854775808.0, -9223372036854775809.0]') t2 as c;
    ```
    ```text
    +------+------------------------+
    | id   | c                      |
    +------+------------------------+
    |    1 |                123.445 |
    |    1 |  9.223372036854776e+18 |
    |    1 |  9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    +------+------------------------+
    ```
3. 空の配列
    ```sql
    select * from example lateral view explode_json_array_double('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL パラメータ
    ```sql
    select * from example lateral view explode_json_array_double(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. 配列以外のパラメータ
    ```sql
    select * from example lateral view explode_json_array_double('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
