---
{
    "title": "ADD BROKER",
    "language": "en",
    "description": "This statement is used to add one or more BROKER nodes."
}
---

## Description

This statement is used to add one or more BROKER nodes.

## Syntax

```sql
ALTER SYSTEM ADD BROKER <broker_name> "<host>:<ipc_port>" [, "host>:<ipc_port>" [, ... ] ];
```

## Required Parameters

**1. `<broker_name>`**

The name given to the added broker process. It is recommended to keep the broker_name consistent within the same cluster.

**2. `<host>`**

The IP of the node where the broker process needs to be added. If FQDN is enabled, use the FQDN of the node.

**3. `<ipc_port>`**

The PORT of the node where the broker process needs to be added, and the default value of this port is 8000.


## Access Control Requirements
The user who executes this operation needs to have the NODE_PRIV permission.

## Examples

1. Add two Brokers

    ```sql
    ALTER SYSTEM ADD BROKER "host1:port", "host2:port";
    ```

2. Add a Broker using FQDN

    ```sql
    ALTER SYSTEM ADD BROKER "broker_fqdn1:port";
    ```