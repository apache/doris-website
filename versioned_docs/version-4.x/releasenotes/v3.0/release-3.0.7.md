---
{
    "title": "Release 3.0.7",
    "language": "en",
    "description": "Behavior Changes:Adjust the permission requirements for show frontends and show backends to align with the corresponding RESTful API, i.e., requiring the SELECT_PRIV permission on the information_schema database"
}
---

## Behavior Changes

- Adjust the permission requirements for `show frontends` and `show backends` to align with the corresponding RESTful API, i.e., requiring the `SELECT_PRIV` permission on the `information_schema` database
- Admin and root users with specified domains are no longer considered system users 
- Storage: The default number of concurrent transactions per database is adjusted to 10000

## New Features

### Query Optimizer

- Support MySQL's aggregate roll-up syntax `GROUP BY ... WITH ROLLUP`

### Query Execution

- `Like` statement supports `escape` syntax

### Semi-structured Data Management

- Support building non-tokenized inverted indexes and ngram bloomfilter indexes only for new data by setting the session variable `enable_add_index_for_new_data=true` 


### New Functions

- Added data functions: `cot`/`sec`/`cosec`

## Improvements

### Data Ingestion

- Optimize error message prompts for `SHOW CREATE LOAD`

### Primary Key Model

- Add segment key bounds truncation capability to avoid single large import failures

### Storage

- Enhance the reliability of compaction and imported data
- Optimize balance speed
- Optimize table creation speed 
- Optimize compaction default parameters and observability 
- Optimize the issue of query error -230 
- Add system table `backend_tablets` 
- Optimize the performance of querying `information_schema.tables` from follower nodes in cloud mode 

### Storage-Compute Decoupled

- Enhance observability of Meta-service recycler
- Support cross-compute group incremental preheating during import compaction 
- Optimize Storage vault connectivity check
- Support updating storage backend information via MS API 

### Lakehouse

- Optimize ORC zlib decompression performance in x86 environment and fix potential issues 
- Optimize the default number of concurrent threads for external table reading
- Optimize error messages for Catalogs that do not support DDL operations

### Asynchronous Materialized Views

- Optimize the performance of transparent rewriting planning

### Query Optimizer

- The `group_concat` function now allows parameters of non-string types
- The `sum` and `avg` functions allow parameters of non-numeric types 
- Expand the scope of support for delayed materialization in TOP-N queries, enabling delayed materialization when querying partial columns
- When creating partitions, list partitions allow inclusion of `MAX_VALUE`
- Optimize the performance of sampling and collecting statistical information for aggregate model tables
- Optimize the accuracy of NDV values when sampling and collecting statistical information 

### Inverted Index

- Unify the order of properties displayed for inverted indexes in `show create table`
- Add per-condition profile metrics (such as hit rows and execution time) for inverted index filter conditions to facilitate performance analysis
- Enhance the display of inverted index-related information in profiles

### Permissions

- Ranger supports setting permissions for storage vault and compute group

## Bug Fixes

### Data Ingestion

- Fix the correctness issue that may occur when importing CSV files with multi-character separators 
- Fix the issue where the result of `ROUTINE LOAD` task display is incorrect after modifying task properties
- Fix the issue where the one-stream multi-table import plan becomes invalid after primary node restart or Leader switch
- Fix the issue where all scheduling tasks are blocked because `ROUTINE LOAD` tasks cannot find available BE nodes
- Fix the concurrent read-write conflict issue of `runningTxnIds`

### Primary Key Model

- Optimize the import performance of mow tables under high-frequency concurrent imports
- mow table full compaction releases space of deleted data
- Fix the potential import failure issue of mow tables in extreme scenarios
- Optimize the compaction performance of mow tables
- Fix the potential correctness issue of mow tables during concurrent imports and schema changes
- Fix the issue where schema change on empty mow tables may cause import stuck or schema change failure
- Fix the memory leak issue of mow delete bitmap cache
- Fix the potential correctness issue of mow tables after schema change

### Storage

- Fix the missing rowset issue in clone process caused by compaction
- Fix the issue of inaccurate size calculation and default value for autobucket
- Fix the potential correctness issue caused by bucket columns
- Fix the issue where single-column tables cannot be renamed
- Fix the potential memory leak issue of memtable 
- Fix the inconsistent error reporting issue for unsupported operations in empty table transaction writes

### Storage-Compute Decoupled

- Several fixes for File cache 
- Fix the issue where cumulative point may roll back during schema process
- Fix the issue where background tasks affect automatic restart
- Fix the unhandled exception issue in data recycling process in azure environment 
- Fix the issue where file cache is not cleaned up in time when compacting a single rowset 

### Lakehouse

- Fix the transaction commit failure issue for Iceberg table writes in Kerberos environment 
- Fix the query issue for hudi in kerberos environment 
- Fix the potential deadlock issue in multi-Catalog scenarios
- Fix the metadata inconsistency issue caused by concurrent Catalog refresh in some cases 
- Fix the issue where ORC footer is read multiple times in some cases 
- Fix the issue where Table Valued Function cannot read compressed json files
- SQL Server Catalog supports identifying IDENTITY column information
- SQL Convertor supports specifying multiple URLs for high availability

### Asynchronous Materialized Views

- Fix the issue where partition compensation may be performed incorrectly when the query is optimized to an empty result set

### Query Optimizer

- Fix the issue where factors other than `sql_select_limit` affect DML execution results 
- Fix the issue where materialized CTEs may report errors in extreme cases when starting local shuffle
- Fix the issue where prepared insert statements cannot be executed on non-master nodes 
- Fix the result error issue when casting `ipv4` to string 

### Permissions

- When a user has multiple roles, the permissions of the multiple roles will be merged before authorization 

### Query Execution

- Fix issues with some json functions
- Fix the potential BE Core issue when the asynchronous thread pool is full
- Fix the incorrect result issue of `hll_to_base64` 
- Fix the result error issue when casting `decimal256` to float 
- Fix two memory leak issues
- Fix the be core issue caused by `bitmap_from_base64`
- Fix the potential be core issue caused by `array_map` function 
- Fix the potential error issue of `split_by_regexp` function 
- Fix the potential result error issue of `bitmap_union` function under extremely large data volumes 
- Fix the potential core issue of `format round` function under some boundary values 

### Inverted Index

- Fix the memory leak issue of inverted indexes in abnormal situations
- Fix the error reporting issue when writing and querying empty index files
- Capture IO exceptions in inverted index string reading to avoid process crash due to exceptions 

### Complex Data Types

- Fix the potential type inference error when Variant Nested data types conflict
- Fix the parameter type inference error of `map` function
- Fix the issue where data is incorrectly converted to NULL when specifying `'$.'` as the path in jsonpath
- Fix the issue where the serialization format cannot be restored when a subfield of Variant contains `.`

### Others

- Fix the insufficient length issue of the IP field in the auditlog table
- Fix the issue where the query id recorded in the audit log is that of the previous query when SQL parsing fails 