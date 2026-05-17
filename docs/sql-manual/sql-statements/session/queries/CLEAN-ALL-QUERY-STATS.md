---
{
    "title": "CLEAN ALL QUERY STATS",
    "language": "en",
    "description": "This statement is used to clear query statistics"
}
---

## Description

This statement is used to clear query statistics

## Syntax

```sql
CLEAN [ { ALL| DATABASE | TABLE } ] QUERY STATS [ { [ FOR <db_name>] | [ { FROM | IN } ] <table_name>]];
```

## Required Parameters

**1. `ALL`**

> Use ALL to clear all query statistics

**2. `DATABASE`**

> Use DATABASE to clear database query statistics

**3. `TABLE`**

> Use TABLE to clear table query statistics

## Optional Parameters

**1. `<db_name>`**

> If this parameter is set, the statistics of the corresponding database are cleared

**2. `<table_name>`**

> If this parameter is set, the statistics of the corresponding table are cleared


## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege  | Object   | Notes                 |
|:-----------|:---------|:--------------------------|
| ADMIN_PRIV | ALL      | If ALL is specified, the ADMIN permission is required     |
| ALTER_PRIV | DATABASE | If the database is specified, the ALTER permission for the corresponding database is required |
| ADMIN_PRIV | TABLE    | If you specify a table, you need alter permission for that table     |


## Examples

```sql
clean all query stats
```

```sql
clean database query stats for test_query_db
```

```sql
clean table query stats from test_query_db.baseall
```


