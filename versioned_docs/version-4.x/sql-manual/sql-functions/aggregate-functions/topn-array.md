---
{
    "title": "TOPN_ARRAY",
    "language": "en",
    "description": "TOPNARRAY returns an array of the N most frequent values in the specified column."
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
| `<expr>` | The column or expression to be counted. Supported types: Boolean (in the Doris 4.1 series since 4.1.5), TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, IPV4, IPV6, String. |
| `<top_num>` | The number of most frequent values to return. Must be a positive INT constant. |
| `<space_expand_rate>` | Optional INT constant, default 50. A positive value retains at most `top_num * space_expand_rate` candidates when serializing intermediate state; larger values generally improve accuracy. This is not a hard limit on local aggregation memory. In the Doris 4.1 series since 4.1.5, a value of 0 or less retains all intermediate candidates, while the final result still contains at most `top_num` values. This mode may use more memory and remains subject to query memory limits. |

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

BOOLEAN input (in the Doris 4.1 series since 4.1.5):

```sql
SELECT TOPN_ARRAY(TRUE, 2), TOPN_ARRAY(CAST(NULL AS BOOLEAN), 2);
```

```text
[1]    NULL
```
