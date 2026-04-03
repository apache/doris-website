---
{
  "title": "QUANTILE_STATE_FROM_BASE64",
  "language": "ja"
}
---
## 説明

base64エンコードされた文字列（通常は`QUANTILE_STATE_TO_BASE64`によって生成される）をQUANTILE_STATE型に変換します。入力文字列が無効またはNULLの場合、NULLを返します。

## 構文

```sql
QUANTILE_STATE_FROM_BASE64(<input>)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<input>` | base64エンコードされた文字列で、通常は`QUANTILE_STATE_TO_BASE64`によって生成される。文字列が無効な場合はNULLを返す。 |

## 戻り値

base64エンコーディングから解析されたquantile_stateを返す。文字列が無効な場合はNULLを返す。

## 例

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
