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

The ADD BACKEND command is used to add one or more backend nodes to a Doris OLAP database cluster. This command allows administrators to specify the host and port of the new backend nodes, along with optional properties that configure their behavior.

grammar:

```sql
-- Add nodes (add this method if you do not use the multi-tenancy function)
   ALTER SYSTEM ADD BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...] [PROPERTIES ("key"="value", ...)];
```

### Parameters

* `host` can be a hostname or an ip address of the backend node while `heartbeat_port` is the heartbeat port of the node
* `PROPERTIES ("key"="value", ...)`: (Optional) A set of key-value pairs that define additional properties for the backend nodes. These properties can be used to customize the configuration of the backends being added. Available properties include:

  * tag.location: Specifies the resource group where the backend node belongs. For example, PROPERTIES ("tag.location" = "groupb").

## Example

 1. Adding Backends Without Additional Properties 

    ```sql
    ALTER SYSTEM ADD BACKEND "host1:9020,host2:9020";
    ````

    This command adds two backend nodes to the cluster:

    * host1 with port 9020
    * host2 with port 9020

    No additional properties are specified, so the default settings will apply to these backends.

2. Adding Backends With Resource Group

   ```sql
   ALTER SYSTEM ADD BACKEND "host3:9020" PROPERTIES ("tag.location" = "groupb");
   ```

   This command adds a single backend node (host3 with port 9020) to the cluster in resource group `groupb`:

## Keywords

ALTER, SYSTEM, ADD, BACKEND, PROPERTIES

## Best Practice