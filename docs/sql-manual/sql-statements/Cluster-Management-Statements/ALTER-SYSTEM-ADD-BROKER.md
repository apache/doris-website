---
{
    "title": "ALTER-SYSTEM-ADD-BROKER",
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

This statement is used to add one or more BROKER nodes. (For administrators only!)

## Syntax

```sql
ALTER SYSTEM ADD BROKER broker_name "<host1>:<ipc_port>","<host2>:<ipc_port>", ...;
```

## Required Parameters

**1. broker_name**
The name given to the added broker process. It is recommended to keep the broker_name consistent within the same cluster.

**2. host**
The IP of the node where the broker process needs to be added. If FQDN is enabled, use the FQDN of the node.

**3. ipc_port**
The PORT of the node where the broker process needs to be added, and the default value of this port is 8000.

## Output
No Output Fields

## Access Control Requirements
The user who executes this operation needs to have the NODE_PRIV permission.

## Examples

1. Add two Brokers

```sql
ALTER SYSTEM ADD BROKER "host1:port", "host2:port";
```
2. Add a Broker using FQDN

```sql
ALTER SYSTEM ADD BROKER "broker_fqdn1:port";
```


