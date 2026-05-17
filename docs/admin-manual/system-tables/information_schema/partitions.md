---
{
    "title": "partitions",
    "language": "en",
    "description": "Show the Partition status of all tables in the database."
}
---

## Overview

Show the Partition status of all tables in the database.

## Database

`information_schema`

## Table Information

| Column Name                   | Type          | Description                          |
| ----------------------------- | ------------- | ------------------------------------ |
| PARTITION_ID	                | bigint        | Partitinon ID                        |
| TABLE_CATALOG                 | varchar(64)   | Catalog name                         |
| TABLE_SCHEMA                  | varchar(64)   | Database name                        |
| TABLE_NAME                    | varchar(64)   | Table name                           |
| PARTITION_NAME                | varchar(64)   | Partition name                       |
| SUBPARTITION_NAME             | varchar(64)   | Always empty                         |
| PARTITION_ORDINAL_POSITION    | int           | Ordinal position of the partition    |
| SUBPARTITION_ORDINAL_POSITION | int           | Always empty                         |
| PARTITION_METHOD              | varchar(13)   | Partition method                     |
| SUBPARTITION_METHOD           | varchar(13)   | Always empty                         |
| PARTITION_EXPRESSION          | varchar(2048) | Partition expression                 |
| SUBPARTITION_EXPRESSION       | varchar(2048) | Always empty                         |
| PARTITION_DESCRIPTION         | text          | Partition description                |
| TABLE_ROWS                    | bigint        |                                      |
| AVG_ROW_LENGTH                | bigint        |                                      |
| DATA_LENGTH                   | bigint        |                                      |
| MAX_DATA_LENGTH               | bigint        |                                      |
| INDEX_LENGTH                  | bigint        |                                      |
| DATA_FREE                     | bigint        |                                      |
| CREATE_TIME                   | bigint        |                                      |
| UPDATE_TIME                   | datetime      |                                      |
| CHECK_TIME                    | datetime      |                                      |
| CHECKSUM                      | bigint        |                                      |
| PARTITION_COMMENT             | text          |                                      |
| NODEGROUP                     | varchar(256)  |                                      |
| TABLESPACE_NAME               | varchar(268)  |                                      |
| LOCAL_DATA_SIZE               | text	        | Partition local data size            |
| REMOTE_DATA_SIZE              | text          | Partition remote data size (cloud)   |
| STATE                         | text	        | Partition state                      |
| REPLICA_ALLOCATION  	        | text	        | distribution of replicas of a tablet |
| REPLICA_NUM                   | int 	        | replicas num                         |
| STORAGE_POLICY                | text          | Storage policy                       |
| STORAGE_MEDIUM                | text          | Storage medium                       |
| COOLDOWN_TIME_MS              | text          | Cooldown time                        |
| LAST_CONSISTENCY_CHECK_TIME   | text          | Last consistency check time          |
| BUCKET_NUM                    | int           | Partition bucket num                 |
| COMMITTED_VERSION             | bigint        | Last commited version                |
| VISIBLE_VERSION               | bigint        | Current visible version              |
| PARTITION_KEY                 | text          | Partition key                        |
| RANGE                         | text          | Partition range(min max value)       |
| DISTRIBUTION                  | text          | Distribution type                    |
