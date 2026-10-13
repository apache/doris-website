---
{
    "title": "INNER_PRODUCT",
    "language": "ja",
    "description": "二つの密ベクトルまたは疎ベクトルの内積を計算します"
}
---

## 説明

配列で表された二つの密ベクトル、またはマップで表された二つの疎ベクトルの内積を計算します。疎ベクトルでは各マップキーが次元を識別し、その値が座標です。両方のマップにある次元だけが結果に寄与します。

## 構文

```sql
INNER_PRODUCT(<array1>, <array2>)
INNER_PRODUCT(<map1>, <map2>)
```

## 引数

| 引数 | 説明 |
|---|---|
| `<array1>` | 第一密ベクトル。要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応し、要素数は `<array2>` と同じである必要があります。 |
| `<array2>` | 第二密ベクトル。要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応し、要素数は `<array1>` と同じである必要があります。 |
| `<map1>` | 第一疎ベクトル。型は `MAP<K, FLOAT>` で、`K` は整数型（TINYINT、SMALLINT、INT、BIGINT、LARGEINT）または文字列型（CHAR、VARCHAR、STRING）です。キーの型は `<map2>` と同じ型ファミリーに属する必要があります。 |
| `<map2>` | 第二疎ベクトル。型の制約は `<map1>` と同じです。二つのマップのエントリ数は異なっていてもかまいません。 |

## 戻り値

内積を `FLOAT` 型で返します。

配列を入力した場合、対応する要素同士を乗算して合計します。いずれかの配列が `NULL`、`NULL` 要素を含む、または長さが異なる場合はエラーになります。

マップを入力した場合、同じキーの値同士を乗算して合計します。片方のマップにしかないキーは結果に影響せず、欠けている座標をゼロとして扱うのと同じです。`NULL` キーは別の `NULL` キーと一致します。同じキーが複数回現れる場合は最後の値を使います。いずれかのマップが `NULL`、またはいずれかのキーに残った値が `NULL` の場合はエラーになります。

## 例

```sql
SELECT INNER_PRODUCT([1, 2], [2, 3]),INNER_PRODUCT([3, 6], [4, 7]);
```

```text
+-------------------------------+-------------------------------+
| inner_product([1, 2], [2, 3]) | inner_product([3, 6], [4, 7]) |
+-------------------------------+-------------------------------+
|                             8 |                            54 |
+-------------------------------+-------------------------------+
```

次の例では二つの疎ベクトルの内積を計算します。両方のマップにあるのはキー `a` と `b` だけなので、結果は `2 * 5 + 3 * 4 = 22` です。

```sql
SELECT INNER_PRODUCT(
    MAP('a', CAST(2 AS FLOAT), 'b', CAST(3 AS FLOAT)),
    MAP('b', CAST(4 AS FLOAT), 'c', CAST(100 AS FLOAT), 'a', CAST(5 AS FLOAT))
) AS result;
```

```text
+--------+
| result |
+--------+
|     22 |
+--------+
```

入力配列が `NULL` の場合はエラーになります。

```sql
SELECT INNER_PRODUCT(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot be null
```

入力配列に `NULL` 要素がある場合はエラーになります。

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```

マップの値が `NULL` の場合はエラーになります。

```sql
SELECT INNER_PRODUCT(
    MAP(1, CAST(NULL AS FLOAT)),
    MAP(1, CAST(2 AS FLOAT))
);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```
