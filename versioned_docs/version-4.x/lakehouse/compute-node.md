---
{
    "title": "Elastic Compute Node",
    "language": "en",
    "description": "Elastic compute nodes, as a special type of BE node, do not have data storage capabilities and are only responsible for data computation. Therefore,"
}
---

Elastic compute nodes, as a special type of BE node, do not have data storage capabilities and are only responsible for data computation. Therefore, compute nodes can be regarded as stateless BE nodes, which can be easily added and removed.

In lakehouse data analysis scenarios, elastic compute nodes can be used to query external data sources such as Hive, Iceberg, Hudi, Paimon, JDBC, etc. Doris does not handle the storage of external data source data, so elastic compute nodes can be used to easily expand the computing power for external data sources. Additionally, compute nodes can also be configured with cache directories to cache hot data from external data sources, further accelerating data reading.

Elastic compute nodes can be used in both **integrated storage and computing mode** and **storage-compute separation mode**. They are primarily used to isolate the compute resources for data lake (external table) queries from those for internal table queries:

- **Integrated storage and computing mode**: BE nodes are of type `mix` by default and are responsible for both storage and computation. You can deploy a separate group of `computation`-type BE nodes dedicated to external table queries and scale them up or down elastically without affecting the storage of internal table data.
- **Storage-compute separation mode**: BE nodes are already stateless and can be scaled up or down easily. You can still set some BE nodes to `computation` type to make them dedicated to data lake (external table) queries, achieving workload isolation from the BE nodes serving internal table queries.

:::caution Important
- BE nodes set to `computation` type **only serve data lake (external table) queries; they do NOT serve any internal table query requests**. If all BE nodes in the cluster are set to `computation`, queries on internal tables will fail with the error `has no queryable replicas`. Make sure at least one `mix`-type BE node is kept in the cluster to serve internal table queries.
- In **storage-compute separation mode**, the `NodeRole` column shown by `SHOW BACKENDS` is always `mix`, regardless of the `be_node_role` setting in the BE configuration file. This is a known display behavior; the actual role of a node is still determined by the `be_node_role` value in `be.conf`.
:::

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

5. Why does querying an internal table on a compute node fail with `has no queryable replicas`?

  This is the expected behavior. `computation`-type BE nodes do not serve any internal table queries. If all BE nodes in the cluster are of `computation` type (or the `mix`-type nodes in the cluster are not enough to hold the replicas of the internal table), queries on internal tables will fail with this error.

  Resolution: keep or add at least one `mix`-type BE node in the cluster to serve internal table queries.

6. In storage-compute separation mode, the `NodeRole` shown by `SHOW BACKENDS` is always `mix`. Does that mean the `be_node_role = computation` setting did not take effect?

  No. In storage-compute separation mode, the `NodeRole` column of `SHOW BACKENDS` is always displayed as `mix`. This is a known display behavior and is unrelated to the actual `be_node_role` setting in `be.conf`. The parameter still takes effect in storage-compute separation mode: nodes configured as `computation` will only participate in external table queries.