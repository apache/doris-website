---
{
    "title": "INTERVAL",
    "language": "en"
}
---

## Description

The INTERVAL function uses binary search to return the index of the first threshold strictly greater than N. This function requires the threshold parameters to be sorted in ascending order (N1 ≤ N2 ≤ N3 ≤ ... ≤ Nn) to correctly use the binary search algorithm and achieve optimal performance.

- All parameters are treated as integers.
- Uses binary search algorithm with time complexity O(log n), providing excellent performance.

This function behaves consistently with the [interval function](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html#function_interval) in MySQL.

## Syntax

```sql
INTERVAL(N, N1, N2, N3, ...)
```

## Parameters

| Parameter         | Description                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `N`               | The value to search for, integer type.                                                                                                       |
| `N1, N2, N3, ...` | List of thresholds, integer type, must be sorted in ascending order (N1 ≤ N2 ≤ N3 ≤ ... ≤ Nn). At least one threshold parameter is required. |

## Return Value

Returns the index (0-based) of the first threshold strictly greater than N. The return type is integer.

Returns -1 if N is NULL.

If threshold parameters (N1, N2, ...) are NULL, they are treated as 0.

## Examples

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
