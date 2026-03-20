---
{
  "title": "IF",
  "description": "条件がtrueの場合はvalueTrueを返し、それ以外の場合はvalueFalseOrNullを返します。",
  "language": "ja"
}
---
## 説明

条件がtrueの場合は`valueTrue`を返し、そうでなければ`valueFalseOrNull`を返します。戻り値の型は`valueTrue`/`valueFalseOrNull`式の結果によって決定されます。

## 構文

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```
## パラメータ

| Parameter               | デスクリプション                                                  |
|-------------------------|--------------------------------------------------------------|
| `<condition>`           | 評価するブール条件。                           |
| `<value_true>`          | `<condition>`がtrueと評価された場合に返す値。      |
| `<value_false_or_null>` | `<condition>`がfalseと評価された場合に返す値。     |

## Return Value

IF式の結果：
- 条件がtrueの場合、`valueTrue`を返します。
- 条件がfalseの場合、`valueFalseOrNull`を返します。

## Examples

```sql
SELECT user_id, IF(user_id = 1, 'true', 'false') AS test_if FROM test;
```
```text
+---------+---------+
| user_id | test_if |
+---------+---------+
| 1       | true    |
| 2       | false   |
+---------+---------+
```
