---
{
    "title": "MODIFY BACKEND",
    "language": "en"
}
---

## Description

This statement is used to modify the attributes of BE nodes. After modifying the attributes of BE nodes, it will affect the query, write, and data distribution of the current node. The following are the attributes that can be modified:

| 属性              | 影响                                                                                                                                                                                                                                                                                                                                             |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `tag.location`  | The resource tag of the BE, with the `default` value being default. After modification, it will affect the data balancing of BEs within the same tag group and the BE nodes for data distribution during table creation. For more information, please refer to[Resource Group](../../../../admin-manual/workload-management/resource-group.md) |
| `disable_query` | Whether to disable queries, with the default value being `false`. After setting it to `true`, no new query requests will be scheduled to this BE node.                                                                                                                                                                                         |
| `disable_load`  | Whether to disable load, with the default value being `false`. After setting it to `true`, no new import requests will be scheduled to this BE node.                                                                                                                                                                                           |

## Syntax

```sql
ALTER SYSTEM MODIFY BACKEND <be_identifier> [, <be_identifier> ... ]
SET (
     "<key>" = "<value>"
)
```

Where:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## Required Parameters

**1. <be_host>**

> It can be the hostname or IP address of the BE node.

**2. <heartbeat_port>**

> The heartbeat port of the BE node, the default is 9050.

**3. <backend_id>**

> The ID of the BE node.

:::tip
`<be_host>`, `<be_heartbeat_port>`, and `<backend_id>` can all be obtained by querying with the [SHOW BACKENDS](./SHOW-BACKENDS.md) statement.
:::

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Usage Notes

Since this operation is at the entire BE level and has a wide impact, it may affect the normal querying, loading, and even table creation operations of the entire cluster if not performed carefully. Please operate with caution.

## Examples

1. Modify the resource tag of the BE

```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("tag.location" = "group_a");
```

2. Modify the `disable_query` attribute of the BE
   
```sql
ALTER SYSTEM MODIFY BACKEND "10002" SET ("disable_query" = "true");
```

3. Modify the `disable_load` attribute of the BE
   
```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("disable_load" = "true");
```
