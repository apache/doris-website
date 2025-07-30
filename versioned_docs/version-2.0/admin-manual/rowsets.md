---
{
    "title": "Using rowsets",
    "language": "en"
}
---

## rowsets

### Name

rowsets

### description

`rowsets` is a built-in system table of doris, which is stored under the information_schema database. You can view the current rowsets information of each `BE` through the `rowsets` system table.

The `rowsets` table schema is:
```sql
MySQL [(none)]> desc information_schema.rowsets;
+------------------------+------------+------+-------+---------+-------+
| Field                  | Type       | Null | Key   | Default | Extra |
+------------------------+------------+------+-------+---------+-------+
| BACKEND_ID             | BIGINT     | Yes  | false | NULL    |       |
| ROWSET_ID              | VARCHAR(*) | Yes  | false | NULL    |       |
| TABLET_ID              | BIGINT     | Yes  | false | NULL    |       |
| ROWSET_NUM_ROWS        | BIGINT     | Yes  | false | NULL    |       |
| TXN_ID                 | BIGINT     | Yes  | false | NULL    |       |
| NUM_SEGMENTS           | BIGINT     | Yes  | false | NULL    |       |
| START_VERSION          | BIGINT     | Yes  | false | NULL    |       |
| END_VERSION            | BIGINT     | Yes  | false | NULL    |       |
| INDEX_DISK_SIZE        | BIGINT     | Yes  | false | NULL    |       |
| DATA_DISK_SIZE         | BIGINT     | Yes  | false | NULL    |       |
| CREATION_TIME          | BIGINT     | Yes  | false | NULL    |       |
| NEWEST_WRITE_TIMESTAMP | BIGINT     | Yes  | false | NULL    |       |
+------------------------+------------+------+-------+---------+-------+
```

### Example

```sql
select * from information_schema.rowsets where BACKEND_ID = 10004 limit 10;
+------------+--------------------------------------------------+-----------+-----------------+--------+--------------+---------------+-------------+-----------------+----------------+---------------+------------------------+------------------------+
| BACKEND_ID | ROWSET_ID                                        | TABLET_ID | ROWSET_NUM_ROWS | TXN_ID | NUM_SEGMENTS | START_VERSION | END_VERSION | INDEX_DISK_SIZE | DATA_DISK_SIZE | CREATION_TIME | OLDEST_WRITE_TIMESTAMP | NEWEST_WRITE_TIMESTAMP |
+------------+--------------------------------------------------+-----------+-----------------+--------+--------------+---------------+-------------+-----------------+----------------+---------------+------------------------+------------------------+
|      10004 | 02000000000000994847fbd41a42297d7c7a57d3bcb46f8c |     10771 |           66850 |      6 |            1 |             3 |           3 |            2894 |         688855 |    1659964582 |             1659964581 |             1659964581 |
|      10004 | 020000000000008d4847fbd41a42297d7c7a57d3bcb46f8c |     10771 |           66850 |      2 |            1 |             2 |           2 |            2894 |         688855 |    1659964575 |             1659964574 |             1659964574 |
|      10004 | 02000000000000894847fbd41a42297d7c7a57d3bcb46f8c |     10771 |               0 |      0 |            0 |             0 |           1 |               0 |              0 |    1659964567 |             1659964567 |             1659964567 |
|      10004 | 020000000000009a4847fbd41a42297d7c7a57d3bcb46f8c |     10773 |           66639 |      6 |            1 |             3 |           3 |            2897 |         686828 |    1659964582 |             1659964581 |             1659964581 |
|      10004 | 020000000000008e4847fbd41a42297d7c7a57d3bcb46f8c |     10773 |           66639 |      2 |            1 |             2 |           2 |            2897 |         686828 |    1659964575 |             1659964574 |             1659964574 |
|      10004 | 02000000000000884847fbd41a42297d7c7a57d3bcb46f8c |     10773 |               0 |      0 |            0 |             0 |           1 |               0 |              0 |    1659964567 |             1659964567 |             1659964567 |
|      10004 | 02000000000000984847fbd41a42297d7c7a57d3bcb46f8c |     10757 |           66413 |      6 |            1 |             3 |           3 |            2893 |         685381 |    1659964582 |             1659964581 |             1659964581 |
|      10004 | 020000000000008c4847fbd41a42297d7c7a57d3bcb46f8c |     10757 |           66413 |      2 |            1 |             2 |           2 |            2893 |         685381 |    1659964575 |             1659964574 |             1659964574 |
|      10004 | 02000000000000874847fbd41a42297d7c7a57d3bcb46f8c |     10757 |               0 |      0 |            0 |             0 |           1 |               0 |              0 |    1659964567 |             1659964567 |             1659964567 |
|      10004 | 020000000000009c4847fbd41a42297d7c7a57d3bcb46f8c |     10739 |            1698 |      8 |            1 |             3 |           3 |             454 |          86126 |    1659964582 |             1659964582 |             1659964582 |
+------------+--------------------------------------------------+-----------+-----------------+--------+--------------+---------------+-------------+-----------------+----------------+---------------+------------------------+------------------------+
```

### KeyWords

    rowsets, information_schema

### Best Practice