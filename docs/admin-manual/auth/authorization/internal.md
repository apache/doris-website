---
{
    "title": "Built-in Authorization",
    "language": "en",
    "description": "Based on the RBAC model, achieve fine-grained access control over Doris resources through the three-layer structure of privileges, roles, and users."
}
---

<!-- Knowledge type: Concept explanation + Architecture decision -->
<!-- Applicable scenarios: Privilege planning / Access control design / Multi-business isolation -->

Doris built-in authorization is based on the **RBAC (Role-Based Access Control)** model. Through the three-layer structure of "privilege to role to user", it restricts each user's access to and operations on resources such as nodes, Catalog, databases, tables, columns, Resource, and Workload Group based on the user's identity.

This document covers the core concepts, runtime mechanism, related SQL commands, and typical privilege planning scenarios of Doris built-in authorization.

## Applicable Scenarios

| Scenario                                  | Recommended Approach                                                                                       |
|-------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Cluster operations (administrator)        | Grant `Admin_priv` or `Node_priv`, and use the built-in `operator` / `admin` roles                         |
| Data development (create databases/tables, load data) | Grant `CREATE`, `DROP`, `ALTER`, `LOAD`, `SELECT` privileges on specified databases/tables       |
| Data query (read-only access)             | Grant `Select_priv` on specified databases/tables/columns                                                  |
| Multi-business multi-tenant shared cluster | Create a "business administrator" user with database-level `Grant_priv` for each business database, and let that user manage its own business users |
| Resource / workload isolation             | Control the use of Resource and Workload Group through `Usage_priv`                                        |
| Sensitive field protection (such as phone number, ID number) | Use column-level `Select_priv`, or combine with [Data Access Control](../authorization/data) to configure row-level policies |

## Core Concepts

Doris authorization consists of the following three core entities:

- **Privilege**: The operation permission acting on a specific resource object (such as read, write, modify).
- **Role**: A set of privileges that can be granted to users.
- **User**: The initiator of an operation, uniquely identified by `user_name` and `host`.

### Privilege

The objects that privileges act on include nodes, Catalog, databases, tables, columns, Resource, and Workload Group. Different privileges represent different operation permissions.

#### All Privilege Items

<!-- Knowledge type: Configuration parameter -->

| Privilege      | Object Type                                       | Description                                                                                                                                                                                            |
|----------------|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv     | Global                                            | Super administrator privilege.                                                                                                                                                                          |
| Node_priv      | Global                                            | Node modification privilege. Includes operations such as adding, removing, and decommissioning FE, BE, and BROKER nodes.                                                                                |
| Grant_priv     | Global, Catalog, Db, Table, Resource, Workload Group | Privilege modification privilege. Allows operations such as granting and revoking privileges, and adding, removing, or modifying users and roles.<br />When granting privileges to other users/roles: before version 2.1.2, the current user only needs the corresponding level of `Grant_priv`; from version 2.1.2 onward, the current user must also hold the privilege on the resource being granted.<br />When assigning a role to other users, the current user must hold the Global-level `Grant_priv`. |
| Select_priv    | Global, Catalog, Db, Table, Column                | Read-only privilege on Catalog, databases, tables, and columns.                                                                                                                                          |
| Load_priv      | Global, Catalog, Db, Table                        | Write privilege on Catalog, databases, and tables. Includes Load, Insert, Delete, and so on.                                                                                                            |
| Alter_priv     | Global, Catalog, Db, Table                        | Modification privilege on Catalog, databases, and tables. Includes renaming databases/tables, adding/removing/modifying columns, and adding/removing partitions.                                        |
| Create_priv    | Global, Catalog, Db, Table                        | Privilege to create Catalog, databases, tables, and views.                                                                                                                                              |
| Drop_priv      | Global, Catalog, Db, Table                        | Privilege to drop Catalog, databases, tables, and views.                                                                                                                                                |
| Usage_priv     | Resource, Workload Group                          | Usage privilege on Resource and Workload Group.                                                                                                                                                          |
| Show_view_priv | Global, Catalog, Db, Table                        | Privilege to execute `SHOW CREATE VIEW`.                                                                                                                                                                |

#### Privilege Levels

The same privilege can be granted at different levels. The resource path specified in the `GRANT` statement determines the scope of the privilege.

| Level          | Grant Path Example                                            | Scope                                                  |
|----------------|---------------------------------------------------------------|--------------------------------------------------------|
| Global         | `GRANT ... ON *.*.* TO user1`                                 | Any database or table in any Catalog                   |
| Catalog        | `GRANT ... ON ctl.*.* TO user1`                               | Any database or table in the specified Catalog         |
| Database       | `GRANT ... ON ctl.db.* TO user1`                              | Any table in the specified database                    |
| Table          | `GRANT ... ON ctl.db.tbl TO user1`                            | Any column in the specified table                      |
| Column         | `GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`         | Specified columns of the specified table; currently column privileges support only `Select_priv` |
| Row            | Defined based on policies, see [Data Access Control](../authorization/data) | Controls the data rows accessible to the user         |
| Resource       | `GRANT USAGE_PRIV ON RESOURCE '%' TO user1`                   | Use of Resource; supports only `Usage_priv` and `Grant_priv` |
| Workload Group | `GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`             | Use of Workload Group; supports only `Usage_priv` and `Grant_priv` |

