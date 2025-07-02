---
{
    "title": "SHOW-TYPECAST",
    "language": "en"
}
---

## SHOW-TYPECAST

### Name

SHOW TYPECAST

### Description

View all type cast under the database. If the user specifies a database, then view the corresponding database, otherwise directly query the database where the current session is located

Requires `SHOW` permission on this database

grammar

```sql
SHOW TYPE_CAST [IN|FROM db]
```

 Parameters

>`db`: database name to query

### Example

```sql
mysql> show type_cast in testDb\G
**************************** 1. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 2. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 3. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2

3 rows in set (0.00 sec)
```

### Keywords

    SHOW, TYPECAST

### Best Practice

