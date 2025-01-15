---
{
    "title": "SHOW-ALTER",
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

This statement is used to display the execution status of various modification tasks currently in progress.

```sql
SHOW ALTER [TABLE [COLUMN | ROLLUP] [FROM db_name]];
```

Notes:

1. TABLE COLUMN: Displays ALTER tasks for modifying columns.
2. Supports syntax [WHERE TableName|CreateTime|FinishTime|State] [ORDER BY] [LIMIT].
3. TABLE ROLLUP: Displays tasks for creating or deleting ROLLUP.
4. If db_name is not specified, the current default database is used.

## Result

*SHOW ALTER TABLE COLUMN*

| Field Name            | Description                                                         |
|-----------------------|------------------------------------------------------------------|
| JobId                 | Unique ID for each Schema Change job.                          |
| TableName             | The name of the base table corresponding to the Schema Change. |
| CreateTime            | Job creation time.                                              |
| FinishedTime          | Job completion time. Displays "N/A" if not completed.      |
| IndexName             | The name of a base table/synchronized materialized view involved in this modification.        |
| IndexId               | ID of the new base table/synchronized materialized view.                                      |
| OriginIndexId         | ID of a base table/synchronized materialized view involved in this modification.                                      |
| SchemaVersion         | Displays in M:N format. M represents the version of the Schema Change, and N represents the corresponding hash value. Each Schema Change increments the version. |
| TransactionId         | Transaction ID for converting historical data.                  |
| State                 | The phase of the job.                                               |
|                       | - PENDING: The job is waiting to be scheduled in the queue.        |
|                       | - WAITING_TXN: Waiting for import tasks before the boundary transaction ID to complete. |
|                       | - RUNNING: Currently performing historical data conversion.                |
|                       | - FINISHED: The job has successfully completed.                            |
|                       | - CANCELLED: The job has failed.                                          |
| Msg                   | If the job fails, displays the failure message.                        |
| Progress              | Job progress. Only displayed in RUNNING state. Progress is shown in M/N format. N is the total number of replicas involved in the Schema Change. M is the number of replicas for which historical data conversion has been completed. |
| Timeout                | Job timeout duration in seconds.                                       |

## Examples

1. Display the execution status of all modification column tasks for the default database.

   ```sql
   SHOW ALTER TABLE COLUMN;
   ```

2. Display the execution status of the most recent modification column task for a specific table.

   ```sql
   SHOW ALTER TABLE COLUMN WHERE TableName = "table1" ORDER BY CreateTime DESC LIMIT 1;
   ```

3. Display the execution status of tasks for creating or deleting ROLLUP for a specified database.

   ```sql
   SHOW ALTER TABLE ROLLUP FROM example_db;
   ```

### Keywords

    SHOW, ALTER

### Best Practice
