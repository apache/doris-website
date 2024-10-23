---
{
    "title": "rowsets",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

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