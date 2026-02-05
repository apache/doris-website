---
{
    "title": "ADD BACKEND",
    "language": "en",
    "description": "The ADD BACKEND is used to add one or more BE nodes to the Doris cluster."
}
---

## Description

The ADD BACKEND is used to add one or more BE nodes to the Doris cluster. This command allows administrators to specify the host and port of the new BE nodes, as well as optional properties to configure their behavior.

## Syntax

```sql
ALTER SYSTEM ADD BACKEND "<host>:<heartbeat_port>"[,"<host>:<heartbeat_port>" [, ...]] [PROPERTIES ("<key>"="<value>" [, ...] )]
```

## Required Parameters

**1. <host>**

> It can be the hostname or IP address of the BE node.

**2. <heartbeat_port>**

> The heartbeat port of the BE node, the default is 9050.

## Optional Parameters

**1. `PROPERTIES ("<key>"="<value>" [, ... ] )`**

> A set of key-value pairs used to define additional properties of the BE node. These properties can be used to customize the configuration of the BE being added. Available properties include:
> - `tag.location`: Used to specify the Resource Group to which the BE node belongs in the integrated storage and computing mode.
> - `tag.compute_group_name`: Used to specify the compute group to which the BE node belongs in the decoupling storage and computing mode.
> - `tag.public_endpoint`: Used to specify the public endpoint of the BE node for external access (e.g., `11.10.20.12:8010`). This is typically a load balancer domain name or public IP for external user access.
> - `tag.private_endpoint`: Used to specify the private endpoint of the BE node for private network access (e.g., `10.10.10.9:8020`). This is typically used for VPC internal access or Kubernetes Service IP within cluster.

## Access Control Requirements

The user executing this SQL must have at least the following permissions:

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Usage Notes

1. Before adding a new BE node, make sure the node is correctly configured and running.
2. Using [Resource Group](../../../../admin-manual/workload-management/resource-group.md) can help you better manage and organize the BE nodes in the cluster.
3. When adding multiple BE nodes, you can specify them in one command to improve efficiency.
3. After adding the BE nodes, use the [`SHOW BACKENDS`](./SHOW-BACKENDS.md) to verify whether they have been successfully added and are in a normal state.
4. Consider adding BE nodes in different physical locations or racks to improve the availability and fault tolerance of the cluster.
5. Regularly check and balance the load in the cluster to ensure that the newly added BE nodes are properly utilized.

## Examples

1. Add BE nodes without additional properties
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.0.1:9050,192.168.0.2:9050";
   ```
   This command adds two BE nodes to the cluster:
   * 192.168.0.1, port 9050
   * 192.168.0.2, port 9050
   No additional properties are specified, so the default settings will be applied.

2. In the integrated storage and computing mode, add a BE node to a specified Resource Group
   ```sql
   ALTER SYSTEM ADD BACKEND "doris-be01:9050" PROPERTIES ("tag.location" = "groupb");
   ```
   This command adds a single BE node (hostname doris-be01, port 9050) to the Resource Group `groupb` in the cluster.

3. In the decoupling storage and computing mode, add a BE node to a specified compute group
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.0.3:9050" PROPERTIES ("tag.compute_group_name" = "cloud_groupc");
   ```
   This command adds a single BE node (IP 192.168.0.3, port 9050) to the compute group `cloud_groupc` in the cluster.

4. Add a BE node with public and private endpoints configured for complex network environments
   ```sql
   ALTER SYSTEM ADD BACKEND "192.168.1.1:9050" PROPERTIES (
       "tag.public_endpoint" = "11.10.20.12:8010",
       "tag.private_endpoint" = "10.10.10.9:8020"
   );
   ```
   This command adds a BE node with multiple network endpoints:
   * `192.168.1.1:9050`: The internal address (be_host) for cluster communication
   * `11.10.20.12:8010`: The public endpoint for external user access through load balancer
   * `10.10.10.9:8020`: The private endpoint for VPC internal or Kubernetes cross-cluster access

   This configuration is useful in cloud environments or Kubernetes clusters where BE nodes need to be accessible from different network contexts. For more details, see [Stream Load in Complex Network Environments](../../../../data-operate/import/load-internals/stream-load-in-complex-network.md).
