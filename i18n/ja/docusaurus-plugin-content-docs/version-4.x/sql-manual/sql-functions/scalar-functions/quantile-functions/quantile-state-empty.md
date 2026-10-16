---
{
    "title": "QUANTILE_STATE_EMPTY",
    "language": "ja",
    "description": "空の quantilestate 型の列を返します。"
}
---

## 説明

空の `quantile_state` 型の列を返します。

## 構文

```sql
QUANTILE_STATE_EMPTY()
```

## 戻り値

空の `quantile_state` 型の列。

## 例

```sql
select quantile_percent(quantile_union(quantile_state_empty()), 0)
```

結果: 

```text
+-------------------------------------------------------------+
| quantile_percent(quantile_union(quantile_state_empty()), 0) |
+-------------------------------------------------------------+
|                                                        NULL |
+-------------------------------------------------------------+
```
