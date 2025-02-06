---
{
    "title": "ADD BACKEND",
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

The ADD BACKEND is used to add one or more BE nodes to the Doris cluster. This command allows administrators to specify the host and port of the new BE nodes, as well as optional properties to configure their behavior.

## Syntax

```sql
ALTER SYSTEM ADD BACKEND "<host>:<heartbeat_port>"[,"<host>:<heartbeat_port>" [, ...]] [PROPERTIES ("<key>"="<value>" [, ...] )]
```

## Required Parameters

**1. <host>**

> It can be the hostname or IP address of the BE node.

**2. <heartbeat_port>**

> The heartbeat port of the BE node, the default is 9050.

## Optional Parameters

**1. `PROPERTIES ("<key>"="<value>" [, ... ] )`**

> A set of key-value pairs used to define additional properties of the BE node. These properties can be used to customize the configuration of the BE being added. Available properties include:
> - `tag.location`: Used to specify the Resource Group to which the BE node belongs.

## Access Control Requirements

The user executing this SQL must have at least the following permissions:

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Usage Notes

1. Before adding a new BE node, make sure the node is correctly configured and running.
2. Using [Resource Group](../../../../admin-manual/workload-management/resource-group.md) can help you better manage and organize the BE nodes in the cluster.
3. When adding multiple BE nodes, you can specify them in one command to improve efficiency.
3. After adding the BE nodes, use the [`SHOW BACKENDS`](./SHOW-BACKENDS.md) to verify whether they have been successfully added and are in a normal state.
4. Consider adding BE nodes in different physical locations or racks to improve the availability and fault tolerance of the cluster.
5. Regularly check and balance the load in the cluster to ensure that the newly added BE nodes are properly utilized.

## Examples

1. Add BE nodes without additional properties
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.0.1:9050,192.168.0.2:9050";
   ```
   This command adds two BE nodes to the cluster:
   * 192.168.0.1，port 9050
   * 192.168.0.2，port 9050
   No additional properties are specified, so the default settings will be applied.

2. Add a BE node to a specified Resource Group
   ```sql
   ALTER SYSTEM ADD BACKEND "doris-be01:9050" PROPERTIES ("tag.location" = "groupb");
   ```
   This command adds a single BE node (hostname doris-be01, port 9050) to the Resource Group `groupb` in the cluster.
