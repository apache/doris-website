---
{
  "title": "BITMAP_FROM_BASE64",
  "language": "ja",
  "description": "base64文字列（bitmaptobase64関数で変換可能）をBITMAPに変換します。入力文字列が無効な場合はNULLを返します。"
}
---
## 説明

base64文字列（`bitmap_to_base64`関数で変換可能）をBITMAPに変換します。入力文字列が無効な場合はNULLを返します。

## 構文

```sql
 BITMAP_FROM_BASE64(<base64_str>)
```
## パラメータ

| パラメータ | 説明 |
|----------------|-----------------------------------------------------------------|
| `<base64_str>` | base64文字列（`bitmap_to_base64`関数で変換可能） |

## 戻り値

BITMAPを返します
- 入力フィールドが無効な場合、結果はNULLになります

## 例

```sql
select bitmap_to_string(bitmap_from_base64("AA==")) bts;
```
```text
+------+
| bts  |
+------+
|      |
+------+
```
```sql
select bitmap_to_string(bitmap_from_base64("AQEAAAA=")) bts;
```
```text
+------+
| bts  |
+------+
| 1    |
+------+
```
```sql
select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) bts;
```
```text
+-----------+
| bts       |
+-----------+
| 1,9999999 |
+-----------+
```
