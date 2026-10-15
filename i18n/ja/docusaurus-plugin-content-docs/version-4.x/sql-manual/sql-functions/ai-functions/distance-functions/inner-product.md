---
{
    "title": "INNER_PRODUCT",
    "language": "ja",
    "description": "要素数が同じ二つのベクトルの内積を計算します"
}
---

## 説明

要素数が同じ二つのベクトルの内積を計算します。

## 構文

```sql
INNER_PRODUCT(<array1>, <array2>)
```

## 引数

| 引数 | 説明 |
| -- |--|
| `<array1>` | 一つ目のベクトル。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応します。要素数は array2 と同じである必要があります。 |
| `<array2>` | 二つ目のベクトル。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応します。要素数は array1 と同じである必要があります。 |

## 戻り値

要素数が同じ二つのベクトルの内積を返します。戻り値の型は `FLOAT` です。

いずれかの入力配列が `NULL`、または `NULL` 要素を含む場合はエラーになります。

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
