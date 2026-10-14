---
{
    "title": "BITMAP_COUNT",
    "language": "ja",
    "description": "入力した BITMAP の要素数を返します"
}
---

## 説明

入力した BITMAP の要素数を返します

## 構文

```sql
BITMAP_COUNT(<bitmap>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap>` | BITMAP 値 |

## 戻り値

整数を返します

## 例

```sql
select bitmap_count(to_bitmap(1)) cnt;
```

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

```sql
select bitmap_count(bitmap_empty()) cnt;
```

```text
+------+
| cnt  |
+------+
|    0 |
+------+
```

