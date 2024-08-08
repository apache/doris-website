---
{
    "title": "Elastic Compute Node",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Since version 1.2.1, Doris has supported the Compute Node feature.

Starting from this version, BE nodes can be divided into two categories:

- Mix

    A mixed node, which is the default type of BE node. This type of node can both participate in computation and be responsible for storing Doris data.

- Computation

    A computation node that is not responsible for data storage, only for data computation.

As a special type of BE node, the computation node does not have data storage capabilities and is only responsible for data computation. Therefore, the computation node can be seen as a stateless BE node, making it easy to add and remove nodes.

In the Lakehouse solution, the computation node can serve as an elastic node for querying external data sources such as Hive, Iceberg, JDBC, etc. Doris does not store data from external data sources, so the computation node can easily expand the computational capabilities for external data sources. Additionally, the computation node can be configured with a cache directory to cache hot data from external data sources, further accelerating data retrieval.

:::tip
The computation node is suitable for the integrated storage and computation deployment mode in Doris, providing elastic resource control. In the storage-computation separation architecture of Doris 3.0, all BE nodes are stateless, eliminating the need for separate computation nodes.
:::

## Using Compute Nodes

### Adding Compute Nodes

Add the following configuration to the `be.conf` file of the BE:

`be_node_role=computation`

After that, start the BE node, and it will run as a computation node type.

You can then connect to Doris using a MySQL client and execute:

`ALTER SYSTEM ADD BACKEND`

This will add the BE node. After successful addition, in the `NodeRole` column of `SHOW BACKENDS`, you can see the node type as `computation`.

### Using Compute Nodes

To use compute nodes, the following conditions must be met:

- The cluster contains compute nodes.
- The `fe.conf` file has the configuration item: `prefer_compute_node_for_external_table = true`

Additionally, the following FE configuration items will affect the usage strategy of compute nodes:

- `min_backend_num_for_external_table`

    Before Doris 2.0 (inclusive), the default value of this parameter was 3. After version 2.1, the default parameter is -1.

    This parameter indicates the minimum number of BE nodes expected to participate in external table data queries. `-1` indicates that this value is equivalent to the current number of compute nodes in the cluster.

    For example, suppose there are 3 compute nodes and 5 mixed nodes in the cluster.

    If `min_backend_num_for_external_table` is set to less than or equal to 3, external table queries will only use 3 compute nodes. If set to greater than 3, for example, 6, external table queries will use 3 compute nodes and additionally select 3 mixed nodes for computation.

    In summary, this parameter is mainly used for the minimum number of BE nodes that can participate in external table calculations, and it will prioritize selecting compute nodes.

> Note:
> 
> 1. After version 2.1, `min_backend_num_for_external_table` can be set to `-1`. In previous versions, this parameter must be a positive number. And this parameter only takes effect when `prefer_compute_node_for_external_table = true`.
> 
> 2. If `prefer_compute_node_for_external_table` is `false`, external table queries will select any BE node.
> 
> 3. If there are no compute nodes in the cluster, the above parameters will not take effect.
> 
> 4. If the value of `min_backend_num_for_external_table` is greater than the total number of BE nodes, at most all BE nodes will be selected.
> 
> 5. The above parameters can be dynamically modified using the `ADMIN SET FRONTEND CONFIG` command without the need to restart FE nodes. All FE nodes need to be configured. Alternatively, add the configuration in `fe.conf` and restart the FE nodes.

## Best Practices

### Load Isolation and Elastic Scaling for Federated Queries

In federated query scenarios, users can deploy a dedicated set of compute nodes for querying external table data. This can isolate the query load of external tables (such as large-scale analysis on Hive) from the query load of internal tables (such as low-latency fast data analysis).

At the same time, compute nodes, as stateless BE nodes, can easily scale up and down. For example, you can deploy a cluster of elastic compute nodes using k8s, utilize more compute nodes for data lake analysis during business peak hours, and quickly scale down during off-peak hours to reduce costs.

## Frequently Asked Questions

1. Can mixed nodes and compute nodes be converted to each other

    Compute nodes can be converted to mixed nodes. However, mixed nodes cannot be converted to compute nodes.
    
    - Convert compute nodes to mixed nodes

        1. Stop the BE nodes.
        2. Remove the `be_node_role` configuration in `be.conf` or configure it as `be_node_role=mix`.
        3. Configure the correct `storage_root_path` data storage directory.
        4. Start the BE nodes.

    - Convert mixed nodes to compute nodes

        In principle, this operation is not supported because mixed nodes themselves store data. If conversion is needed, first perform node safe decommissioning, then set it as a compute node in the manner of a new node.

2. Do compute nodes need to configure a data storage directory

    Yes. The data storage directory of compute nodes will not store user data, only some BE node's own information files like `cluster_id`, and some temporary files during operation.
    
    The storage directory of compute nodes only requires a small amount of disk space (in the MB range) and can be destroyed with the node at any time without affecting user data.

3. Can compute nodes and mixed nodes configure a file cache directory

    [File cache](../../lakehouse/filecache) caches data files from remote storage systems (HDFS or object storage) that have been recently accessed, speeding up subsequent queries for the same data.
    
    Both compute nodes and mixed nodes can set a file cache directory. The file cache directory needs to be created in advance.
    
    Additionally, Doris also employs strategies like consistent hashing to minimize the probability of cache invalidation during node scaling operations.

4. Do compute nodes need to be taken offline through DECOMMISION operation

    No. Compute nodes can be directly removed using the `DROP BACKEND` operation.
