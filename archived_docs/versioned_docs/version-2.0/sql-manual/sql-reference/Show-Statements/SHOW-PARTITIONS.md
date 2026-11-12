---
{
    "title": "SHOW-PARTITIONS",
    "language": "en"
}
---

## SHOW-PARTITIONS

### Name

SHOW PARTITIONS

### Description

  This statement is used to display partition information for tables in Internal catalog or Hive Catalog

grammar:

```SQL
  SHOW [TEMPORARY] PARTITIONS FROM [db_name.]table_name [WHERE] [ORDER BY] [LIMIT];
```

illustrate:

When used in Internal catalog:
1. Support the filtering of PartitionId, PartitionName, State, Buckets, ReplicationNum, LastConsistencyCheckTime and other columns
2. TEMPORARY specifies to list temporary partitions

Please note that:
1. Currently, the where clause only supports the `=`, `!=`, `like` operator for string type PartitionName, State. For the other columns only support operators such as `=`, `!=`, `>`, `<`, `>=`, `<=`.
2. When using the above operators in the where clause, the column name needs to be on the left side.
3. Where clause can contains `AND`.

when used in Hive Catalog:
Will return all partitions' name. Support multilevel partition table



### Example

1. Display all non-temporary partition information of the specified table under the specified db

```SQL
  SHOW PARTITIONS FROM example_db.table_name;
```

2. Display all temporary partition information of the specified table under the specified db

    ```SQL
    SHOW TEMPORARY PARTITIONS FROM example_db.table_name;
    ```

3. Display the information of the specified non-temporary partition of the specified table under the specified db

    ```SQL
     SHOW PARTITIONS FROM example_db.table_name WHERE PartitionName = "p1";
    ```

4. Display the latest non-temporary partition information of the specified table under the specified db

    ```SQL
    SHOW PARTITIONS FROM example_db.table_name ORDER BY PartitionId DESC LIMIT 1;
    ```

### Keywords

    SHOW, PARTITIONS

### Best Practice

