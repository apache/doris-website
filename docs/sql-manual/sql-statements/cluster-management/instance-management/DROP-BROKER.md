---
{
   "title": "DROP BROKER",
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

This statement is used to delete BROKER nodes.

## Syntax

1. Drop all Brokers
    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. Drop one or more Broker nodes
    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## Required Parameters

**1. `<broker_name>`**

The name of the broker process to be deleted.

**2. `<host>`**

The IP of the node where the broker process to be deleted is located. If FQDN is enabled, use the FQDN of the node.

**3. `<ipc_port>`**
The PORT of the node where the broker process to be deleted is located, and the default value of this port is 8000.


## Access Control Requirements
The user who executes this operation needs to have the NODE_PRIV permission.

## Examples

1. Delete all Brokers

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name.
    ```

2. Delete a specific Broker node

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "10.10.10.1:8000";
    ```