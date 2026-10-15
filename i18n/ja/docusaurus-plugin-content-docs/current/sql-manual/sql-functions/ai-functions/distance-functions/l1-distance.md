---
{
    "title": "L1_DISTANCE",
    "language": "ja",
    "description": "L1 空間にある二点間の距離を計算します（ベクトルの値は座標です）。"
}
---

## 説明

L1 空間にある二点間の距離を計算します（ベクトルの値は座標です）。

## 構文

```sql
L1_DISTANCE(<array1>, <array2>)
```

## 引数

| 引数 | 説明 |
| -- |--|
| `<array1>` | 第一ベクトル（各値は座標）。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE です。要素数は array2 と一致する必要があります |
| `<array2>` | 第二ベクトル（各値は座標）。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応します。要素数は array1 と一致する必要があります |

## 戻り値

L1 空間にある二点間の距離を返します（ベクトルの値は座標です）。戻り値の型は `FLOAT` です。

いずれかの入力配列が `NULL`、または `NULL` 要素を含む場合、エラーになります。

## 例

```sql
SELECT L1_DISTANCE([4, 5], [6, 8]),L1_DISTANCE([3, 6], [4, 5]);
```

```text
+-----------------------------+-----------------------------+
| l1_distance([4, 5], [6, 8]) | l1_distance([3, 6], [4, 5]) |
+-----------------------------+-----------------------------+
|                           5 |                           2 |
+-----------------------------+-----------------------------+
```

入力配列が `NULL` の場合はエラーになります。

```sql
SELECT L1_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l1_distance cannot be null
```

入力配列に `NULL` 要素がある場合はエラーになります。

```sql
SELECT L1_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l1_distance cannot have null
```
