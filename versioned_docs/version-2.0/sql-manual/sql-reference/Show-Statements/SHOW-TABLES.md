---
{
    "title": "SHOW-TABLES",
    "language": "en"
}
---

## SHOW-TABLES

### Name

SHOW TABLES

### Description

This statement is used to display all tables under the current db

grammar:

```sql
SHOW [FULL] TABLES [LIKE]
```

illustrate:

1. LIKE: Fuzzy query can be performed according to the table name

### Example

  1. View all tables under DB

     ```sql
     mysql> show tables;
     +---------------------------------+
     | Tables_in_demo                  |
     +---------------------------------+
     | ads_client_biz_aggr_di_20220419 |
     | cmy1                            |
     | cmy2                            |
     | intern_theme                    |
     | left_table                      |
     +---------------------------------+
     5 rows in set (0.00 sec)
     ```

2. Fuzzy query by table name

    ```sql
    mysql> show tables like '%cm%';
    +----------------+
    | Tables_in_demo |
    +----------------+
    | cmy1           |
    | cmy2           |
    +----------------+
    2 rows in set (0.00 sec)
    ```

### Keywords

    SHOW, TABLES

### Best Practice

