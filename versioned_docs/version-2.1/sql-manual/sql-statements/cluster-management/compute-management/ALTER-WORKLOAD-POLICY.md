---
{
"title": "ALTER WORKLOAD POLICY",
"language": "en"
}
---

## Description

Modify the properties of a Workload Group. Currently, only property modifications are supported; modifications to actions and conditions are not supported.


## Syntax

```sql
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```

## Required Parameters

`<workload_policy_name>` 

Workload Policy's Name


`<properties>`

1. enabled: Can be true or false, with a default value of true, indicating that the current policy is enabled. false indicates that the current policy is disabled.
2. priority: A positive integer ranging from 0 to 100, with a default value of 0. This represents the priority of the policy. The higher the value, the higher the priority. The main role of this property is to select the policy with the highest priority when multiple policies match.
3. workload_group: Currently, a policy can be bound to one workload group, which means that this policy is only effective for a specific workload group. The default is empty, which means it is effective for all queries.

## Access Control Requirements

You must have at least ADMIN_PRIV permissions.

## Examples

1. Disable a Workload Policy

```Java
alter workload policy cancel_big_query properties('enabled'='false')
```