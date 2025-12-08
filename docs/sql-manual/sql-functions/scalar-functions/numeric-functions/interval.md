---
{
    "title": "INTERVAL",
    "language": "en"
}
---

## Description

The INTERVAL function uses binary search to return the index position of the first threshold that is strictly greater than N. The function requires threshold parameters to be arranged in ascending order (N1 ≤ N2 ≤ N3 ≤ ... ≤ Nn) to correctly use the binary search algorithm for optimal performance.

- All arguments are treated as integer types (TINYINT, SMALLINT, INT, BIGINT, LARGEINT).
- Uses binary search algorithm with O(log n) time complexity for excellent performance.
- Returns the count of thresholds if all thresholds are less than or equal to N.

This function behaves consistently with MySQL's [interval function](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html#function_interval).

## Syntax

```sql
INTERVAL(N, N1, N2, N3, ...)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `N` | The value to search for, integer type (TINYINT, SMALLINT, INT, BIGINT, LARGEINT) |
| `N1, N2, N3, ...` | List of thresholds, must be the same type as N, and should be arranged in ascending order (N1 ≤ N2 ≤ N3 ≤ ... ≤ Nn). At least one threshold parameter is required |

## Return Value

Returns an INT32 result:
- Returns the index position (0-based) of the first threshold that is strictly greater than N.
- Returns the count of thresholds if all thresholds are less than or equal to N.
- Returns NULL if N is NULL.

**Return Rules:**
- If N < N1, returns 0
- If N < N2, returns 1
- If N < N3, returns 2
- And so on...
- If all thresholds ≤ N, returns the count of thresholds

Special cases:
- Returns NULL if any argument is NULL.
- If threshold parameters are not arranged in ascending order, the function will still perform binary search but may return incorrect results.
- return error if paramter less than 2.

## Example

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

-- Boundary case: less than first threshold
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

-- NULL value handling
SELECT INTERVAL(NULL, 1, 10, 100);
+------------------------------+
| INTERVAL(NULL, 1, 10, 100)   |
+------------------------------+
|                         NULL |
+------------------------------+

-- return error if signal parameter
SELECT `INTERVAL`(33);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: interval(TINYINT)
```

