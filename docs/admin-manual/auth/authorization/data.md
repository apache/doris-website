---
{
    "title": "Data Access Control",
    "language": "en",
    "description": "Implement fine-grained access control over sensitive data in Apache Doris with row policies, column permissions, and data masking. Restrict the rows, columns, and field content visible to each user or role.",
    "keywords": [
        "data access control",
        "row policy",
        "Row Policy",
        "column permission",
        "Column Permission",
        "data masking",
        "Data Masking",
        "sensitive data protection",
        "Select_priv",
        "Apache Ranger",
        "fine-grained permission",
        "RBAC"
    ]
}
---

<!-- Knowledge type: Feature introduction / Procedure -->
<!-- Applicable scenarios: Sensitive data protection / Data compliance / Fine-grained permission control -->

Apache Doris provides three mechanisms, **Row Policy**, **Column Permission**, and **Data Masking**, to help administrators enforce fine-grained access control over sensitive data across rows, columns, and field content. This document covers how these mechanisms work, their limitations, and typical examples.

## Applicable Scenarios

| Scenario | Recommended mechanism | Description |
|------|----------|------|
| Different users can only see **some rows** of a table (for example, isolation by region, tenant, or department) | Row Policy | Automatically appends a filter predicate to the query |
| Different users can only access **some columns** of a table (for example, hiding salary or phone number columns) | Column Permission | Grants `Select_priv` only on the specified columns |
| Sensitive fields need to be **partially hidden or replaced** (for example, displaying an ID card or bank card number as `***`) | Data Masking | Configure a masking policy through Apache Ranger |

## Prerequisites

- The current user has management permissions on the target object (such as the `GRANT` privilege).
- Data masking depends on Apache Ranger. Complete the Ranger integration first (see [Apache Ranger Authorization](./ranger)).
- None of the three mechanisms take effect on the default users `root` and `admin`.

## Row Policy

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Multi-tenant isolation / Row-level data filtering -->

With row-level policies in Doris, you can apply fine-grained access control to sensitive data. Based on the security policies defined at the table level, you can decide which users or roles can access specific records in a table.

### How It Works

For a user configured with a Row Policy, Doris automatically appends the predicate defined in the Row Policy to the query.

### Limitations

- Row Policies cannot be set for the default users `root` and `admin`.

### Related Commands

- View row policies: [SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY)
- Create a row policy: [CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY)

### Row Policy Examples

1. Restrict user `test` to only query rows in `table1` where `c1='a'`:

    ```sql
    CREATE ROW POLICY test_row_policy_1 ON test.table1 
    AS RESTRICTIVE TO test USING (c1 = 'a');
    ```

## Column Permission

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Column-level data isolation / Sensitive field hiding -->

With column permissions in Doris, you can apply fine-grained access control to tables. You can grant permissions on specific columns of a table only, to decide which users or roles can access those columns.

Currently, column permissions only support `Select_priv`.

### Related Commands

- Grant: [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- Revoke: [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)

### Column Permission Examples

1. Grant `user1` the privilege to query columns `col1` and `col2` in table `tbl`:

    ```sql
    GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
    ```

## Data Masking

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Sensitive field protection / Data compliance -->

Data masking is a method for protecting sensitive data. It modifies, replaces, or hides the original data so that the masked data keeps a certain format and characteristics while no longer containing sensitive information.

For example, an administrator can replace part or all of the digits of sensitive fields such as credit card numbers and ID card numbers with asterisks `*` or other characters, or replace real names with pseudonyms.

Starting from version 2.1.2, Doris supports setting masking policies on columns through Apache Ranger Data Masking. This is currently the only supported configuration path, available via [Apache Ranger](./ranger).

> Data masking does not take effect for the `admin` or `root` user.

## FAQ

### Q: Row Policy or data masking was configured for the `root` or `admin` user, but it did not take effect.

None of the three mechanisms take effect on the default superusers `root` and `admin`. Use a regular business user for verification.

### Q: After granting column permissions, queries still report insufficient privileges.

Column permissions currently only support `Select_priv`. Confirm that the grant statement uses this privilege and that the grant target is the intended Catalog, database, or table.

### Q: The data masking policy did not take effect.

Data masking must be configured through Apache Ranger and requires Doris version 2.1.2 or later. Confirm that the Ranger integration is complete, the policy is active, and the current user is not `root` or `admin`.
