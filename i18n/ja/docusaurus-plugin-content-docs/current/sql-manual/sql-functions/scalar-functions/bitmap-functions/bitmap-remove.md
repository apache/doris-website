---
{
    "title": "BITMAP_REMOVE",
    "language": "ja",
    "description": "BITMAP 列から指定した値を削除します。"
}
---

## 説明

BITMAP 列から指定した値を削除します。

## 構文

```sql
BITMAP_REMOVE(<bitmap>, <value>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap>` | BITMAP 値 |
| `<value>` | 削除する値 |

## 戻り値

指定した値を削除した BITMAP を返します。

削除する値が存在しない場合は、元の BITMAP を返します。  
削除する値が `NULL` の場合は、`NULL` を返します。

## 例

BITMAP から値を削除する場合:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```

結果は次のとおりです:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

BITMAP から `NULL` 値を削除する場合:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```

結果は次のとおりです:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
