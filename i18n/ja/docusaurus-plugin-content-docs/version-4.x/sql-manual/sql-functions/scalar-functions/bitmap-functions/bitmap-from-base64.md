---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "ja",
    "description": "bitmaptobase64 関数で変換できる Base64 文字列を BITMAP に変換します。入力文字列が無効な場合は NULL を返します。"
}
---

## 説明

`bitmap_to_base64` 関数で変換できる Base64 文字列を BITMAP に変換します。入力文字列が無効な場合は NULL を返します。

## 構文

```sql
 BITMAP_FROM_BASE64(<base64_str>)
```

## パラメータ

| パラメータ      | 説明                                                            |
|----------------|-----------------------------------------------------------------|
| `<base64_str>` | Base64 文字列（`bitmap_to_base64` 関数で変換できるもの）         |

## 戻り値

BITMAP を返します。
- 入力フィールドが無効な場合、結果は NULL になります。

## 例


```sql
select bitmap_to_string(bitmap_from_base64("invalid")) bts;
```

```text
+------+
| bts  |
+------+
| NULL |
+------+
```

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
