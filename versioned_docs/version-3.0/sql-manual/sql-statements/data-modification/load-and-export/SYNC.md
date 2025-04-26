---
{
    "title": "SYNC",
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

This statement is used to synchronize metadata for non-master Frontend (FE) nodes. In Apache Doris, only the master FE node can write metadata, while other FE nodes forward metadata write operations to the master. After the master completes the metadata writing operation, non-master nodes may experience a short delay in replaying the metadata. You can use this statement to force synchronization of metadata.

## Syntax

```sql
SYNC;
```

## Access Control Requirements  

Any user or role can perform this operation.


## Examples

Synchronize metadata:

    ```sql
    SYNC;
    ```