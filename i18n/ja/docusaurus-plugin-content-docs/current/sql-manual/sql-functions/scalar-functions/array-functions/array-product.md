---
{
    "title": "ARRAY_PRODUCT",
    "language": "ja",
    "description": "配列内のすべての要素の積を計算します。配列内の要素を順に掛け合わせ、結果を返します。"
}
---

## array_product

<version since="2.0.0">

</version>

## 説明

配列内のすべての要素の積を計算します。配列内の要素を順に掛け合わせ、結果を返します。

## 構文

```sql
array_product(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY<T> 型。積を計算する対象の配列

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 真偽値型：BOOLEAN（true は 1、false は 0 に変換されます）

### 戻り値

戻り値の型：DOUBLE または DECIMAL

戻り値の意味：
- 配列内の要素の積を返します
- NULL：配列が空の場合、配列が NULL の場合、またはすべての要素が NULL の場合

使用上の注意：
- 配列内の NULL 値は無視し、NULL 以外の要素だけの積を計算します
- 配列内のすべての要素が NULL の場合は NULL を返します
- 空の配列は NULL を返します
- 複合型（MAP、STRUCT、ARRAY）は積の計算に対応しておらず、エラーになります
- 配列要素の NULL 値は積の計算に参加しません

**クエリ例：**

整数配列の積を計算します：
```sql
SELECT array_product([1, 2, 3, 4, 5]);
+--------------------------------+
| array_product([1, 2, 3, 4, 5]) |
+--------------------------------+
|                            120 |
+--------------------------------+
```

浮動小数点数の配列の積を計算します：
```sql
SELECT array_product([1.1, 2.2, 3.3, 4.4, 5.5]);
+------------------------------------------+
| array_product([1.1, 2.2, 3.3, 4.4, 5.5]) |
+------------------------------------------+
|                                 193.2612 |
+------------------------------------------+
```

NULL 値を含む配列の積を計算します：
```sql
SELECT array_product([1, null, 3, null, 5]);
+----------------------------------------+
| array_product([1, null, 3, null, 5])  |
+----------------------------------------+
| 15.0                                   |
+----------------------------------------+
```

真偽値の配列の積を計算します（true=1、false=0）：
```sql
SELECT array_product([true, false, true, true]);
+------------------------------------------+
| array_product([true, false, true, true]) |
+------------------------------------------+
|                                        0 |
+------------------------------------------+
```

空の配列は NULL を返します：
```sql
SELECT array_product([]);
+----------------------+
| array_product([])    |
+----------------------+
| NULL                 |
+----------------------+
```

すべての要素が NULL の配列は NULL を返します：
```sql
SELECT array_product([null, null, null]);
+----------------------------------+
| array_product([null, null, null]) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

複合型の例：

入れ子になった配列型には対応していないため、エラーになります：
```sql
SELECT array_product([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<ARRAY<TINYINT>>
```

MAP 型には対応していないため、エラーになります：
```sql
SELECT array_product([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<MAP<VARCHAR(1),TINYINT>>
```

パラメータの数が正しくない場合のエラー：
```sql
SELECT array_product([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_product' which has 2 arity. Candidate functions are: [array_product(Expression)]
```

配列以外の型を渡した場合のエラー：
```sql
SELECT array_product('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_product(VARCHAR(12))
```

### キーワード

ARRAY, PRODUCT, ARRAY_PRODUCT
