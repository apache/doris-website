---
{
    "title": "BITMAP_SUBSET_LIMIT",
    "language": "ja",
    "description": "指定した位置から Bitmap の要素の部分集合を抽出します。要素数は cardinality_limit で指定した上限までに制限されます。"
}
---

## 説明

指定した位置から Bitmap の要素の部分集合を抽出し、要素数を cardinality_limit で指定した上限までに制限して、新しい Bitmap として返します。

## 構文

```sql
BITMAP_SUBSET_LIMIT(<bitmap>, <position>, <cardinality_limit>)
```

## 引数

| 引数 | 説明 |
|------|------|
| `<bitmap>` | Bitmap 値 |
| `<position>` | 開始位置（その位置を含みます） |
| `<cardinality_limit>` | 要素数の上限 |

## 戻り値

指定した範囲と要素数の上限に収まる部分 Bitmap を返します。
- 引数が NULL または無効な値の場合は NULL を返します。

## 例

位置 0 から最大 3 要素の部分 Bitmap を取得します。

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```

実行結果:

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```

位置 4 から最大 3 要素の部分 Bitmap を取得します。

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, NULL)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), -4, 3)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, -3)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
