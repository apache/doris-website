---
{
"title": "ALTER STORAGE VAULT",
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

Modify the mutable properties of a Storage Vault.

## Syntax

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```

## Required Parameters

**<storage_vault_property>**

> - type: Optional values are s3, hdfs

>When type is s3, the allowed property fields are as follows:
>
>- s3.access_key: ak for s3 vault
>- s3.secret_key: sk for s3 vault
>- vault_name: The name of the vault.
>- use_path_style: Whether to allow path style url, optional values are true, false. The default value is false.

>When type is hdfs, the following fields are prohibited:
>
>- path_prefix: Storage path prefix
>- fs.defaultFS: hdfs name

## Permission Control

The user executing this SQL command must have at least ADMIN_PRIV permissions.

## Examples

Modify s3 storage vault ak

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```

Modify hdfs storage vault

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```
