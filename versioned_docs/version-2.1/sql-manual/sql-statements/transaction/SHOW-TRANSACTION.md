---
{
    "title": "SHOW TRANSACTION",
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

This syntax is used to view transaction details for the specified transaction id or label.

## Syntax

```sql
SHOW TRANSACTION
[FROM <db_name>]
WHERE
[id = <transaction_id> | label = <label_name>];
```

## Required Parameters

**1. `<transaction_id>`**

The transaction ID whose details need to be viewed.

**2. `<label_name>`**

The label whose transaction details need to be viewed.

## Optional Parameters

**1. `<db_name>`**

The database whose transaction details need to be viewed.

## Return Value

| Column Name         | Description |
|---|---|
| TransactionId       | Transaction ID | 
| Label               | Label associated with the import task | 
| Coordinator         | Node responsible for coordinating the transaction | 
| TransactionStatus   | Status of the transaction | 
| PREPARE             | Preparation phase | 
| COMMITTED           | Transaction succeeded, but data is not visible yet | 
| VISIBLE             | Transaction succeeded, and data is visible  | 
| ABORTED             | Transaction failed | 
| LoadJobSourceType   | Type of the import task | 
| PrepareTime         | Start time of the transaction | 
| CommitTime          | Time when the transaction was successfully committed | 
| FinishTime          | Time when the data became visible | 
| Reason              | Error message | 
| ErrorReplicasCount  | Number of replicas with errors | 
| ListenerId          | ID of the related import job | 
| TimeoutMs           | Transaction timeout duration in milliseconds |

## Access Control Requirements

| Privilege | Object | Notes |
| :-------------- | :----------- | :------------------------ |
| ADMIN_PRIV | Database | Only users with ADMIN_PRIV can perform this operation. |

## Examples

1. View the transaction with id 4005:

   ```sql
   SHOW TRANSACTION WHERE ID=4005;
   ```

2. In the specified db, view the transaction with id 4005:

   ```sql
   SHOW TRANSACTION FROM db WHERE ID=4005;
   ```

3. View the transaction whose label is label_name:

   ```sql
   SHOW TRANSACTION WHERE LABEL = 'label_name';
   ```

