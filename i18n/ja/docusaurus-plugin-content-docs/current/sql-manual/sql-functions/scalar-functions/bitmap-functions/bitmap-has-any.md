---
{
    "title": "BITMAP_HAS_ANY",
    "language": "ja",
    "description": "二つの Bitmap に共通の要素があるかどうかを判定します。"
}
---

## 説明

二つの Bitmap に共通の要素があるかどうかを判定します。

## 構文

```sql
BITMAP_HAS_ANY(<bitmap1>, <bitmap2>)
```

## パラメータ

| パラメータ   | 説明                   |
|-------------|----------------------|
| `<bitmap1>` | 一つ目の Bitmap        |
| `<bitmap2>` | 二つ目の Bitmap        |

## 戻り値

二つの Bitmap に共通の要素がある場合は true を返します。  
共通の要素がない場合は false を返します。
- 引数に NULL が含まれる場合は NULL を返します。

## 例

```sql
select bitmap_has_any(to_bitmap(1), to_bitmap(2)) res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), to_bitmap(1)) res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), NULL) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
