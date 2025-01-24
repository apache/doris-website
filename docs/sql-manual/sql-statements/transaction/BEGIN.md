---
{
    "title": "BEGIN",
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

Users can specify a Label. If not specified, the system will generate a Label automatically.

## Syntax

```sql
BEGIN [ WITH LABEL <label> ]
```

## Optional Parameter

`[ WITH LABEL <label> ]`

> Explicitly specify the Label associated with the transaction. If not specified, the system will generate a [label](../../../data-operate/transaction) automatically.

## Notes

- If an explicit transaction is started without a commit or rollback, executing the BEGIN command again will not take effect.

## Examples

Start an explicit transaction using a system-generated Label

```sql
mysql> BEGIN;
{'label':'txn_insert_624a0e16ef4c43d4-9814c7fa3e83a705', 'status':'PREPARE', 'txnId':''}
```

Start an explicit transaction with a specified Label

```sql
mysql> BEGIN WITH LABEL load_1;
{'label':'load_1', 'status':'PREPARE', 'txnId':''}
```
