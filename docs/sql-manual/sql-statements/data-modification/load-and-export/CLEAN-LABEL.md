---
{
    "title": "CLEAN LABEL",
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

Used to manually clean up the labels of historical import jobs. After cleaning up, the labels can be reused.
Commonly used in some automatic import tasks set by programs. When repeated execution, set the label of the imported fixed string.
Before each import task is initiated, execute the statement to clean up the label.

## Syntax  

```sql
CLEAN LABEL [<label>] FROM <db_name>;
```

## Required Parameters

**1. `<db_name>`**  
  label The name of the library.

## Optional Parameters

**1. `<label>`**    
  The label to be cleaned. If omitted, the default is all labels in the current database.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege             | Object     | Notes                                         |
|:----------------------|:-----------|:----------------------------------------------|
| ALTER_PRIV            | Database   | Requires modification access to the database. |


## Examples

- Clean label label1 from database db1

   ```sql
   CLEAN LABEL label1 FROM db1;
   ```

- Clean all labels from database db1

   ```sql
   CLEAN LABEL FROM db1;
   ```

