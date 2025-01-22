---
{
    "title": "SET DEFAULT STORAGE VAULT",
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

This statement is used to set the default storage vault in Doris. The default storage vault is used to store data for internal or system tables. If the default storage vault is not set, Doris will not function properly. Once the default storage vault is set, it cannot be removed.

## Syntax

```sql
SET vault_name DEFAULT STORAGE VAULT
```

> Note:
>
> 1. Only ADMIN users can set the default storage vault.

## Example

1. Set the storage vault named 's3_vault' as the default storage vault.

   ```sql
   SET s3_vault AS DEFAULT STORAGE VAULT;
   ```

## Related Commands

## Keywords

    SET, DEFAULT, STORAGE, VAULT