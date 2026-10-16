---
{
    "title": "BITMAP_TO_BASE64",
    "language": "ja",
    "description": "Bitmap を Base64 エンコードされた文字列に変換します。"
}
---

## 説明

Bitmap を Base64 エンコードされた文字列に変換します。

## 構文

```sql
BITMAP_TO_BASE64(<bitmap>)
```

## 引数

| 引数       | 説明                            |
|------------|---------------------------------|
| `<bitmap>` | Bitmap 型のカラムまたは式       |

## 戻り値

Bitmap を Base64 エンコードした文字列を返します。  
Bitmap が `NULL` の場合は `NULL` を返します。

::: note

BE の設定項目 `enable_set_in_bitmap_value` は、メモリ内の Bitmap 値の具体的な形式を変更するため、この関数の結果に影響します。  
Bitmap 内の要素の順序は保証されないため、同じ内容でも生成される Base64 文字列が常に同じになるとは限りません。ただし、`bitmap_from_base64` でデコードした Bitmap は同じになります。

:::

## 例

`NULL` の Bitmap を Base64 文字列に変換する場合:

```sql
select bitmap_to_base64(null);
```

実行結果:

```text
+------------------------+
| bitmap_to_base64(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

空の Bitmap を Base64 文字列に変換する場合:

```sql
select bitmap_to_base64(bitmap_empty());
```

実行結果:

```text
+----------------------------------+
| bitmap_to_base64(bitmap_empty()) |
+----------------------------------+
| AA==                             |
+----------------------------------+
```

単一の要素を含む Bitmap を Base64 文字列に変換する場合:

```sql
select bitmap_to_base64(to_bitmap(1));
```

実行結果:

```text
+--------------------------------+
| bitmap_to_base64(to_bitmap(1)) |
+--------------------------------+
| BQEBAAAAAAAAAA==               |
+--------------------------------+
```

複数の要素を含む Bitmap を Base64 文字列に変換する場合:

```sql
select bitmap_to_base64(bitmap_from_string("1,9999999"));
```

実行結果:

```text
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| BQIBAAAAAAAAAH+WmAAAAAAA                          |
+---------------------------------------------------------+
```
