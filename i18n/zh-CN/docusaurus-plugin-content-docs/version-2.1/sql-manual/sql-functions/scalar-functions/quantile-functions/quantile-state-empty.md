---
{
    "title": "QUANTILE_STATE_EMPTY",
    "language": "zh-CN",
    "description": "返回一个空的 quantilestate 类型列。"
}
---

## Description

返回一个空的 `quantile_state` 类型列。

## Syntax

```sql
QUANTILE_STATE_EMPTY()
```

## Return value

一个空的 `quantile_state` 类型列。

## Example

```sql
select quantile_percent(quantile_union(quantile_state_empty()), 0)
```

结果为

```text
+-------------------------------------------------------------+
| quantile_percent(quantile_union(quantile_state_empty()), 0) |
+-------------------------------------------------------------+
|                                                        NULL |
+-------------------------------------------------------------+
```
