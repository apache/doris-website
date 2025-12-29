---
{
    "title": "DROP BROKER",
    "language": "en",
    "description": "This statement is used to delete BROKER nodes."
}
---

## Description

This statement is used to delete BROKER nodes.

## Syntax

1. Drop all Brokers
    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. Drop one or more Broker nodes
    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## Required Parameters

**1. `<broker_name>`**

The name of the broker process to be deleted.

**2. `<host>`**

The IP of the node where the broker process to be deleted is located. If FQDN is enabled, use the FQDN of the node.

**3. `<ipc_port>`**
The PORT of the node where the broker process to be deleted is located, and the default value of this port is 8000.


## Access Control Requirements
The user who executes this operation needs to have the NODE_PRIV permission.

## Examples

1. Delete all Brokers

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name.
    ```

2. Delete a specific Broker node

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "10.10.10.1:8000";
    ```