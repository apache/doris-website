---
{
    "title": "CLEAN LABEL",
    "language": "en"
}
---

## Description

Used to manually clean up the labels of historical import jobs. After cleaning up, the labels can be reused.
Commonly used in some automatic import tasks set by programs. When repeated execution, set the label of the imported fixed string.
Before each import task is initiated, execute the statement to clean up the label.

## Syntax  

```sql
CLEAN LABEL [ <label> ] FROM <db_name>;
```

## Required Parameters

**1. `<db_name>`**  
  label The name of the library.

## Optional Parameters

**1. `<label>`**    
  The label to be cleaned. If omitted, the default is all labels in the current database.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege             | Object     | Notes                                         |
|:----------------------|:-----------|:----------------------------------------------|
| ALTER_PRIV            | Database   | Requires modification access to the database. |


## Examples

- Clean label label1 from database db1

   ```sql
   CLEAN LABEL label1 FROM db1;
   ```

- Clean all labels from database db1

   ```sql
   CLEAN LABEL FROM db1;
   ```

