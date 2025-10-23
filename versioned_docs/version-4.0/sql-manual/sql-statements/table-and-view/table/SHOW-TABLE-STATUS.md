---
{
    "title": "SHOW TABLE STATUS",
    "language": "en"
}
---

## Description

This statement is used to display some information about a table or view.

## Syntax

```sql
SHOW TABLE STATUS [ FROM [ <catalog_name>.]<db_name> ] [ LIKE <like_condition> ]
```
## Optional parameters

**1. ` FROM [ <catalog_name>.]<db_name>`**
> The catalog name and database name to be queried can be specified in the FROM clause.

**2. `LIKE <like_condition>`**
> The LIKE clause can perform fuzzy queries based on the table name.

## Return value

| Column              | DataType | Notes                                                                                                                                                                                                                     |
|:--------------------|:---------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Name                | String   | Table name                                                                                                                                                                                                                |
| Engine              | String   | Storage engine for the table                                                                                                                                                                                              |
| Version             | String   | Version                                                                                                                                                                                                                   |
| Row_format          | String   | Row format. For the MyISAM engine, this may be Dynamic, Fixed, or Compressed. Dynamic rows have variable length, such as Varchar or Blob type fields. Fixed rows have fixed length, such as Char and Integer type fields. |
| Rows                | String   | Number of rows in the table. For non-transactional tables, this value is exact, for transactional engines, this value is usually estimated.                                                                               |
| Avg_row_length      | Integer  | Average number of bytes per row                                                                                                                                                                                           |
| Data_length         | Integer  | The amount of data in the entire table (in bytes)                                                                                                                                                                         |
| Max_data_length     | Integer  | The maximum amount of data that a table can hold                                                                                                                                                                          |
| Index_length        | Integer  | The amount of disk space occupied by an index                                                                                                                                                                             |
| Data_free           | Integer  | For the MyISAM engine, identifies the space that has been allocated but is now unused, and includes the space for deleted rows.                                                                                           |
| Auto_increment      | Integer  | The value of the next Auto_increment                                                                                                                                                                                      |
| Create_time         | Datetime | The creation time of the table                                                                                                                                                                                            |
| Update_time         | Datetime | The last update time of the table                                                                                                                                                                                         |
| Check_time          | Datetime | The last time to check the table using the check table or myisamchk tool                                                                                                                                                  |
| Collation           | String   | The default character set of the table, currently only supports utf-8                                                                                                                                                     |
| Checksum            | String   | If enabled, the checksum calculated for the entire table content                                                                                                                                                          |
| Create_options      | String   | Refers to all other options when the table is created                                                                                                                                                                     |
| Comment             | String   | Table comment                                                                                                                                                                                                             |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Table, View | Currently only supports **ADMIN** permissions to perform this operation |

## Usage Notes

- This statement is mainly used for compatibility with MySQL syntax. Currently, only a small amount of information such as Comment is displayed.

## Examples

- View information about all tables in the current database

    ```sql
    SHOW TABLE STATUS
    ```

    ```text
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | Name       | Engine | Version | Row_format | Rows | Avg_row_length | Data_length | Max_data_length | Index_length | Data_free | Auto_increment | Create_time         | Update_time         | Check_time | Collation | Checksum | Create_options | Comment |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | test_table | Doris  |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:45:36 | 2025-01-22 11:45:36 | NULL       | utf-8     |     NULL | NULL           |         |
    | test_view  | View   |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:46:32 | NULL                | NULL       | utf-8     |     NULL | NULL           |         |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    ```

- View information about tables whose names contain example under the specified database

    ```sql
    SHOW TABLE STATUS FROM db LIKE "%test%"
    ```

    ```text
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | Name       | Engine | Version | Row_format | Rows | Avg_row_length | Data_length | Max_data_length | Index_length | Data_free | Auto_increment | Create_time         | Update_time         | Check_time | Collation | Checksum | Create_options | Comment |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | test_table | Doris  |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:45:36 | 2025-01-22 11:45:36 | NULL       | utf-8     |     NULL | NULL           |         |
    | test_view  | View   |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:46:32 | NULL                | NULL       | utf-8     |     NULL | NULL           |         |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    ```

