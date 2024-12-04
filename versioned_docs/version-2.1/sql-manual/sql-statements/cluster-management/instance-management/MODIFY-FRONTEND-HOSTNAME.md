---
{
    "title": "MODIFY FRONTEND HOSTNAME",
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

Modify the properties of the FRONTEND (hereinafter referred to as FE). Currently, this command can only modify the HOSTNAME of the FE. When the hostname of the host where a certain FE instance in the cluster is running needs to be changed, this command can be used to change the hostname registered by this FE in the cluster so that it can continue to operate normally.

This command is only used to convert the DORIS cluster to FQDN deployment. For details on FQDN deployment, please refer to the "FQDN" chapter.

## Syntax

```sql
ALTER SYSTEM MODIFY FRONTEND "<frontend_hostname_port>" HOSTNAME "<frontend_new_hostname>"
```
## Required Parameters

**<frontend_hostname_port>**

> The hostname and edit log port registered by the FE whose hostname needs to be changed. You can view information about all FEs in the cluster by using the SHOW FRONTENDS command. For detailed usage, please refer to the "SHOW FRONTENDS" chapter.

**<frontend_new_hostname>**

> The new hostname of the FE.

## Access Control Requirements

The user executing this SQL command must have at least NOD_PRIV permissions.

## Examples

Change the hostname of an FE instance in the cluster from 10.10.10.1 to 172.22.0.1:

```sql
ALTER SYSTEM
MODIFY FRONTEND "10.10.10.1:9010"
HOSTNAME "172.22.0.1"
```