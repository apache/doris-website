---
{
    "title": "TOPN_ARRAY",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

TOPN_ARRAY returns an array of the N most frequent values in the specified column. It is an approximate calculation function that returns results ordered by count in descending order.

## Syntax

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to be counted. |
| `<top_num>` | The number of the most frequent values to return. It must be a positive integer. |
| `<space_expand_rate>` | Optional parameter, which is used to set the number of counters used in the Space-Saving algorithm. `counter_numbers = top_num * space_expand_rate` , the larger the value of space_expand_rate, the more accurate the result, and the default value is 50. |

## Return Value

Return an array containing the N most frequent values.

## Examples
```sql
-- Create sample table
CREATE TABLE page_visits (
    page_id INT,
    user_id INT,
    visit_date DATE
) DISTRIBUTED BY HASH(page_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO page_visits VALUES
(1, 101, '2024-01-01'),
(2, 102, '2024-01-01'),
(1, 103, '2024-01-01'),
(3, 101, '2024-01-01'),
(1, 104, '2024-01-01'),
(2, 105, '2024-01-01'),
(1, 106, '2024-01-01'),
(4, 107, '2024-01-01');

-- Find top 3 most visited pages
SELECT TOPN_ARRAY(page_id, 3) as top_pages
FROM page_visits;
```

```text
+-----------+
| top_pages |
+-----------+
| [1, 2, 4] |
+-----------+
```
