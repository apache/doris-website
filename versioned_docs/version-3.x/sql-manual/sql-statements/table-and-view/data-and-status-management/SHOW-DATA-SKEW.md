---
{
    "title": "SHOW DATA SKEW",
    "language": "en",
    "description": "The SHOW DATA SKEW statement is used to view the data skew of a table or partition. This statement has the following functionalities:"
}
---

## Description

The `SHOW DATA SKEW` statement is used to view the data skew of a table or partition. This statement has the following functionalities:

- It can display the data distribution of the entire table.
- It can display the data distribution of specified partitions.
- It shows the row count, data volume, and percentage for each bucket.
- It supports both partitioned and non-partitioned tables.

## Syntax

```sql
SHOW DATA SKEW FROM [<db_name>.]<table_name> [ PARTITION (<partition_name> [, ...]) ];
```

## Required Parameters

**1. `FROM [<db_name>.]<table_name>`**

> Specifies the name of the table to be viewed. The database name can be included.
>
> The table name must be unique within its database.

## Optional Parameters

**1. `PARTITION (<partition_name> [, ...])`**

> Specifies a list of partition names to be viewed.
>
> If this parameter is not specified, it will display the data distribution for all partitions in the table.
>
> For non-partitioned tables, the partition name is the same as the table name.

## Return Values

| Column Name      | Description                          |
|------------------|--------------------------------------|
| PartitionName    | Partition name                       |
| BucketIdx        | Bucket index number                  |
| AvgRowCount      | Average row count                    |
| AvgDataSize      | Average data size (in bytes)        |
| Graph            | Visualization chart of data distribution |
| Percent          | Percentage of this bucket's data volume relative to total data volume |

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege       | Object      | Notes                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| SELECT          | Table       | SELECT permission is required for viewing the table. |

## Usage Notes

- The data distribution is displayed along two dimensions: partition and bucket.
- The Graph column uses the character `>` to visually represent the data distribution ratio.
- Percentages are accurate to two decimal places.
- For non-partitioned tables, the partition name in the query result is the same as the table name.

## Examples

- Create a partitioned table and view its data distribution:

    ```sql
    CREATE TABLE test_show_data_skew
    (
        id int,
        name string,
        pdate date
    )
    PARTITION BY RANGE(pdate)
    (
        FROM ("2023-04-16") TO ("2023-04-20") INTERVAL 1 DAY
    )
    DISTRIBUTED BY HASH(id) BUCKETS 5
    PROPERTIES (
        "replication_num" = "1"
    );
    ```

- View data distribution for the entire table:


    ```sql
    SHOW DATA SKEW FROM test_show_data_skew;
    ```

    ```text
    +---------------+-----------+-------------+-------------+------------------------------------------------------------------------------------------------------+---------+
    | PartitionName | BucketIdx | AvgRowCount | AvgDataSize | Graph                                                                                                | Percent |
    +---------------+-----------+-------------+-------------+------------------------------------------------------------------------------------------------------+---------+
    | p_20230416    | 0         | 1           | 648         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>                                                    | 49.77 % |
    | p_20230416    | 1         | 2           | 654         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>                                                   | 50.23 % |
    | p_20230416    | 2         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230416    | 3         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230416    | 4         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230417    | 0         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230417    | 1         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230417    | 2         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230417    | 3         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230417    | 4         | 2           | 656         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> | 100.00% |
    | p_20230418    | 0         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230418    | 1         | 1           | 648         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> | 100.00% |
    | p_20230418    | 2         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230418    | 3         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230418    | 4         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230419    | 0         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230419    | 1         | 1           | 648         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>                                                    | 49.96 % |
    | p_20230419    | 2         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230419    | 3         | 1           | 649         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>                                                   | 50.04 % |
    | p_20230419    | 4         | 0           | 0           |                                                                                                      | 00.00 % |
    +---------------+-----------+-------------+-------------+------------------------------------------------------------------------------------------------------+---------+
    ```

    View data distribution for specified partitions:

    ```sql
    SHOW DATA SKEW FROM test_show_data_skew PARTITION(p_20230416, p_20230418);
    ```

    ```text
    +---------------+-----------+-------------+-------------+------------------------------------------------------------------------------------------------------+---------+
    | PartitionName | BucketIdx | AvgRowCount | AvgDataSize | Graph                                                                                                | Percent |
    +---------------+-----------+-------------+-------------+------------------------------------------------------------------------------------------------------+---------+
    | p_20230416    | 0         | 1           | 648         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>                                                    | 49.77 % |
    | p_20230416    | 1         | 2           | 654         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>                                                   | 50.23 % |
    | p_20230416    | 2         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230416    | 3         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230416    | 4         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230418    | 0         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230418    | 1         | 1           | 648         | >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> | 100.00% |
    | p_20230418    | 2         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230418    | 3         | 0           | 0           |                                                                                                      | 00.00 % |
    | p_20230418    | 4         | 0           | 0           |                                                                                                      | 00.00 % |
    +---------------+-----------+-------------+-------------+------------------------------------------------------------------------------------------------------+---------+
    ```

- View data distribution for a non-partitioned table:

    ```sql
    CREATE TABLE test_show_data_skew2
    (
        id int,
        name string,
        pdate date
    )
    DISTRIBUTED BY HASH(id) BUCKETS 5
    PROPERTIES (
        "replication_num" = "1"
    );
    ```

    ```sql
    SHOW DATA SKEW FROM test_show_data_skew2;
    ```

    ```text
    +----------------------+-----------+-------------+-------------+---------------------------+---------+
    | PartitionName        | BucketIdx | AvgRowCount | AvgDataSize | Graph                     | Percent |
    +----------------------+-----------+-------------+-------------+---------------------------+---------+
    | test_show_data_skew2 | 0         | 1           | 648         | >>>>>>>>>>>>>>>>>>>>>>>>  | 24.73 % |
    | test_show_data_skew2 | 1         | 4           | 667         | >>>>>>>>>>>>>>>>>>>>>>>>> | 25.46 % |
    | test_show_data_skew2 | 2         | 0           | 0           |                           | 00.00 % |
    | test_show_data_skew2 | 3         | 1           | 649         | >>>>>>>>>>>>>>>>>>>>>>>>  | 24.77 % |
    | test_show_data_skew2 | 4         | 2           | 656         | >>>>>>>>>>>>>>>>>>>>>>>>> | 25.04 % |
    +----------------------+-----------+-------------+-------------+---------------------------+---------+
    ```