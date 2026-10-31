---
{
    "title": "SET TABLE PARTITION VERSION",
    "language": "en",
    "description": "In compute-storage coupled mode. This statement is used to manually change the visible version of the specified partition. In some special cases,"
}
---

## Description

In compute-storage coupled mode. This statement is used to manually change the visible version of the specified partition. In some special cases, the version of the partition in the metadata may be inconsistent with the version of the actual replica. 

This command can manually change the version of the partition in the metadata. This command is generally only used for emergency failure recovery. Please operate with caution.

## Syntax

```sql
ADMIN SET TABLE <table_name> PARTITION VERSION PROPERTIES ("<partition_id>" = "visible_version>");
```

## Required Parameters

<table_name>

> The name of the table to be set.

<partition_id>

> Specify a Partition Id.

<visible_version>

> Specify Version.

## Examples

1. Set the version of the partition with partition_id 10075 to 100 in the FE metadata.

  ```sql
  ADMIN SET TABLE __internal_schema.audit_log PARTITION VERSION PROPERTIES("partition_id" = "10075", "visible_version" = "100");
  ```
## Usage Note

1. Before setting the partition version, you need to confirm the version of the actual replica on the BE machine. This command is generally only used for emergency failure recovery. Please operate with caution.
2. This command is not supported in the storage-computing separation mode. It will not take effect if set.