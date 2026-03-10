---
{
  "title": "QUANTILE_STATE_TO_BASE64",
  "language": "ja"
}
---
## 説明

QUANTILE_STATE型をbase64エンコードされた文字列に変換します。

## 構文

```sql
QUANTILE_STATE_TO_BASE64(<quantile_state_input>)
```
## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<quantile_state_input>` | QUANTILE_STATE型のデータ。 |

## Return Value

QUANTILE_STATEのBase64エンコードされた文字列。
QUANTILE_STATEが`NULL`の場合は`NULL`を返します。

::: note

QUANTILE_STATE内の要素の順序は保証されないため、同じQUANTILE_STATEの内容から生成されるbase64結果が常に同じであることは保証されませんが、quantile_state_from_base64によってデコードされるQUANTILE_STATEは同じであることが保証されます。

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
