---
{
    "title": "BITMAP_MIN",
    "language": "ja",
    "description": "Bitmap 内の最小値を計算して返します。"
}
---

## 説明

Bitmap 内の最小値を計算して返します。

## 構文

```sql
BITMAP_MIN(<bitmap>)
```

## パラメータ

| パラメータ | 説明 |
|------------|---------------------------------|
| `<bitmap>` | Bitmap 型の列または式 |

## 戻り値

Bitmap 内の最小値を返します。  
Bitmap が空、または引数が NULL の場合は `NULL` を返します。

## 例

空の Bitmap の最小値を計算する場合：

```sql
select bitmap_min(bitmap_from_string('')) value;
```

結果は次のとおりです：

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```

複数の要素を含む Bitmap の最小値を計算する場合：

```sql
select bitmap_min(bitmap_from_string('1,9999999999')) value;
```

結果は次のとおりです：

```text
+-------+
| value |
+-------+
|     1 |
+-------+
```

```sql
select bitmap_min(bitmap_empty()) res1,bitmap_min(NULL) res2;
```

結果は次のとおりです：

```text
+------+------+
| res1 | res2 |
+------+------+
| NULL | NULL |
+------+------+
```