:::tip
`Admin_priv` can only be granted or revoked at the Global level.
:::

### Role

A role is a set of privileges. After a user is assigned a role, the user automatically inherits all privileges of that role. Subsequent changes to the role's privileges are also synchronized to all users holding that role.

#### Built-in Roles

Doris creates the following two built-in roles by default:

| Built-in Role | Default Privileges         | Typical Use                            |
|---------------|----------------------------|----------------------------------------|
| operator      | `Admin_priv` + `Node_priv` | Cluster operations, node modification  |
| admin         | `Admin_priv`               | Business management, data management   |

#### Custom Roles

You can create named roles through `CREATE ROLE`, combine commonly used privileges, and grant them to users in batch. This makes unified management and privilege revocation easier.

### User

In Doris, a `user_identity` uniquely identifies a user. A `user_identity` consists of two parts:

- `user_name`: The user name.
- `host`: The host address from which the user client connects.

## Authorization Mechanism

<!-- Knowledge type: Architecture principle -->

The Doris privilege system is based on the RBAC model. Users are associated with roles, and roles are associated with privileges. **A user holds privileges indirectly through roles.**

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

As shown in the diagram above:

- Both `user1` and `user2` hold the `priv1` privilege through `role1`.
- `userN` holds the `priv1` privilege through `role3`, and holds the `priv2` and `privN` privileges through `roleN`. Therefore, `userN` holds the `priv1`, `priv2`, and `privN` privileges at the same time.

### Privilege Inheritance and Revocation Rules

- When a role is dropped, the users holding that role **automatically lose** all privileges of that role.
- When a user is unassigned from a role, the user **automatically loses** all privileges of that role.
- When the privileges of a role are added or removed, the privileges of all users holding that role **change synchronously**.

### Notes

- For convenience, Doris supports granting privileges directly to users. In the underlying implementation, a dedicated **default role** is created for each user. Granting privileges directly to a user actually grants the privileges to this default role.
- The default role cannot be dropped or assigned to other users. When a user is dropped, its default role is also dropped automatically.

## Related SQL Commands

<!-- Knowledge type: Command reference -->

| Operation Category          | Command                                                                                  |
|-----------------------------|------------------------------------------------------------------------------------------|
| Grant / assign role         | [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)                  |
| Revoke / unassign role      | [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)              |
| Create role                 | [CREATE ROLE](../../../sql-manual/sql-statements/account-management/CREATE-ROLE)         |
| Drop role                   | [DROP ROLE](../../../sql-manual/sql-statements/account-management/DROP-ROLE)             |
| Alter role                  | [ALTER ROLE](../../../sql-manual/sql-statements/account-management/ALTER-ROLE)           |
| View current user privileges | [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)         |
| View all user privileges    | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)     |
| View created roles          | [SHOW ROLES](../../../sql-manual/sql-statements/account-management/SHOW-ROLES)           |
| View all supported privilege items | [SHOW PRIVILEGES](../../../sql-manual/sql-statements/account-management/SHOW-PRIVILEGES) |

## Best Practices

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Privilege planning / Multi-business isolation -->

The following are two typical scenarios for using the Doris privilege system.

### Scenario 1: Role-Based Division of Duties in a Single-Business Cluster

The users of a Doris cluster are divided into administrators (Admin), development engineers (RD), and clients (Client):

- **Administrator**: Holds all privileges of the entire cluster, and is responsible for cluster setup, node management, and so on.
- **Development engineer (RD)**: Responsible for business modeling, including creating databases and tables, loading and modifying data.
- **Client**: Accesses various databases and tables to retrieve data.

Recommended authorization plan:

- Administrator: Grant `Admin_priv` or global `Grant_priv`.
- RD: Grant `Create_priv`, `Drop_priv`, `Alter_priv`, `Load_priv`, and `Select_priv` on any or specified databases/tables.
- Client: Grant `Select_priv` on any or specified databases/tables.

You can create different roles to simplify batch authorization for multiple users.

### Scenario 2: Delegated Management in a Multi-Business Cluster

A single cluster hosts multiple businesses. Each business uses one or more databases, and each business needs to manage its own users.

Recommended authorization plan: The administrator creates a "business administrator" user for each business database, granting that user the database-level `Grant_priv` on the corresponding database. This user can only grant privileges to others within the scope of the authorized database, which achieves privilege isolation and self-management between businesses.
