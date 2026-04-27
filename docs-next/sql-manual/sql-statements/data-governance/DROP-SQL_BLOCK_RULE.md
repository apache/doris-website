---
{
    "title": "DROP SQL_BLOCK_RULE",
    "language": "en",
    "description": "Deletes one or more SQL blocking rules. Multiple rules can be deleted at once by separating them with commas."
}
---

## Description

Deletes one or more SQL blocking rules. Multiple rules can be deleted at once by separating them with commas.

## Syntax

```sql
DROP SQL_BLOCK_RULE <rule_name>[, ...]
```

## Required Parameters

<rule_name>
The name of the SQL blocking rule to be deleted. Multiple rule names can be specified, separated by commas. 

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:
| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN        | User or Role   | Only users or roles with the ADMIN privilege can perform the DROP operation. |


## Example

Delete `test_rule1` and `test_rule2` blocking rules

```sql
DROP SQL_BLOCK_RULE test_rule1, test_rule2;
```

