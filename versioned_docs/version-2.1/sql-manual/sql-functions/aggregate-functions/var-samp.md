---
{
    "title": "VAR_SAMP,VARIANCE_SAMP",
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

The VAR_SAMP function calculates the sample variance of a specified expression. Unlike VARIANCE (population variance), VAR_SAMP uses n-1 as the divisor, which is considered an unbiased estimate of the population variance in statistics.

## Alias

- VARIANCE_SAMP

## Syntax

```sql
VAR_SAMP(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to calculate sample variance for. Must be numeric type |

## Return Value
Returns a DOUBLE value representing the calculated sample variance.

## Examples
```sql
-- Create sample table
CREATE TABLE student_scores (
    student_id INT,
    score DECIMAL(4,1)
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO student_scores VALUES
(1, 85.5),
(2, 92.0),
(3, 78.5),
(4, 88.0),
(5, 95.5),
(6, 82.0),
(7, 90.0),
(8, 87.5);

-- Calculate sample variance of student scores
SELECT 
    VAR_SAMP(score) as sample_variance,
    VARIANCE(score) as population_variance
FROM student_scores;
```

```text
+------------------+---------------------+
| sample_variance  | population_variance |
+------------------+---------------------+
| 29.4107142857143 |   25.73437500000001 |
+------------------+---------------------+
```
