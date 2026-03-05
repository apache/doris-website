---
{
    "title": "SHOW DYNAMIC PARTITION TABLES",
    "language": "en",
    "description": "This statement is used to display the status of all dynamic partition tables in the current database."
}
---

## Descriptions

This statement is used to display the status of all dynamic partition tables in the current database.

## Syntax：

```sql
SHOW DYNAMIC PARTITION TABLES [FROM <db_name>];
```

## Required Parameters
**1. `<db_name>`**

pecify the `DB` name to display the status of dynamic partition tables. If not specified, the status of all dynamic partition tables in the current `DB` will be displayed by default.
## Return Value

| Column                 | DataType | Note                                                                                                                                                                                                                                                                                                                                                                    |
|------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TableName              | varchar  | The name of the table in the current DB or the specified DB.                                                                                                                                                                                                                                                                                                            |
| Enable                 | varchar  | Whether the dynamic partition property of the table is enabled                                                                                                                                                                                                                                                                                                          |
| TimeUnit               | varchar  | The partition granularity of the dynamic partition table, including `HOUR`, `DAY`, `WEEK`, `MONTH`, `YEAR`.                                                                                                                                                                                                                                                             |
| Start                  | varchar  | The starting offset of the dynamic partition, which is a negative number. The default value is -2147483648, which means that historical partitions will not be deleted. Depending on the time_unit attribute, partitions with a range before this offset will be deleted based on the current day (week/month).                                                         |
| End                    | varchar  | The ending offset of the dynamic partition, which is a positive number. Depending on the time_unit attribute, partitions within the corresponding range are created in advance based on the current day (week/month).                                                                                                                                                   |
| Prefix                 | varchar  | The prefix of the dynamically created partition name.                                                                                                                                                                                                                                                                                                                   |
| Buckets                | varchar  | The number of buckets corresponding to the dynamically created partition.                                                                                                                                                                                                                                                                                               |
| ReplicationNum         | varchar  | The number of replicas corresponding to the dynamically created partition. If not specified, it defaults to the number of replicas specified when the table was created.                                                                                                                                                                                                |
| ReplicaAllocation      | varchar  | The replica distribution strategy corresponding to the dynamically created partition. If not specified, it defaults to the replica distribution strategy specified when the table was created.                                                                                                                                                                          |
| StartOf                | varchar  | The starting point of each partition granularity for dynamic partitioning. When time_unit is WEEK, this field represents the starting point of each week, with values ranging from MONDAY to SUNDAY. When time_unit is MONTH, it represents the starting date of each month, with values ranging from 1rd to 28rd. When time_unit is MONTH, this value defaults to NULL. |
| LastUpdateTime         | datetime | The last update time of the dynamic partition, which defaults to NULL.                                                                                                                                                                                                                                                                                                  |
| LastSchedulerTime      | datetime | The last scheduling time of the dynamic partition.                                                                                                                                                                                                                                                                                                                      |
| State                  | varchar  | The state of the dynamic partition.                                                                                                                                                                                                                                                                                                                                     |
| LastCreatePartitionMsg | varchar  | The error message from the last execution of the dynamic partition addition scheduling.                                                                                                                                                                                                                                                                                                                                                    |
| LastDropPartitionMsg   | varchar  | The error message from the last execution of the dynamic partition deletion scheduling.                                                                                                                                                                                                                                                                                                                                                    |
| ReservedHistoryPeriods | varchar  | The partition range of the historical partitions retained by the dynamic partition, which indicates which historical partitions should be retained in the dynamic partition table instead of being automatically deleted.                                                                                                                                                                                                                                                                                                                       |

## Access Control Requirements
1. If the parameter db_name is not specified, the status of all dynamic partition tables in the current DB will be displayed, and it is assumed that the user has the `SHOW_PRIV` privilege for the current DB by default.
2. If the parameter db_name is specified, the status of all dynamic partition tables in the specified DB will be displayed, and the user needs to have the `SHOW_PRIV` privilege for that DB.

## Examples

1. View the status of all dynamic partition tables in the current database:

 ```sql
SHOW DYNAMIC PARTITION TABLES;
 ```
```text
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| d3        | true   | WEEK     | -3          | 3    | p      | 1       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| d5        | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d4        | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    | 
| d6        | true   | MONTH    | -2147483648 | 2    | p      | 8       | 3rd       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d2        | true   | DAY      | -3          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d7        | true   | MONTH    | -2147483648 | 5    | p      | 8       | 24th      | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
```

2. View the status of all dynamic partition tables in the specified database:

```sql
SHOW DYNAMIC PARTITION TABLES FROM test;
```
```text
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| test1     | true   | WEEK     | -30          | 3    | p      | 8       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| test2     | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| test3     | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    | 
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
```

