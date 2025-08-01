---
{
    "title": "ADMIN SHOW TABLET STORAGE FORMAT",
    "language": "en"
}
---

## ADMIN SHOW TABLET STORAGE FORMAT
### description
    This statement is used to display tablet storage format information (for administrators only)
    Grammar:
        ADMIN SHOW TABLET STORAGE FORMAT [VERBOSE]

### example
    MySQL [(none)]> admin show tablet storage format;
    +-----------+---------+---------+
    | BackendId | V1Count | V2Count |
    +-----------+---------+---------+
    | 10002     | 0       | 2867    |
    +-----------+---------+---------+
    1 row in set (0.003 sec)
    MySQL [test_query_qa]> admin show tablet storage format verbose;
    +-----------+----------+---------------+
    | BackendId | TabletId | StorageFormat |
    +-----------+----------+---------------+
    | 10002     | 39227    | V2            |
    | 10002     | 39221    | V2            |
    | 10002     | 39215    | V2            |
    | 10002     | 39199    | V2            |
    +-----------+----------+---------------+
    4 rows in set (0.034 sec)

### keywords
    ADMIN, SHOW, TABLET, STORAGE, FORMAT, ADMIN SHOW

