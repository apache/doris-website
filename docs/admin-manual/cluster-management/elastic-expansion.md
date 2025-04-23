---
{
    "title": "Elastic Scaling",
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
Doris supports online elastic scaling, allowing users to dynamically add or remove nodes without interrupting services. This capability ensures businesses can meet growing demands or reduce idle resource waste. Scaling up or down BE nodes does not affect cluster availability but involves data migration, so it is recommended to perform scaling operations during periods of low business activity.

## Scale In/Out the FE Clusters

Doris FE nodes are divided into the following three roles, with each FE node containing a full set of metadata:

* Master Node: Responsible for reading and writing metadata. When metadata changes occur on the Master node, they are synchronized to non-Master nodes via the BDB JE protocol. There can be only one Master FE node in the cluster.

* Follower Node: Responsible for reading metadata. In the event of a Master node failure, Follower nodes initiate a leader election to select a new Master node. Within the cluster, the total number of Master and Follower nodes is recommended to be an odd number.

* Observer Node: Responsible for reading metadata but does not participate in leader election. It is used to extend the read service capacity of FE nodes.

Typically, each FE node can handle the load operations of 10-20 BE nodes. A configuration of 3 FE nodes is sufficient to meet the requirements of most business scenarios.


### Scale the FE out

:::info Note:

When adding a new FE node, please pay attention to the following:

* The `http_port` of the new FE node must match the `http_port` of all existing FE nodes in the cluster.

* If adding a Follower node, it is recommended that the total number of Master and Follower nodes in the cluster be an odd number.

* You can view the ports and roles of the current cluster nodes using the `show frontends` command.
:::

1. Start FE Node:

```bash
fe/bin/start_fe.sh --helper <leader_fe_host>:<edit_log_port> --daemon
```

* Register FE Node:

  * Register the node as a Follower FE:

    ```sql
    ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>";
    ```

  * Register the node as an Observer FE:

    ```sql
    ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>";
    ```

* Check the status of the newly added FE node

  ```sql
  show frontends;
  ```


### Scale In the FE Cluster

When scaling in FE nodes, ensure that the total number of Master and Follower nodes in the cluster remains an odd number. Use the following commands to remove nodes:


```sql
ALTER SYSTEM DROP FOLLOWER[OBSERVER] "<fe_host>:<edit_log_port>";
```

After scaling in, you need to manually delete the FE directory.

## Scale In/Out the BE Cluster

### Scale Out the BE Cluster

1. Start the BE process:  

   ```sql
   be/bin/start_be.sh
   ```

2. Register the BE node:  

   ```sql
   ALTER SYSTEM ADD backend '<be_host>:<be_heartbeat_service_port>';
   ```

### Scale In the BE Cluster

When scaling in BE nodes, you can choose between the DROP or DECOMMISSION methods:

|          | DROP              | DECOMMISSION                                |
| -------- | ----------------- | ------------------------------------------- |
| Principle | Directly remove the node, deleting the BE node. | Initiates a command to migrate data on the BE node to other nodes. Once migration is complete, the BE node is automatically removed. |
| Effective Time | Takes effect immediately after execution. | Takes effect after data migration is completed. Depending on the cluster's existing data volume, this can take hours to up to a day. |
| Single Replica Table Handling | May result in data loss. | Does not result in data loss. |
| Removing Multiple Nodes Simultaneously | May result in data loss. | Does not result in data loss. |
| Production Recommendation | Not recommended for production environments. | Recommended for production environments. |

* Use the following command to remove a BE node using the DROP method: 

  ```sql
  ALTER SYSTEM DROP backend "<be_host>:<be_heartbeat_service_port>";
  ```

* Use the following command to remove a BE node using the DECOMMISSION method:  

  ```sql
  ALTER SYSTEM DECOMMISSION backend "<be_host>:<be_heartbeat_service_port>";
  ```

### DECOMMISSION Command Description:

- DECOMMISSION is an asynchronous operation. After execution, you can see the BE node's `SystemDecommissioned` status set to `true` via `SHOW backends;`. This indicates the node is being removed.

- The DECOMMISSION command may fail. For instance, if there is insufficient storage space on the remaining BE nodes to accommodate the data from the BE being removed, or if the remaining nodes do not meet the minimum replication requirements, the command will not complete, and the BE will remain in a `SystemDecommissioned` state set to `true`.

- The progress of DECOMMISSION can be monitored using `SHOW PROC '/backends';`. If the operation is in progress, the `TabletNum` value will decrease continuously.

- You can cancel the operation using the command `CANCEL DECOMMISSION BACKEND "be_host:be_heartbeat_service_port";`. After cancellation, the BE node will retain its current remaining data, and Doris will re-balance the load.

- The data migration rate can be adjusted by modifying the `balance_slot_num_per_path` parameter.

