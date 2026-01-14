---
{
    "title": "DROP DATA MASK POLICY",
    "language": "en",
    "description": "Delete data mask policy. For details about data mask policies, please refer to the \"Security Policies\" chapter"
}
---

## Description

Delete data mask policy. For details about data mask policies, please refer to the "Security Policies" chapter


## Syntax

```sql
DROP DATA MASK POLICY [IF EXISTS] <policy_name>;
```

## Required Parameters
**<policy_name>**

> Data mask policy name

# Access Control Requirements (Access Control Requirements)

The user executing this SQL command must have at least the following privileges:

| Privilege                  | Object | Notes |
| :------------------------- | :----- | :---- |
| ADMIN_PRIV or *GRANT_PRIV* | Global |       |

# Examples (Examples)

1. Delete the *policy1 data mask policy* 

  ```sql
  DROP DATA MASK POLICY policy1
  ```

