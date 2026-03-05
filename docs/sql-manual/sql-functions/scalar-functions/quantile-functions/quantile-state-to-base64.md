---
{
    "title": "QUANTILE_STATE_TO_BASE64",
    "language": "en"
}
---

## Description

Converts a QUANTILE_STATE type to a base64 encoded string.

## Syntax

```sql
QUANTILE_STATE_TO_BASE64(<quantile_state_input>)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<quantile_state_input>` | Data of QUANTILE_STATE type. |

## Return Value

The Base64 encoded string of the QUANTILE_STATE.
Returns `NULL` if the QUANTILE_STATE is `NULL`.

::: note

Since the order of elements in QUANTILE_STATE cannot be guaranteed, the base64 result generated from the same QUANTILE_STATE content is not guaranteed to be always the same, but the QUANTILE_STATE decoded by quantile_state_from_base64 is guaranteed to be the same.

:::

## Examples

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
