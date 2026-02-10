---
{
    "title": "IF",
    "language": "zh-CN",
    "description": "如果表达式 <condition> 成立，则返回 <valuetrue>；否则返回 <valuefalseornull>。 返回类型：<valuetrue> 表达式的结果类型。"
}
---

## 描述

如果表达式 `<condition>` 成立，则返回 `<value_true>`；否则返回 `<value_false_or_null>`。  
返回类型：`<value_true>` 表达式的结果类型。

## 语法

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```
## 参数
- `<condition>` Boolean 类型，用于判断条件是否成立的表达式。
- `<value_true>` 当 `<condition>` 为真时返回的值。
- `<value_false_or_null>` 当 `<condition>` 为假或者 NULl 时返回的值。

## 举例
0. 准备数据
    ```sql
    create table test_if(
        user_id int
    ) properties('replication_num' = '1');
    insert into test_if values(1),(2),(null);
    ```
1. 示例 1
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
2. 类型转换
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
    > 第二个参数 "2" 被转换为第三个参数 "3.14" 的类型（Decimal）。

3. NULL 参数
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
