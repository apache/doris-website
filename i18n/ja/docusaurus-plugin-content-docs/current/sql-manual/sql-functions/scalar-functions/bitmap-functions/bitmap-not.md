---
{
    "title": "BITMAP_NOT",
    "language": "ja",
    "description": "最初の BITMAP と二番目の BITMAP の差集合を計算し、その結果を新しい BITMAP として返します。"
}
---

## 説明

最初の BITMAP と二番目の BITMAP の差集合を計算し、その結果を新しい BITMAP として返します。

## 構文

```sql
BITMAP_NOT(<bitmap1>, <bitmap2>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<bitmap1>` | 最初の BITMAP |
| `<bitmap2>` | 二番目の BITMAP |

## 戻り値

`<bitmap1>` に含まれ、`<bitmap2>` には含まれない要素を表す BITMAP を返します。
- 引数が NULL の場合は NULL を返します。

## 例

二つの BITMAP の差集合を計算します。

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) as res;
```

`<bitmap1>` のすべての要素が `<bitmap2>` にも含まれるため、結果は空の BITMAP になります。

```text
+------+
| res  |
+------+
|      |
+------+
```

`<bitmap1>` に `<bitmap2>` には含まれない要素がある場合の差集合を計算します。

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) as res;
```

結果は要素 `5` を含む BITMAP になります。

```text
+------+
| res  |
+------+
| 5    |
+------+
```

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
