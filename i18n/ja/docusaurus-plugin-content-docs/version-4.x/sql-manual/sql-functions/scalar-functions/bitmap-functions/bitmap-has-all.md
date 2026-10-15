---
{
    "title": "BITMAP_HAS_ALL",
    "language": "ja",
    "description": "一方の Bitmap がもう一方の Bitmap のすべての要素を含むかどうかを判定します。"
}
---

## 説明

一方の Bitmap がもう一方の Bitmap のすべての要素を含むかどうかを判定します。

## 構文

```sql
BITMAP_HAS_ALL(<bitmap1>, <bitmap2>)
```

## パラメータ

| パラメータ | 説明 |
|-------------|-------------------|
| `<bitmap1>` | 最初の Bitmap |
| `<bitmap2>` | 二つ目の Bitmap |

## 戻り値

`true` を返すのは、`<bitmap1>` が `<bitmap2>` のすべての要素を含む場合です。  
`true` を返すのは、`<bitmap2>` に要素がない場合も同様です。  
それ以外の場合は `false` を返します。
- パラメータが NULL の場合は NULL を返します。

## 例

一方の Bitmap がもう一方の Bitmap のすべての要素を含むかどうかを確認する例：

```sql
select bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) as res;
```

結果は次のとおりです：

```text
+------+
| res  |
+------+
|    1 |
+------+
```

空の Bitmap がもう一方の Bitmap のすべての要素を含むかどうかを確認する例：

```sql
select bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) as res;
```

結果は次のとおりです：

```text
+------+
| res  |
+------+
|    0 |
+------+
```


```sql
select bitmap_has_all(bitmap_empty(), NULL) as res;
```

結果は次のとおりです：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
