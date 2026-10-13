---
{
    "title": "COSINE_DISTANCE",
    "language": "ja",
    "description": "二つのベクトル間のコサイン距離を計算します（ベクトルの値は座標です）。"
}
---

## 説明

二つのベクトル間のコサイン距離を計算します（ベクトルの値は座標です）。

## 構文

```sql
COSINE_DISTANCE(<array1>, <array2>)
```

## 引数

| 引数 | 説明 |
|---|--|
| `<array1>` | 第一ベクトル（各値は座標）。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE です。要素数は array2 と一致する必要があります |
| `<array2>` | 第二ベクトル（各値は座標）。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応します。要素数は array1 と一致する必要があります |

## 戻り値

二つのベクトル間のコサイン距離を返します（各値は座標です）。戻り値の型は `FLOAT` です。

いずれかの入力配列が `NULL`、または `NULL` 要素を含む場合、エラーになります。

## 例

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```

```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|                     0.007722139 |                     0.001539648 |
+---------------------------------+---------------------------------+
```

入力配列が `NULL` の場合はエラーになります。

```sql
SELECT COSINE_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot be null
```

入力配列に `NULL` 要素がある場合はエラーになります。

```sql
SELECT COSINE_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot have null
```
