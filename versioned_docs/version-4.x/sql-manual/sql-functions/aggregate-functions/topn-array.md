---
{
    "title": "TOPN_ARRAY",
    "language": "en"
}
---

## Description

TOPN_ARRAY returns an array of the N most frequent values in the specified column. It is an approximate calculation function that returns results ordered by count in descending order.

## Syntax

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to be counted. Supported types: TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, IPV4, IPV6, String. |
| `<top_num>` | The number of most frequent values to return. Must be a positive integer. Supported type: Integer. |
| `<space_expand_rate>` | Optional. Sets the number of counters used in the Space-Saving algorithm: `counter_numbers = top_num * space_expand_rate`. The larger the value, the more accurate the result. Default is 50. Supported type: Integer. |

## Return Value

Returns an array containing the N most frequent values.
If there is no valid data in the group, returns NULL.

## Example
```sql
-- setup
CREATE TABLE page_visits (
    page_id INT,
    user_id INT,
    visit_date DATE
) DISTRIBUTED BY HASH(page_id)
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO page_visits VALUES
(1, 101, '2024-01-01'),
(2, 102, '2024-01-01'),
(1, 103, '2024-01-01'),
(3, 101, '2024-01-01'),
(1, 104, '2024-01-01'),
(2, 105, '2024-01-01'),
(1, 106, '2024-01-01'),
(4, 107, '2024-01-01');
```

```sql
SELECT TOPN_ARRAY(page_id, 3) as top_pages
FROM page_visits;
```

Find the top 3 most visited pages.

```text
+-----------+
| top_pages |
+-----------+
| [1, 2, 4] |
+-----------+
```

```sql
SELECT TOPN_ARRAY(page_id, 3) as top_pages FROM page_visits where page_id is null;
```

```text
+-----------+
| top_pages |
+-----------+
| NULL      |
+-----------+
```
