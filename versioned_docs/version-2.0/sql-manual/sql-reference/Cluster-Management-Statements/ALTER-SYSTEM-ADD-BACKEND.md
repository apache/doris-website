---
{
    "title": "ALTER-SYSTEM-ADD-BACKEND",
    "language": "en"
}
---

## ALTER-SYSTEM-ADD-BACKEND

### Name

ALTER SYSTEM ADD BACKEND

### Description

The ADD BACKEND command is used to add one or more backend nodes to a Doris OLAP database cluster. This command allows administrators to specify the host and port of the new backend nodes, along with optional properties that configure their behavior.

grammar:

```sql
-- Add nodes (add this method if you do not use the multi-tenancy function)
   ALTER SYSTEM ADD BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...] [PROPERTIES ("key"="value", ...)];
````

### Parameters

* `host` can be a hostname or an ip address of the backend node while `heartbeat_port` is the heartbeat port of the node
* `PROPERTIES ("key"="value", ...)`: (Optional) A set of key-value pairs that define additional properties for the backend nodes. These properties can be used to customize the configuration of the backends being added. Available properties include:

    * tag.location: Specifies the resource group where the backend node belongs. For example, PROPERTIES ("tag.location" = "groupb").

### Example

 1. Adding Backends Without Additional Properties 

    ```sql
    ALTER SYSTEM ADD BACKEND "host1:9050,host2:9050";
    ````

    This command adds two backend nodes to the cluster:

    * host1 with port 9050
    * host2 with port 9050

    No additional properties are specified, so the default settings will apply to these backends.

2. Adding Backends With Resource Group

    ```sql
    ALTER SYSTEM ADD BACKEND "host3:9050" PROPERTIES ("tag.location" = "groupb");
    ````

    This command adds a single backend node (host3 with port 9050) to the cluster in resource group `groupb`:

### Keywords

    ALTER, SYSTEM, ADD, BACKEND, PROPERTIES

### Best Practice
