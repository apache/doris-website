---
{
    "title": "QUANTILE_STATE_FROM_BASE64",
    "language": "zh-CN",
    "description": "将一个 base64 编码的字符串（通常由 QUANTILE_STATE_TO_BASE64 函数生成）转换为 QUANTILE_STATE 类型。如果输入字符串不合法或为 NULL，则返回 NULL。"
}
---

## 描述

将一个 base64 编码的字符串（通常由 `QUANTILE_STATE_TO_BASE64` 函数生成）转换为 QUANTILE_STATE 类型。如果输入字符串不合法或为 NULL，则返回 NULL。

## 语法

```sql
QUANTILE_STATE_FROM_BASE64(<input>)
```

## 参数

| 参数     | 说明                                                                     |
| -------- | ------------------------------------------------------------------------ |
| `<input>` | base64 编码的字符串，通常由 `QUANTILE_STATE_TO_BASE64` 函数生成。如果字符串不合法，则返回 NULL。 |

## 返回值
返回由 base64 编码解析后得到的 quantile_state参数，若字符串不合法，则返回 NULL。

## 示例

```sql
select
  quantile_state_to_base64(
    quantile_state_from_base64(
      quantile_state_to_base64(to_quantile_state(1.0, 2048))
    )
  ) = quantile_state_to_base64(to_quantile_state(1.0, 2048)) AS equal_test;
```
```text
+------------+
| equal_test |
+------------+
|          1 |
+------------+
```

```sql
select quantile_state_from_base64('not_base64!');
```

```text
+-------------------------------------------+
| quantile_state_from_base64('not_base64!') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

```sql
select quantile_state_from_base64(NULL);
```
```text
+----------------------------------+
| quantile_state_from_base64(NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
