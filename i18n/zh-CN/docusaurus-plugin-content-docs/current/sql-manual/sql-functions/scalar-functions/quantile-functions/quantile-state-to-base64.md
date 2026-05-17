---
{
    "title": "QUANTILE_STATE_TO_BASE64",
    "language": "zh-CN",
    "description": "将一个 QUANTILE_STATE 类型转换为一个 base64 编码的字符串。"
}
---

## 描述

将一个 QUANTILE_STATE 类型转换为一个 base64 编码的字符串。

## 语法

```sql
QUANTILE_STATE_TO_BASE64(<quantile_state_input>)
```

## 参数

| 参数            | 说明        |
|---------------|-----------|
| `<quantile_state_input>` | QUANTILE_STATE 类型数据。 |

## 返回值

QUANTILE_STATE 基于 Base64 编码后的字符串。  
若 QUANTILE_STATE 为 `NULL` 时，返回值为 `NULL`。

::: note

由于不能保证 QUANTILE_STATE 中元素的顺序，因此不能保证相同内容的 QUANTILE_STATE 生成的 base64 结果始终相同，但可以保证 quantile_state_from_base64 解码后的 QUANTILE_STATE 相同。

:::

## 示例

```sql
select quantile_state_to_base64(quantile_state_empty());
```

```text
+--------------------------------------------------+
| quantile_state_to_base64(quantile_state_empty()) |
+--------------------------------------------------+
| AAAARQA=                                         |
+--------------------------------------------------+
```

```sql
select quantile_state_to_base64(to_quantile_state(1, 2048));
```

```text
+------------------------------------------------------+
| quantile_state_to_base64(to_quantile_state(1, 2048)) |
+------------------------------------------------------+
| AAAARQEAAAAAAADwPw==                                 |
+------------------------------------------------------+
```

```sql
select
  quantile_percent(
    quantile_union(
      quantile_state_from_base64(
        quantile_state_to_base64(to_quantile_state(1, 2048))
      )
    ),
    0.5
  ) as nested_test;
```

```text
+-------------+
| nested_test |
+-------------+
|           1 |
+-------------+
```

```sql
select quantile_state_to_base64(NULL);
```

```text
+--------------------------------+
| quantile_state_to_base64(NULL) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```
