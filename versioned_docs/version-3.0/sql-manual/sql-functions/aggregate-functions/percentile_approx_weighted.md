---
{
    "title": "PERCENTILE_APPROX_WEIGHTED",
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

The `PERCENTILE_APPROX_WEIGHTED` function calculates weighted approximate percentiles, primarily used in scenarios where value importance needs to be considered. It is a weighted version of `PERCENTILE_APPROX`, allowing a weight to be specified for each value.

Key features:
1. Weight Support: Each value can be assigned a corresponding weight, affecting the final percentile calculation
2. Memory Efficiency: Uses fixed-size memory, maintaining low memory consumption even when processing low-cardinality columns (large data volumes but the number of different elements is small)
3. Adjustable Precision: Balance between precision and performance through the compression parameter

## Syntax

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to calculate the percentile for |
| `<weight>` | Weight column, must be positive numbers |
| `<p>` | Percentile value, range `[0.0, 1.0]`, e.g., `0.99` represents the `99`th percentile |
| `<compression>` | Optional parameter, compression ratio, range `[2048, 10000]`. The higher the value, the higher the precision, but the greater the memory consumption. If not specified or outside the range, use `10000`. |

## Return Value

Return a `DOUBLE` type value, representing the calculated weighted approximate percentile.

## Examples

```sql
-- Create sample table
CREATE TABLE weighted_scores (
    student_id INT,
    score DECIMAL(10, 2),
    weight INT
) DUPLICATE KEY(student_id)
DISTRIBUTED BY HASH(student_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert example data
INSERT INTO weighted_scores VALUES
(1, 85.5, 1),   -- Normal homework score, weight 1
(2, 90.0, 2),   -- Important homework score, weight 2
(3, 75.5, 1),
(4, 95.5, 3),   -- Very important homework, weight 3
(5, 88.0, 2),
(6, 92.5, 2),
(7, 78.0, 1),
(8, 89.5, 2),
(9, 94.0, 3),
(10, 83.5, 1);

-- Calculate weighted scores distribution
SELECT 
    -- Calculate 90th percentile for different compression ratios
    percentile_approx_weighted(score, weight, 0.9) as p90_default,          -- Default compression ratio
    percentile_approx_weighted(score, weight, 0.9, 2048) as p90_fast,       -- Lower compression ratio, faster
    percentile_approx_weighted(score, weight, 0.9, 10000) as p90_accurate   -- Higher compression ratio, more accurate
FROM weighted_scores;
```

```text
+------------------+------------------+------------------+
| p90_default      | p90_fast         | p90_accurate     |
+------------------+------------------+------------------+
| 95.3499984741211 | 95.3499984741211 | 95.3499984741211 |
+------------------+------------------+------------------+
```


