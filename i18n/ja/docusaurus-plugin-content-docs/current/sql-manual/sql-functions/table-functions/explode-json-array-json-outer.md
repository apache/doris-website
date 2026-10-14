---
{
    "title": "EXPLODE_JSON_ARRAY_JSON_OUTER",
    "language": "ja",
    "description": "explodejsonarrayjsonouter テーブル関数は JSON 配列を受け取ります。"
}
---

## 説明
`explode_json_array_json_outer` テーブル関数は JSON 配列を受け取ります。実装では、JSON 配列を配列型に変換してから `explode_outer` 関数で処理します。動作は `explode_outer(cast(<json_array> as Array<JSON>))` と同等です。
[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用してください。

## 構文
```sql
EXPLODE_JSON_ARRAY_JSON_OUTER(<json>)
```

## パラメータ
- `<json>` JSON 型。内容は配列である必要があります。

## 戻り値
- `<json>` のすべての要素からなる、単一列で複数行の結果を返します。列の型は `Nullable<JSON>` です。
- `<json>` が NULL または空の配列（要素数が 0）の場合、NULL を含む 1 行を返します。

## 使用例
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
3. NULL パラメータ
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
4. 配列以外のパラメータ
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
