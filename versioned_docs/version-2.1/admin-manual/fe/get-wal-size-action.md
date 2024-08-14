---
{
    "title": "Get Small File Action",
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

# Get WAL size

## Request

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## Description

This HTTP interface allows users to obtain the number of WAL files for specified Backends (BEs). If no BE is specified, it returns the number of WAL files for all BEs.

## Path parameters

None

## Query parameters

* `host_ports`

    The IP and HTTP port of the BE.

## Request body

None

## Response

```
{
"msg": "OK",
"code": 0,
"data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
"count": 0
}
```

## Examples

1. To obtain the number of WAL files for all BEs.

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
    "count": 0
    }
    ```
    
    In the returned result, the number following each BE indicates the number of WAL files for that BE.

2. To obtain the number of WAL files for a specified BE.

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size?192.168.10.11:9050"
    
    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1"],
    "count": 0
    }
    ```
    
    In the returned result, the number following the BE indicates the number of WAL files for that BE.
