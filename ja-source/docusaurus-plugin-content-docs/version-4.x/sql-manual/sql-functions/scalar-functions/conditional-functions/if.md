---
{
  "title": "IF",
  "description": "式<condition>がtrueの場合、<valuetrue>を返します。そうでなければ、<valuefalseornull>を返します。",
  "language": "ja"
}
---
## デスクリプション

式 `<condition>` が true の場合、`<value_true>` を返します。そうでない場合は、`<value_false_or_null>` を返します。
戻り値の型：`<value_true>` 式の結果型。

## Syntax

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```
## パラメータ
- `<condition>`: Boolean型、条件が真かどうかを判定するために使用される式。
- `<value_true>`: `<condition>`が真の場合に返される値。
- `<value_false_or_null>`: `<condition>`が偽またはNULLの場合に返される値。

## 例
0. データを準備する

    ```sql
    create table test_if(
        user_id int
    ) properties('replication_num' = '1');
    insert into test_if values(1),(2),(null);
    ```
1. 例1

    ```sql
    SELECT user_id, IF(user_id = 1, "true", "false") AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL | false   |
    |       1 | true    |
    |       2 | false   |
    +---------+---------+
    ```
2. 型変換

    ```sql
    SELECT user_id, IF(user_id = 1, 2, 3.14) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    3.14 |
    |       1 |    2.00 |
    |       2 |    3.14 |
    +---------+---------+
    ```
> 2番目の引数「2」は、3番目の引数「3.14」の型（Decimal）に変換されます。

3. NULL引数

    ```sql
    SELECT user_id, IF(user_id = 1, 2, NULL) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    NULL |
    |       1 |       2 |
    |       2 |    NULL |
    +---------+---------+
    ```
