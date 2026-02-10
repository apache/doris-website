---
{
    "title": "Built-in Authorization",
    "language": "en",
    "description": "Authorization refers to the mechanism by which user identities are restricted in accessing and operating Doris resources."
}
---

## Key Concepts

Authorization refers to the mechanism by which user identities are restricted in accessing and operating Doris resources.

Doris uses a Role-Based Access Control (RBAC) model for permission management.

### Permissions

Permissions apply to nodes, catalogs, databases, or tables. Different permissions represent different operation allowances.

#### All Permissions

| Permission       | Object Type | Description                                                                                                                                                                  |
|----------------| --------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv     | Global      | Super admin permissions.                                                                                                                                                               |
| Node_priv      | Global      | Node change permissions. Includes adding, deleting, and decommissioning FE, BE, and BROKER nodes.                                                                                                                              |
| Grant_priv     | Global, Catalog, Db, Table, Resource, Workload Group | Permission change permissions. Allows operations such as granting, revoking, adding/removing/changing users/roles. <br>When granting permissions to other users/roles, prior to version 2.1.2, the current user only needs the corresponding level of Grant_priv permission. After version 2.1.2, the current user also needs the permissions of the resources they want to grant. <br>To assign roles to other users, Global level Grant_priv permission is required. |
| Select_priv    | Global, Catalog, Db, Table, Column | Select permission. Allows querying data.                                                                                                                                                 |
| Load_priv      | Global, Catalog, Db, Table | Load permission. Includes Load, Insert, Delete, etc.                                                                                                                            |
| Alter_priv     | Global, Catalog, Db, Table | Alter permission. Includes renaming databases/tables, adding/deleting/changing columns, adding/deleting partitions, etc.                                                                                                                  |
| Create_priv    | Global, Catalog, Db, Table | Create permission. Allows creating catalogs, databases, tables, and views.                                                                                                                                                 |
| Drop_priv      | Global, Catalog, Db, Table | Drop permission. Allows dropping catalogs, databases, tables, and views.                                                                                                                                                 |
| Usage_priv     | Resource, Workload Group | Usage permission for Resources and Workload Groups.                                                                                                                                    |
| Show_view_priv | Global, Catalog, Db, Table | Execute SHOW CREATE VIEW permission.                                                                                                                                            |

### Roles

Doris allows creating custom-named roles. Roles can be seen as a collection of permissions. New users can be assigned a role, and they will automatically be granted the permissions of that role. Subsequent changes to the role's permissions will also affect the permissions of all users belonging to that role.

#### Built-in Roles

Built-in roles are default roles created by Doris, with default permissions, including operator and admin.

- operator: Has Admin_priv and Node_priv
- admin: Has Admin_priv

### Users

In Doris, a `user_identity` uniquely identifies a user. `user_identity` consists of two parts: `user_name` and `host`, where `username` is the username. `host` identifies the host address from which the user connects.

## Authorization Mechanism

Doris's permission design is based on the RBAC (Role-Based Access Control) model, associating users with roles, roles with permissions, and users indirectly with permissions through roles.

When a role is deleted, users automatically lose all permissions of that role.

When a user and role are unassociated, the user automatically loses all permissions of that role.

When a role's permissions are added or deleted, the user's permissions also change.

```
┌────────┐        ┌────────┐         ┌────────┐
│  user1 ├────┬───►  role1 ├────┬────►  priv1 │
└────────┘    │   └────────┘    │    └────────┘
              │                 │
              │                 │
              │   ┌────────┐    │
              │   │  role2 ├────┤
┌────────┐    │   └────────┘    │    ┌────────┐
│  user2 ├────┘                 │  ┌─►  priv2 │
└────────┘                      │  │ └────────┘
                  ┌────────┐    │  │
           ┌──────►  role3 ├────┘  │
           │      └────────┘       │
           │                       │
           │                       │
┌────────┐ │      ┌────────┐       │ ┌────────┐
│  userN ├─┴──────►  roleN ├───────┴─►  privN │
└────────┘        └────────┘         └────────┘
```

As shown above:

user1 and user2 both have priv1 permission through role1.

userN has priv1 permission through role3 and priv2 and privN permissions through roleN, so userN has priv1, priv2, and privN permissions.

### Notes

- For convenience, users can be directly granted permissions. Under the hood, a default role is created for each user, and granting permissions to the user is equivalent to granting permissions to the default role.
- Default roles cannot be deleted, cannot be assigned to other users, and are automatically deleted when the user is deleted.

## Related Commands

- Grant/assign role: [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- Revoke/revoke role: [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
- Create role: [CREATE ROLE](../../../sql-manual/sql-statements/account-management/CREATE-ROLE)
- Delete role: [DROP ROLE](../../../sql-manual/sql-statements/account-management/DROP-ROLE)
- Modify role: [ALTER ROLE](../../../sql-manual/sql-statements/account-management/ALTER-ROLE)
- View current user permissions and roles: [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- View all user permissions and roles: [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- View created roles: [SHOW ROLES](../../../sql-manual/sql-statements/account-management/SHOW-ROLES)
- View supported permissions: [SHOW PRIVILEGES](../../../sql-manual/sql-statements/account-management/SHOW-PRIVILEGES)

## Best Practices

Here are some examples of using Doris's permission system.

1. Scenario 1

   Doris cluster users are divided into administrators (Admin), development engineers (RD), and users (Client). Administrators have all permissions for the entire cluster, mainly responsible for cluster setup, node management, etc. Development engineers are responsible for business modeling, including database and table creation, data import and modification, etc. Users access different databases and tables to retrieve data.

   In this scenario, administrators can be granted ADMIN or GRANT permissions. RD can be granted CREATE, DROP, ALTER, LOAD, and SELECT permissions for any or specified databases and tables. Client can be granted SELECT permission for any or specified databases and tables. At the same time, different roles can be created to simplify permission management for multiple users.

2. Scenario 2

   A cluster has multiple businesses, each business may use one or more datasets. Each business needs to manage its own users. In this scenario, the administrator can create a user with DATABASE-level GRANT permission for each database. This user can only grant permissions for the specified database.
