---
{
    "title": "SHOW STORAGE VAULTS",
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

The SHOW STORAGE VAULTS command is used to display information about all storage vaults configured in the system. Storage vaults are used to manage external storage locations for data.

## Syntax

```sql
    SHOW STORAGE VAULTS
```

## Return Values

This command returns a result set with the following columns:

- `StorageVaultName`: The name of the storage vault.
- `StorageVaultId`: The id of the storage vault.
- `Properties`: A JSON string containing the configuration properties of the vault.
- `IsDefault`: Indicates whether this vault is set as the default (TRUE or FALSE).

## Related Commands

- [CREATE STORAGE VAULT](../Data-Definition-Statements/CREATE-STORAGE-VAULT.md)
- [GRANT](../account-management/GRANT-TO.md)
- [REVOKE](../account-management/REVOKE-FROM.md)
- [SET DEFAULT STORAGE VAULT](../Data-Definition-Statements/SET-DEFAULT-STORAGE-VAULT.md)

## Keywords

    SHOW, STORAGE VAULTS
