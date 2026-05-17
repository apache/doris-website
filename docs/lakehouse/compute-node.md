---
{
    "title": "Elastic Compute Node",
    "language": "en",
    "description": "Elastic compute nodes, as a special type of BE node, do not have data storage capabilities and are only responsible for data computation. Therefore,"
}
---

Elastic compute nodes, as a special type of BE node, do not have data storage capabilities and are only responsible for data computation. Therefore, compute nodes can be regarded as stateless BE nodes, which can be easily added and removed.

In lakehouse data analysis scenarios, elastic compute nodes can be used to query external data sources such as Hive, Iceberg, Hudi, Paimon, JDBC, etc. Doris does not handle the storage of external data source data, so elastic compute nodes can be used to easily expand the computing power for external data sources. Additionally, compute nodes can also be configured with cache directories to cache hot data from external data sources, further accelerating data reading.

Elastic compute nodes **are suitable for elastic resource control in the integrated storage and computing mode of Doris**. In the storage-compute separation architecture of Doris 3.0, BE nodes are stateless, so separate elastic compute nodes are no longer needed.

## Usage of Compute Nodes

### BE Node Types

In the integrated storage and computing mode, BE nodes are divided into two types:

* Mix

  Mixed nodes. This is the default type of BE node. These nodes participate in both computation and the storage of Doris internal table data.

* Computation

  Elastic compute nodes. They do not handle data storage, only data computation.

### Adding Compute Nodes

Add the following configuration in the BE `be.conf` configuration file:

`be_node_role=computation`

Afterwards, start the BE node, and it will run as a Computation type.

Then you can connect to Doris and execute:

`ALTER SYSTEM ADD BACKEND`

to add this BE node. Once added successfully, you can see the node type as `computation` in the `NodeRole` column of `SHOW BACKENDS`.

### Using Compute Nodes

You need to configure the following parameters in the FE configuration file `fe.conf` to enable compute nodes and control their behavior:

| Parameter Name                             | Description                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefer_compute_node_for_external_table` | Default is `false`. If set to `true`, queries for external tables will be preferentially assigned to compute nodes. If `false`, queries for external tables will be assigned to any BE node. If there are no compute nodes in the cluster, this parameter has no effect.                                                                                                           |
| `min_backend_num_for_external_table`     | Only effective when `prefer_compute_node_for_external_table` is `true`. If the number of compute nodes in the cluster is less than this value, queries for external tables will attempt to acquire some mixed nodes to allocate, so that the total number of nodes reaches this value. If the number of compute nodes in the cluster is greater than this value, queries for external tables will only be assigned to compute nodes. Before version 2.0 (inclusive), the default value of this parameter was 3. After version 2.1, the default value is `-1`, which means only the current number of compute nodes will be used. |

Further explanation of `min_backend_num_for_external_table`:

Assume there are 3 compute nodes and 5 mixed nodes in the cluster.

If `min_backend_num_for_external_table` is set to less than or equal to 3, then external table queries will only use 3 compute nodes. If set to greater than 3, say 6, then external table queries will use 3 compute nodes plus an additional 3 mixed nodes for computation.

In summary, this parameter is mainly used for the minimum number of BE nodes that can participate in external table computation, and will preferentially select compute nodes. Increasing this parameter will allow more BE nodes (not limited to compute nodes) to participate in external table query processing; decreasing this parameter can limit the number of BE nodes participating in external table query processing.

> Note:
>
> 1. After version 2.1, `min_backend_num_for_external_table` can be set to `-1`. In previous versions, this parameter must be a positive number. This parameter is only effective when `prefer_compute_node_for_external_table = true`.
>
> 2. If the value of `min_backend_num_for_external_table` is greater than the total number of BE nodes, at most all BEs will be selected.
>
> 3. The above parameters can be dynamically modified using the `ADMIN SET FRONTEND CONFIG` command without restarting the FE node. All FE nodes need to be configured. Alternatively, add the configuration in `fe.conf` and restart the FE node.

## Best Practices

### Resource Isolation and Elastic Scaling of Federated Queries

In federated query scenarios, users can deploy a dedicated set of compute nodes for querying external table data. This allows the isolation of external table query loads (such as large-scale analysis on Hive) from internal table query loads (such as low-latency fast data analysis).

At the same time, as stateless BE nodes, compute nodes can be easily scaled up and down. For example, a set of elastic compute node clusters can be deployed using k8s, utilizing more compute nodes for data lake analysis during peak business periods, and quickly scaling down during off-peak periods to reduce costs.

## Common Issues

1. Can mixed nodes and compute nodes be converted to each other?

  Compute nodes can be converted to mixed nodes. However, mixed nodes cannot be converted to compute nodes.

2. Do compute nodes need to configure data storage directories?

  Yes. The data storage directory of compute nodes will not store user data, only some information files of the BE node itself, such as `cluster_id`, and some temporary files during operation.

  The storage directory of compute nodes requires only a small amount of disk space (MB level) and can be destroyed at any time along with the node without affecting user data.

3. Can compute nodes and mixed nodes configure file cache directories?

  [File cache](./data-cache.md) accelerates subsequent queries of the same data by caching data files from recently accessed remote storage systems (HDFS or object storage).

  Both compute nodes and mixed nodes can set up file cache directories. The file cache directory needs to be created in advance.

4. Do compute nodes need to be decommissioned through the DECOMMISION operation?

  No. Compute nodes can be directly deleted using the `DROP BACKEND` operation.