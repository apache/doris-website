---
{
    "title": "SUB_BITMAP",
    "language": "ja",
    "description": "指定した位置から、指定した要素数の上限まで Bitmap の要素を抽出します。"
}
---

## 説明

指定した位置から、指定した要素数の上限まで Bitmap の要素を抽出し、新しい Bitmap として返します。

## 構文

```sql
SUB_BITMAP(<bitmap>, <position>, <cardinality_limit>)
```

## 引数

| 引数             | 説明                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Bitmap 値              |
| `<position>`          | 開始位置（その位置を含みます）。負のインデックスを指定した場合、最後の要素が -1 です。 |
| `<cardinality_limit>` | 要素数の上限 |

## 戻り値

指定した範囲と要素数の上限に収まる部分 Bitmap を返します。
- 引数が NULL の場合は NULL を返します。


## 例

位置 0 から最大 3 要素の部分 Bitmap を取得します。

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| 0,1,2 |
+-------+
```

位置 -3 から最大 2 要素の部分 Bitmap を取得します。

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| 2,3   |
+-------+
```

位置 2 から最大 100 要素の部分 Bitmap を取得します。

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, NULL)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
