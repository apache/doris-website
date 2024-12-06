---
{
    "title": "REFRESH MATERIALIZED VIEW",
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

This statement is used to manually refresh the specified asynchronous materialized view

syntax:

```sql
REFRESH MATERIALIZED VIEW mvName=multipartIdentifier (partitionSpec | COMPLETE | AUTO)
```

Explanation:

Asynchronous refresh of data for a materialized view

- AUTO: The calculation will determine which partitions of the materialized view are not synchronized with the base table. (Currently, if the base table is an external table, it is considered to be always synchronized with the materialized view. Therefore, if the base table is an external table, it is necessary to specify `COMPLETE` or designate the partitions to be refreshed), and then proceed to refresh the corresponding partitions accordingly.
- COMPLETE: It will forcibly refresh all partitions of the materialized view without checking whether the partitions are synchronized with the base table.
- partitionSpec: It will forcibly refresh the specified partitions without checking whether the partitions are synchronized with the base table.

## Examples

1. Refresh materialized view mv1 (automatically calculate the partition to be refreshed)

    ```sql
    REFRESH MATERIALIZED VIEW mv1 AUTO;
    ```

2. Refresh partition named p_19950801_19950901 和 p_19950901_19951001

    ```sql
    REFRESH MATERIALIZED VIEW mv1 partitions(p_19950801_19950901,p_19950901_19951001);
    ```
 
3. Force refresh of all materialized view data

    ```sql
    REFRESH MATERIALIZED VIEW mv1 complete;
    ```
   
## Keywords

    REFRESH, MATERIALIZED, VIEW

## Best Practice

