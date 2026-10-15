---
{
    "title": "COSINE_SIMILARITY",
    "language": "ja",
    "description": "二つのベクトル間のコサイン類似度を計算します。"
}
---

## 説明

二つのベクトル間のコサイン類似度を計算します。
類似度は内積とベクトルのノルムから計算され、結果は `[-1, 1]` の範囲に収まります。

:::note バージョンに関する注記
この関数は 4.1.2 以降でサポートされています。
:::

## 構文

```sql
COSINE_SIMILARITY(<array1>, <array2>)
```

## 引数

| 引数 | 説明 |
|---|--|
| `<array1>` | 第一ベクトル。入力型は `ARRAY<FLOAT>` である必要があります。 |
| `<array2>` | 第二ベクトル。入力型は `ARRAY<FLOAT>` で、要素数は `<array1>` と同じである必要があります。 |

## 戻り値

二つのベクトル間のコサイン類似度を FLOAT 型で返します。
入力配列が `NULL`、または配列内の要素が `NULL` の場合はエラーになります。
二つの配列の要素数が異なる場合はエラーになります。
配列が空、またはいずれかのベクトルがゼロベクトルの場合、`0.0` を返します。

## 例

```sql
-- Two identical vectors have similarity 1
SELECT COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

`[1, 2, 3]` と `[1, 2, 3]` は同じ方向を向くため、類似度は `1` です。

```sql
-- Orthogonal vectors have similarity 0
SELECT COSINE_SIMILARITY([1, 0], [0, 1]);
```

```text
+-----------------------------------+
| COSINE_SIMILARITY([1, 0], [0, 1]) |
+-----------------------------------+
|                                 0 |
+-----------------------------------+
```

ベクトルは直交しているため、内積は `0`、類似度も `0` です。

```sql
-- A zero vector returns 0
SELECT COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]) |
+-----------------------------------------+
|                                       0 |
+-----------------------------------------+
```

ゼロベクトルには有効な方向がないため、結果は `0` です。

```sql
-- An empty array returns 0
SELECT COSINE_SIMILARITY([], []);
```

```text
+---------------------------+
| COSINE_SIMILARITY([], []) |
+---------------------------+
|                         0 |
+---------------------------+
```

```sql
-- NULL inside the input array raises an error
SELECT COSINE_SIMILARITY([1, NULL, 3], [1, 2, 3]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_similarity cannot have null
```
