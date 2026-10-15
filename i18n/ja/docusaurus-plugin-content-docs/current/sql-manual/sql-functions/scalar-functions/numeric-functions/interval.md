---
{
    "title": "INTERVAL",
    "language": "ja"
}
---

## 説明

INTERVAL 関数は二分探索を使用して、N より厳密に大きい最初のしきい値のインデックスを返します。二分探索を正しく行い、最適な性能を得るには、しきい値の引数を昇順（N1 ≤ N2 ≤ N3 ≤ ... ≤ Nn）に並べる必要があります。

- すべての引数は整数として扱われます。
- 時間計算量が O(log n) の二分探索を使用し、高速に処理します。

この関数の動作は、MySQL の [INTERVAL 関数](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html#function_interval) と一致します。

## 構文

```sql
INTERVAL(N, N1, N2, N3, ...)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `N` | 検索対象の値。整数型です。 |
| `N1, N2, N3, ...` | しきい値のリスト。整数型で、昇順（N1 ≤ N2 ≤ N3 ≤ ... ≤ Nn）に並べる必要があります。しきい値の引数は少なくとも一つ必要です。 |

## 戻り値

N より厳密に大きい最初のしきい値のインデックス（0 始まり）を返します。戻り値の型は整数です。

N が NULL の場合は -1 を返します。

しきい値の引数（N1、N2、...）が NULL の場合、その値は 0 として扱われます。

## 例

```sql
-- Basic usage
SELECT INTERVAL(23, 1, 15, 17, 30, 44, 200);
+-----------------------------------------+
| INTERVAL(23, 1, 15, 17, 30, 44, 200)   |
+-----------------------------------------+
|                                       3 |
+-----------------------------------------+

SELECT INTERVAL(10, 1, 10, 100, 1000);
+-----------------------------------+
| INTERVAL(10, 1, 10, 100, 1000)   |
+-----------------------------------+
|                                 2 |
+-----------------------------------+

-- Boundary case: less than the first threshold
SELECT INTERVAL(0, 1, 10, 100);
+--------------------------+
| INTERVAL(0, 1, 10, 100)  |
+--------------------------+
|                        0 |
+--------------------------+

-- Boundary case: greater than all thresholds
SELECT INTERVAL(200, 1, 10, 100);
+----------------------------+
| INTERVAL(200, 1, 10, 100)  |
+----------------------------+
|                          3 |
+----------------------------+

-- Boundary case: equal to a threshold
SELECT INTERVAL(33, 1, 10, 32, 33, 102, 200);
+-------------------------------------------+
| INTERVAL(33, 1, 10, 32, 33, 102, 200)    |
+-------------------------------------------+
|                                         4 |
+-------------------------------------------+

-- First parameter is NULL
SELECT INTERVAL(NULL, 1, 10, 100);
+----------------------------+
| INTERVAL(NULL, 1, 10, 100) |
+----------------------------+
|                         -1 |
+----------------------------+

-- Subsequent parameters are NULL, treated as 0
SELECT INTERVAL(3, -1, NULL, 2, 3, 4);
+--------------------------------+
| INTERVAL(3, -1, NULL, 2, 3, 4) |
+--------------------------------+
|                              4 |
+--------------------------------+

-- NULL values causing unsorted sequence, resulting in incorrect binary search result
SELECT INTERVAL(20, 7, NULL, 14, NULL, 25, NULL, 50);
+-----------------------------------------------+
| INTERVAL(20, 7, NULL, 14, NULL, 25, NULL, 50) |
+-----------------------------------------------+
|                                             6 |
+-----------------------------------------------+

-- Input single parameter, error
SELECT INTERVAL(33);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: interval(TINYINT)
```
