---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
    "language": "ja",
    "description": "指定した範囲内（終端は含まない）の Bitmap の部分集合を返します。"
}
---

## 説明

指定した範囲内（終端は含まない）の Bitmap の部分集合を返します。

## 構文

```sql
BITMAP_SUBSET_IN_RANGE(<bitmap>, <range_start_include>, <range_end_exclude>)
```

## 引数

| 引数 | 説明 |
|------|------|
| `<bitmap>` | Bitmap 値 |
| `<range_start_include>` | 範囲の開始値（この値を含みます） |
| `<range_end_exclude>` | 範囲の終了値（この値は含みません） |

## 戻り値

指定した範囲内の部分 Bitmap を返します。
- 引数に NULL 値が含まれる場合、または範囲が無効な場合は NULL を返します。

## 例

0 以上 9 未満の範囲にある Bitmap の部分集合を取得します。

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```

実行結果:

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```

2 以上 3 未満の範囲にある Bitmap の部分集合を取得します。

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, NULL)) value;
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
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, -10000)) value;
```

実行結果:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

