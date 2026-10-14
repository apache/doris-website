---
{
    "title": "BITMAP_TO_ARRAY",
    "language": "ja",
    "description": "Bitmap を Array に変換します。"
}
---

## 説明

Bitmap を Array に変換します。

## 構文

```sql
BITMAP_TO_ARRAY(<bitmap>)
```

## 引数

| 引数       | 説明                         |
|------------|---------------------------------|
| `<bitmap>` | Bitmap 型のカラムまたは式    |

## 戻り値

Bitmap 内のすべてのビット位置を含む配列を返します。  
Bitmap が `NULL` の場合は `NULL` を返します。

## 例

`NULL` の Bitmap を配列に変換する場合:

```sql
select bitmap_to_array(null);
```

実行結果:

```text
+------------------------+
| bitmap_to_array(NULL)  |
+------------------------+
| NULL                   |
+------------------------+
```

空の Bitmap を配列に変換する場合:

```sql
select bitmap_to_array(bitmap_empty());
```

実行結果:

```text
+---------------------------------+
| bitmap_to_array(bitmap_empty()) |
+---------------------------------+
| []                              |
+---------------------------------+
```

要素が一つの Bitmap を配列に変換する場合:

```sql
select bitmap_to_array(to_bitmap(1));
```

実行結果:

```text
+-------------------------------+
| bitmap_to_array(to_bitmap(1)) |
+-------------------------------+
| [1]                           |
+-------------------------------+
```

複数の要素を含む Bitmap を配列に変換する場合:

```sql
select bitmap_to_array(bitmap_from_string('1,2,3,4,5'));
```

実行結果:

```text
+--------------------------------------------------+
| bitmap_to_array(bitmap_from_string('1,2,3,4,5')) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                  |
+--------------------------------------------------+
```
