---
{
    "title": "rowsets",
    "language": "en"
}
---

## Overview

Returns basic information about the Rowset.

## Database


`information_schema`


## Table Information

| Column Name            | Type        | Description                                                  |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| BACKEND_ID             | bigint      | The ID of the Backend, which is a unique identifier for the Backend. |
| ROWSET_ID              | varchar(64) | The ID of the Rowset, which is a unique identifier for the Rowset. |
| TABLET_ID              | bigint      | The ID of the Tablet, which is a unique identifier for the Tablet. |
| ROWSET_NUM_ROWS        | bigint      | The number of data rows contained in the Rowset.             |
| TXN_ID                 | bigint      | The transaction ID that wrote to the Rowset.                 |
| NUM_SEGMENTS           | bigint      | The number of Segments contained in the Rowset.              |
| START_VERSION          | bigint      | The starting version number of the Rowset.                   |
| END_VERSION            | bigint      | The ending version number of the Rowset.                     |
| INDEX_DISK_SIZE        | bigint      | The storage space for indexes within the Rowset.             |
| DATA_DISK_SIZE         | bigint      | The storage space for data within the Rowset.                |
| CREATION_TIME          | datetime    | The creation time of the Rowset.                             |
| NEWEST_WRITE_TIMESTAMP | datetime    | The most recent write time of the Rowset.                    |
| SCHEMA_VERSION         | int         | The Schema version number of the table corresponding to the Rowset data. |