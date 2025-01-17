---
{
    "title": "PERCENTILE_APPROX",
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

The `PERCENTILE_APPROX` function is used to calculate approximate percentiles, primarily for large datasets. Compared to the `PERCENTILE` function, it has the following features:

1. Memory Efficiency: Uses fixed-size memory, maintaining low memory consumption even when processing high-cardinality columns (large data volumes)
2. Performance Advantage: Suitable for processing large-scale datasets with faster computation
3. Adjustable Precision: Balance between precision and performance through the compression parameter


## Syntax

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to calculate percentiles for |
| `<p>` | Percentile value, range `[0.0, 1.0]`, e.g., `0.99` represents the `99th` percentile |
| `<compression>` | Optional parameter, compression level, range `[2048, 10000]`, higher values increase precision but consume more memory. If not specified or out of range, uses `10000` |

## Return Value

Returns a `DOUBLE` value representing the calculated approximate percentile.

## Examples

```sql
-- Create sample table
CREATE TABLE response_times (
    request_id INT,
    response_time DECIMAL(10, 2)
) DUPLICATE KEY(`request_id`)
DISTRIBUTED BY HASH(`request_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
INSERT INTO response_times VALUES
(1, 10.5),
(2, 15.2),
(3, 20.1),
(4, 25.8),
(5, 30.3),
(6, 35.7),
(7, 40.2),
(8, 45.9),
(9, 50.4),
(10, 100.6);

-- Calculate 99th percentile using different compression levels
SELECT 
    percentile_approx(response_time, 0.99) as p99_default,          -- Default compression
    percentile_approx(response_time, 0.99, 2048) as p99_fast,       -- Lower compression, faster
    percentile_approx(response_time, 0.99, 10000) as p99_accurate   -- Higher compression, more accurate
FROM response_times;
```

```text
+-------------------+-------------------+-------------------+
| p99_default       | p99_fast          | p99_accurate      |
+-------------------+-------------------+-------------------+
| 100.5999984741211 | 100.5999984741211 | 100.5999984741211 |
+-------------------+-------------------+-------------------+
```


