---
{
"title": "Using MySQL Dump",
"language": "en"
}
---

# Use mysqldump data to export table structure or data
Doris has supported exporting data or table structures through the `mysqldump` tool after version 0.15

## Example
### Export
  1. Export the table1 table in the test database: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1`
  2. Export the table1 table structure in the test database: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test --tables table1 --no-data`
  3. Export all tables in the test1, test2 database: `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --databases test1 test2`
  4. Export all databases and tables `mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces --all-databases`
For more usage parameters, please refer to the manual of `mysqldump`
### Import
The results exported by `mysqldump` can be redirected to a file, which can then be imported into Doris through the source command `source filename.sql`
## Notice
1. Since there is no concept of tablespace in mysql in Doris, add the `--no-tablespaces` parameter when using `mysqldump`
2. Using mysqldump to export data and table structure is only used for development and testing or when the amount of data is small. Do not use it in a production environment with a large amount of data.
