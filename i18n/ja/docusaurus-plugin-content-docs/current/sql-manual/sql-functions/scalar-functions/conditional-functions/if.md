---
{
    "title": "IF",
    "language": "ja",
    "description": "式 <condition> が true の場合は <valuetrue> を、それ以外の場合は <valuefalseornull> を返します。"
}
---

## 説明

式 `<condition>` が true の場合は `<value_true>` を、それ以外の場合は `<value_false_or_null>` を返します。
戻り値の型: `<value_true>` 式の結果の型。

## 構文

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```
## パラメータ
- `<condition>`: 条件が true かを判定する Boolean 型の式。
- `<value_true>`: `<condition>` が true の場合に返す値。
- `<value_false_or_null>`: `<condition>` が false または NULL の場合に返す値。

## 例
0. データの準備
    ```sql
    create table test_if(
        user_id int
    ) properties('replication_num' = '1');
    insert into test_if values(1),(2),(null);
    ```
1. 例 1
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
    > 二番目の引数 "2" は、三番目の引数 "3.14" の型（Decimal）に変換されます。

3. NULL 引数
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
