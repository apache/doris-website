---
{
    "title": "SHOW ROLES",
    "language": "en",
    "description": "The SHOW ROLES statement is used to display all created role information, including role name, included users and permissions."
}
---

## Description

The `SHOW ROLES` statement is used to display all created role information, including role name, included users and permissions.

## Syntax 

```sql
SHOW ROLES
```

## Return Value

| Column                | DataType    | Note                           |
|-----------------------|-------------|--------------------------------|
| Name                  | string      | Role Name                      |
| Comment               | string      | Comment                        |
| Users                 | string      | Included Users                 |
| GlobalPrivs           | string      | Global Privileges              |
| CatalogPrivs          | string      | Catalog Privileges             |
| DatabasePrivs         | string      | Database Privileges            |
| TablePrivs            | string      | Table Privileges               |
| ResourcePrivs         | string      | Resource Privileges            |
| WorkloadGroupPrivs    | string      | Workload Group Privileges      |
## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| GRANT_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with GRANT_PRIV permissions  |


## Usage Notes

Doris creates a default role for each user. If you want to display the default role, you can execute the command ```set show_user_default_role=true;```.

## Example

- View created roles

```sql
SHOW ROLES
```