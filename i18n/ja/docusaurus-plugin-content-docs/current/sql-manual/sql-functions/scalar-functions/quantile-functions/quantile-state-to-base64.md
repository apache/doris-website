---
{
    "title": "QUANTILE_STATE_TO_BASE64",
    "language": "ja"
}
---

## 説明

QUANTILE_STATE 型の値を Base64 でエンコードされた文字列に変換します。

## 構文

```sql
QUANTILE_STATE_TO_BASE64(<quantile_state_input>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<quantile_state_input>` | QUANTILE_STATE 型のデータ。 |

## 戻り値

QUANTILE_STATE を Base64 でエンコードした文字列を返します。
QUANTILE_STATE が `NULL` の場合は `NULL` を返します。

::: note

QUANTILE_STATE 内の要素の順序は保証されないため、内容が同じ QUANTILE_STATE から生成される Base64 文字列が常に同じになるとは限りません。ただし、quantile_state_from_base64 でデコードした QUANTILE_STATE は同じになります。

:::

## 例

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
