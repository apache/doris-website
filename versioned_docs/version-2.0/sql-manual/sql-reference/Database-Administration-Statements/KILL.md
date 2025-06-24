---
{
    "title": "KILL",
    "language": "en"
}
---

## KILL

### Name

KILL

### Description

Each Doris connection runs in a separate thread. You can kill a thread with the KILL processlist_id statement.

The thread process list identifier can be determined from the ID column of the INFORMATION_SCHEMA PROCESSLIST table, the Id column of the SHOW PROCESSLIST output, and the PROCESSLIST_ID column of the Performance Schema thread table.

grammar:

```sql
KILL [CONNECTION] processlist_id
```

In addition, you can also use processlist_id or query_id terminates the executing query command

grammar:

```sql
KILL QUERY processlist_id | query_id
```


### Example

### Keywords

    KILL

### Best Practice

