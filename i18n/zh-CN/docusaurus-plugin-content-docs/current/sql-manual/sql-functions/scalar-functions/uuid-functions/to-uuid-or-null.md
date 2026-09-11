---
{
    "title": "TO_UUID_OR_NULL",
    "language": "zh-CN",
    "description": "将字符串转换为 UUID；格式无效或输入为 `NULL` 时返回 `NULL`。"
}
---

## 描述

将字符串转换为 UUID；格式无效或输入为 `NULL` 时返回 `NULL`。

## 别名

`toUUIDOrNull`.

## 使用说明

转换字符串的失败处理不受 `enable_strict_cast` 影响。

## 语法

```sql
TO_UUID_OR_NULL(<string>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<string>` | CHAR、VARCHAR 或 STRING 类型的字符串。接受带连字符的 36 字符标准格式或 32 位紧凑十六进制格式，不区分大小写；不接受花括号、首尾空格或其他连字符位置。 |

## 返回值

返回 `UUID` 类型。 输入为 `NULL` 或格式无效时返回 `NULL`。

## 示例

```sql
SELECT TO_UUID_OR_NULL('550E8400E29B41D4A716446655440000') AS parsed,
       TO_UUID_OR_NULL('bad') AS invalid,
       TO_UUID_OR_NULL(NULL) AS null_input;
```

```text
+--------------------------------------+---------+------------+
| parsed                               | invalid | null_input |
+--------------------------------------+---------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | NULL    | NULL       |
+--------------------------------------+---------+------------+
```

```sql
SELECT TO_UUID_OR_NULL('{550e8400-e29b-41d4-a716-446655440000}') AS braces,
       TO_UUID_OR_NULL(' 550e8400-e29b-41d4-a716-446655440000') AS leading_space;
```

```text
+--------+---------------+
| braces | leading_space |
+--------+---------------+
| NULL   | NULL          |
+--------+---------------+
```
