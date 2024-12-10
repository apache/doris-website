---
{
    "title": "CREATE STORAGE POLICY",
    "language": "en",
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

To create a storage policy, you must first create a storage resource, and then associate the created storage resource name when creating the migration policy. For details, refer to the RESOURCE section.

## Syntax

```sql
CREATE STORAGE POLICY <policy_name>
PROPERTIES(
    "storage_resource" = "<storage_resource_name>"
    [{， "cooldown_datetime" = "<cooldown_datetime>"
    ｜ ， "cooldown_ttl" = "<cooldown_ttl>"}]
);
```

## Required Parameters

1. `<policy_name>`: The name of the storage policy to be created
2. `<storage_resource_name>`: The name of the associated storage resource. For details on how to create it, refer to the RESOURCE section

## Optional Parameters

1. `<cooldown_datetime>`: Specifies the cooldown time for creating the data migration policy
2. `<cooldown_ttl>`: Specifies the duration of hot data for creating the data migration policy

## Access Control Requirements

The prerequisite for successfully executing this SQL command is to have ADMIN_PRIV privileges. Refer to the privilege document.

| Privilege  | Object                               | Notes                           |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | Entire cluster management privileges | All privileges except NODE_PRIV |

## Examples

1. Create a data migration policy with a specified data cooldown time.

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_datetime" = "2022-06-08 00:00:00"
    );
    ```

2. Create a data migration policy with a specified duration of hot data

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_ttl" = "1d"
    );
    ```