---
{
    "title": "SHOW-CATALOG-RECYCLE-BIN",
    "language": "en"
}
---

## SHOW-CATALOG-RECYCLE-BIN

### Name

SHOW CATALOG RECYCLE BIN

### Description

This statement is used to display the dropped meta informations that can be recovered

grammar:

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "name" | LIKE "name_matcher"] ]
```

grammar: 

```
The meaning of each column is as follows:
        Type：                type of meta information:Database、Table、Partition
        Name：                name of meta information
        DbId：                id of database
        TableId：             id of table
        PartitionId：         id of partition
        DropTime：            drop time of meta information
```

### Example

 1. Display all meta informations that can be recovered
    
      ```sql
       SHOW CATALOG RECYCLE BIN;
      ```

 2. Display meta informations with name 'test'
    
      ```sql
       SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
      ```

### Keywords

    SHOW, CATALOG RECYCLE BIN

### Best Practice

