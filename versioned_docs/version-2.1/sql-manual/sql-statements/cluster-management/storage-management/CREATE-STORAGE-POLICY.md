---
{
    "title": "CREATE STORAGE POLICY",
    "language": "en"
}
---

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

**<policy_name>**

> The name of the storage policy to be created

**<storage_resource_name>**

> The name of the associated storage resource. For details on how to create it, refer to the RESOURCE section

## Optional Parameters

**<cooldown_datetime>**

> Specifies the cooldown time for creating the data migration policy

**<cooldown_ttl>**

> Specifies the duration of hot data for creating the data migration policy

## Access Control Requirements

The prerequisite for successfully executing this SQL command is to have ADMIN_PRIV privileges. Refer to the permission documentation.

| Privilege  | Object                               | Notes                           |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | Entire cluster management privileges | All privileges except NODE_PRIV |

## Example

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