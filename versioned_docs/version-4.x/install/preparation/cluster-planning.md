---
{
    "title": "Cluster Planning",
    "language": "en",
    "description": "When deploying Doris, you can choose between the integrated storage-compute architecture or the decoupled storage-compute architecture based on your "
}
---

## Architecture Planning

When deploying Doris, you can choose between the integrated storage-compute architecture or the decoupled storage-compute architecture based on your business needs:

- [Integrated Storage-Compute](../../gettingStarted/what-is-apache-doris.md#Integrated-Storage-Compute): The integrated storage-compute architecture is easy to deploy, performs excellently, and does not rely on external shared storage devices. It is suitable for business scenarios that do not require extreme elasticity in scaling.

- [Decoupled Storage-Compute](../../gettingStarted/what-is-apache-doris.md#Decoupled-Storage-Compute): The decoupled storage-compute architecture relies on shared storage and enables elastic scaling of computing resources. It is suitable for business scenarios that require dynamic adjustment of computing resources.

## Port Planning

Doris instances communicate over the network, and their proper functioning requires the following ports to be available. Administrators can adjust Doris' port configuration based on the actual environment:

| Instance Name | Port Name               | Default Port | Communication Direction        | Description                                            |
| ------------- | ----------------------- | ------------ | ------------------------------ | ------------------------------------------------------ |
| BE            | be_port                 | 9060         | FE -> BE                        | Thrift Server port on BE, used to receive requests from FE |
| BE            | webserver_port          | 8040         | BE <-> BE                       | HTTP Server port on BE                                  |
| BE            | heartbeat_service_port  | 9050         | FE -> BE                        | Heartbeat service port (Thrift) on BE, used to receive heartbeats from FE |
| BE            | brpc_port               | 8060         | FE <-> BE, BE <-> BE            | BRPC port on BE, used for communication between BEs     |
| FE            | http_port               | 8030         | FE <-> FE, Client <-> FE       | HTTP Server port on FE                                  |
| FE            | rpc_port                | 9020         | BE -> FE, FE <-> FE            | Thrift Server port on FE, each FE should have the same configuration |
| FE            | query_port              | 9030         | Client <-> FE                  | MySQL Server port on FE                                 |
| FE            | edit_log_port           | 9010         | FE <-> FE                       | bdbje communication port on FE                         |


## Node Count Planning

### FE Node Count

FE nodes are primarily responsible for user request handling, query parsing and planning, metadata management, and node management.

For production clusters, it is generally recommended to deploy at least 3 FE nodes to achieve a high-availability environment. FE nodes are divided into the following two roles:

- **Follower nodes**: Participate in election operations. When the Master node fails, a Follower node will be selected as the new Master.
  
- **Observer nodes**: Only sync metadata from the Leader node and do not participate in the election. These nodes can be used for horizontal scaling to improve the read service capacity of metadata.

In general, it is recommended to deploy at least 3 Follower nodes. In high-concurrency scenarios, increasing the number of Observer nodes can help improve the cluster's connection capacity.

### BE Node Count

BE nodes are responsible for data storage and computation. In production environments, to ensure data reliability and fault tolerance, 3 copies of data are usually stored. Therefore, it is recommended to deploy at least 3 BE nodes.

BE nodes support horizontal scaling, and by increasing the number of BE nodes, the query performance and concurrent processing capabilities of the cluster can be effectively improved.

