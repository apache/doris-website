---
{
"title": "SHOW DATA SKEW",
"language": "en"
}
---

## SHOW-DATA-SKEW

### Name

SHOW DATA SKEW

### Description

    This statement is used to view the data skew of a table or a partition.

    grammar:

        SHOW DATA SKEW FROM [db_name.]tbl_name [PARTITION (p1)];

	Description:

		1. Only one partition must be specified. For non-partitioned tables, the partition name is the same as the table name.
		2. The result will show row count and data volume of each bucket under the specified partition, and the proportion of the data volume of each bucket in the total data volume.

### Example

    1. View the data skew of the table

        SHOW DATA SKEW FROM db1.test PARTITION(p1);

### Keywords

    SHOW, DATA, SKEW

### Best Practice
