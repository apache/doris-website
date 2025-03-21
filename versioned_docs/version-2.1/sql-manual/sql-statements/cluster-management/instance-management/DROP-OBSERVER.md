---
{
    "title": "DROP OBSERVER",
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

## Description

This statement deletes the node with the OBSERVER role of FRONTEND (only used by administrators!)

## Syntax

```sql
ALTER SYSTEM DROP OBSERVER "<observer_host>:<edit_log_port>"
```

## Required Parameters

**1. `<observer_host>`**

> Can be the hostname or IP address of the FE node

**2. `<edit_log_port>`**

> bdbje communication port of FE node, the default is 9010

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Usage Notes

1. After deleting the OBSERVER node, use[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)command to verify that they were successfully deleted.

## Examples

1. Deleting an OBSERVER node

   ```sql
   ALTER SYSTEM DROP OBSERVER "host_ip:9010"
   ```
   This command deletes an OBSERVER node in the cluster (IP host_ip, port 9010)
