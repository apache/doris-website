---
{
    "title": "BITMAP_CONTAINS",
    "language": "ja",
    "description": "入力値が BITMAP に含まれるかを判定し、真偽値を返します。"
}
---

## 説明

入力値が BITMAP に含まれるかを判定し、真偽値を返します。

## 構文

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap>` | BITMAP の集合 |
| `<bitint>` | 含まれるかを判定する整数 |

## 戻り値

真偽値を返します
- パラメータが NULL の場合は NULL を返します

## 例

```sql
select bitmap_contains(to_bitmap(1),2) cnt1, bitmap_contains(to_bitmap(1),1) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
|    0 |    1 |
+------+------+
```

```sql
select bitmap_contains(NULL,2) cnt1, bitmap_contains(to_bitmap(1),NULL) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
| NULL | NULL |
+------+------+
```
