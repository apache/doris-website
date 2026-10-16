---
{
    "title": "QUANTILE_STATE_FROM_BASE64",
    "language": "ja"
}
---

## 説明

Base64 エンコードされた文字列（通常は `QUANTILE_STATE_TO_BASE64` で生成）を QUANTILE_STATE 型に変換します。入力文字列が無効または NULL の場合は NULL を返します。

## 構文

```sql
QUANTILE_STATE_FROM_BASE64(<input>)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<input>` | Base64 エンコードされた文字列。通常は `QUANTILE_STATE_TO_BASE64` で生成します。文字列が無効な場合は NULL を返します。 |

## 戻り値

Base64 エンコードから復元した QUANTILE_STATE 型の値を返します。入力文字列が無効または NULL の場合は NULL を返します。

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
