---
{
    "title": "BITMAP_FROM_ARRAY",
    "language": "ja",
    "description": "TINYINT/SMALLINT/INT/BIGINT 型の配列を BITMAP に変換します。入力フィールドが不正な場合、結果は NULL になります。"
}
---

## 説明

TINYINT/SMALLINT/INT/BIGINT 型の配列を BITMAP に変換します。入力フィールドが不正な場合、結果は NULL になります。

## 構文

```sql
BITMAP_FROM_ARRAY(<arr>)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<arr>`   | 整数の配列 |

## 戻り値

BITMAP を返します。
- 入力フィールドが不正な場合、結果は NULL になります。

## 例

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```

```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```


```sql
SELECT bitmap_to_string(bitmap_from_array(NULL)) AS bs;
```

```text
+------+
| bs   |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_array([1,2,3,-1]));
```

```text
+-------------------------------------------------+
| bitmap_to_string(bitmap_from_array([1,2,3,-1])) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```
