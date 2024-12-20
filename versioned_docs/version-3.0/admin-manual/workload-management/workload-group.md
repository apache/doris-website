---
{
    "title": "Workload Group",
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

Use Workload Groups in Doris to manage and limit resources. By employing resource control, you can effectively limit the CPU, memory, and IO resources used by queries and imports, and create query queues to manage the maximum concurrency of queries in the cluster. Since Doris version 2.1, CPU resource limitations are enforced using CGroup. Before using the Workload resource control feature, you need to configure the CGroup environment. When setting up Workload resource control, you must first choose whether to apply soft or hard limits based on your business needs:
- Soft Limit: Allows borrowing resources from other Workload Groups when there is no resource contention, potentially exceeding the soft limit.
- Hard Limit: Ensures that the resource allocation cannot exceed the specified quota, regardless of resource contention.

To use Workload resource control, you need to perform the following steps:
1. Create a Workload Group.
2. Add resource limitation rules to the Workload Group.
3. Bind tenants to the Workload Group.

## Version Upgrade Notes
Workload resource control has been available since Doris version 2.0. In Doris 2.0, Workload resource control did not depend on CGroup, but Doris 2.1 requires CGroup.

Upgrading from Doris 2.0 to 2.1: Since Workload resource control in version 2.1 depends on CGroup, you must first configure the CGroup environment before upgrading to Doris 2.1.

## Configuring the CGroup Environment
In Doris version 2.0, CPU resource limitation was implemented based on Doris's scheduling, which provided great flexibility but lacked precise CPU isolation. From version 2.1, Doris uses CGroup for CPU resource limitation. Users requiring strong resource isolation are recommended to upgrade to version 2.1 and ensure CGroup is installed on all BE nodes.

If you used soft limits in Workload Groups in version 2.0 and upgraded to 2.1, you also need to configure CGroup to avoid losing soft limit functionality. Without CGroup configured, users can use all Workload Group features except CPU limitation.

:::tip
1. The Doris BE node can effectively utilize the CPU and memory resources of the machine. It is recommended to deploy only one BE instance per machine. Currently, the workload resource management does not support deploying multiple BE instances on a single machine.
2. After a machine restart, the following CGroup configurations will be cleared. If you want the configurations to persist after a reboot, you can use systemd to set the operation as a custom system service. This way, the creation and authorization operations will be automatically performed each time the machine restarts.
3. If CGroup is used within a container, the container needs to have permissions to operate on the host machine.
   :::

### Verifying CGroup Installation on BE Nodes
Check /proc/filesystems to determine if CGroup is installed:
cat /proc/filesystems | grep cgroup
nodev   cgroup
nodev   cgroup2
nodev   cgroupfs
Look for cgroup, cgroup2, or cgroupfs in the output, indicating CGroup support. Further verify the CGroup version.

#### Determining CGroup Version
For CGroup V1, multiple subsystems are mounted under /sys/fs/cgroup. The presence of /sys/fs/cgroup/cpu indicates CGroup V1 is in use:
```
## CGroup V1 is in use
ls /sys/fs/cgroup/cpu
```

For CGroup V2, all controllers are managed in a unified hierarchy. The presence of /sys/fs/cgroup/cgroup.controllers indicates CGroup V2 is in use:
```
## CGroup V2 is in use
ls /sys/fs/cgroup/cgroup.controllers
```
Configure CGroup based on its version when using Workload resource control in Doris.

### Using CGroup V1
If using CGroup V1, you need to create a CPU management directory for Doris under the /sys/fs/cgroup/cpu directory. You can customize the directory name. In the following example, /sys/fs/cgroup/cpu/doris is used:
```
## Create cgroup dir for Doris
mkdir /sys/fs/cgroup/cpu/doris

## Modify the Doris cgroup directory permissions
chmod 770 /sys/fs/cgroup/cpu/doris

## Grant user permissions for Doris usage
chown -R doris:doris /sys/fs/cgroup/cpu/doris
```

### Using CGroup V2
Due to stricter permission control in CGroup V2, write access to the cgroup.procs file in the root directory is required to move processes between groups:
Grant permission to the cgroup.procs directory using the following command:

```
chmod a+w /sys/fs/cgroup/cgroup.procs
```

### Configuring CGroup for BE Nodes
Before using Workload resource control, configure the CGroup path in the BE configuration file be/conf/be.conf:
```
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris
```
Restart the BE node after configuring be.conf. Check the BE.INFO log for the "add thread {pid} to group" message to confirm successful configuration.

## Managing Resources with Workload Groups
After creating a Workload Group, you can add resource limitation rules. Doris currently supports the following rules:
- Hard or soft limits on CPU
- Hard or soft limits on memory
- Limits on remote or local IO
- Query queues for managing query jobs

### Creating Custom Workload Groups
Use an ADMIN user to create Workload Groups and add resource rules using the CREATE WORKLOAD GROUP statement. Since Doris 2.1, a default Workload Group named normal is automatically created, and users are bound to it by default. The following example creates a Workload Group g1 with CPU and memory resource limits:

```
CREATE WORKLOAD GROUP IF NOT EXISTS g1
PROPERTIES(
    "cpu_share"="1024",
    "memory_limit"="30%"
);
```

### Modifying Workload Group Resource Rules
You can view the created Workload Group information by accessing the Doris system table information_schema.workload_groups.
To delete a Workload Group, refer to [DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-WORKLOAD-GROUP);
The ALTER-WORKLOAD-GROUP command can be used to adjust and modify the Workload Group configuration, refer[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-WORKLOAD-GROUP).

#### Adding or Modifying Resource Items
Modify the memory limit for the g1 Workload Group:
```
ALTER WORKLOAD GROUP g1 PROPERTIES('memory_limit'='10%');
```

You can view the modified memory limits through the information_schema.workload_groups system table:
```
SELECT name, memory_limit FROM information_schema.workload_groups;
+--------+--------------+
| name   | memory_limit |
+--------+--------------+
| normal | 30%          |
| g1     | 10%          |
+--------+--------------+
```

#### Configuring Soft and Hard Limits
Using the Workload Group feature, you can set soft and hard limits for CPU and memory resources, while for remote and local I/O, only hard limits are available:
- Soft Limit: The soft limit acts as a warning threshold for the resource. Under normal operation, users will not exceed this limit. When other Workload Groups have lower loads, resources from those groups can be borrowed, exceeding the soft limit.
- Hard Limit: The hard limit is the absolute upper bound for resource usage. Regardless of whether other Workload Groups are underloaded, the hard limit cannot be exceeded. Hard limits are typically used to prevent resource misuse in the system.

|           | soft limit switch  and params                                                    | soft limit switch  and params                                                              | Description    |
|-----------|----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|-----|
| CPU       | Switch：FE Config - enable_cpu_hard_limit = false params：Property - cpu_share     | switch：FE Config - enable_cpu_hard_limit = true params: property - cpu_hard_limit  |Only soft or hard limits can be set for different Workload Groups simultaneously     |
| Memory    | Switch：property - enable_memory_overcommit = true params：property - memory_limit | switch：property - enable_memory_overcommit = false params: property - memory_limit         | Soft and hard limits can be set independently for different Workload Groups    |
| local IO  | None                                                                             | params: read_bytes_per_second                                                              |  Only hard limits are currently available for local IO   |
| remote IO | None                                                                             | params: remote_read_bytes_per_second                                                       |  Only hard limits are currently available for remote IO   |


### Binding Tenants to Workload Groups
Non-ADMIN users must first check their permissions for a Workload Group. Use the information_schema.workload_groups system table to verify permissions. Bind tenants to Workload Groups using user properties or session variables. Session variables take precedence over user properties.
```
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```

If you cannot see the g1 Workload Group, you can use the GRANT statement to grant permissions to the user.
When binding a Workload Group to a tenant, you can do so either by setting a user property or specifying a session variable. When both methods are used, the session variable takes priority over the user property:

- Binding Workload Group using user property: Typically, administrators use the SET-PROPERTY command to bind the default Workload Group for a tenant. In the following example, the default Workload Group g1 is bound to the test_wlg tenant。
```
set property for 'test_wlg' 'default_workload_group' = 'g1';
```

- Using Session Variables: During development, even if an administrator has set a default Workload Group, it can be overridden in the session using the workload_group variable. In the following example, the Workload Group for the current session is set to g1:
```
SET workload_group = 'g1';
```

## Grouping Workload Groups
In a multi-workload or multi-tenant environment, a Doris cluster may be split into multiple sub-clusters, such as some nodes used for federated queries from external storage and some nodes used for real-time queries on internal tables. Workload Groups can tag BE nodes, and BE nodes with the same tag form a sub-cluster. The resources of each sub-cluster are calculated independently, and the total resource usage within each sub-cluster cannot exceed 100%. In the following example, seven machines are divided into two sub-clusters, sub_a and sub_b, with two Workload Groups created in each sub-cluster.
In a multi-workload or multi-tenant environment, a Doris cluster may be split into multiple sub-clusters, such as some nodes used for federated queries from external storage and some nodes used for fact queries on internal tables. The two sub-clusters are completely isolated in terms of data distribution and resource usage. Within the same sub-cluster, multiple tenants need to be created along with isolation rules for resource usage between tenants. For complex resource isolation requirements, you can combine the Resource Group and Workload Group features. Resource Groups can be used to achieve node-level isolation for multiple sub-clusters, while Workload Groups can be used within each sub-cluster to isolate resource usage between tenants. As shown in the diagram below, two sub-clusters, A and B, are defined, each with its own Workload Group for resource management:

![group_workload_group_1](/images/workload-management/group_wg_1.png)

1. Create sub_cluster_a and sub_cluster_b Resource Groups, dividing seven machines into two sub-clusters:
```
-- create resource group sub_cluster_a
ALTER SYSTEM MODIFY BACKEND "192.168.88.31:9050" SET("tag.location" = "sub_cluster_a");
ALTER SYSTEM MODIFY BACKEND "192.168.88.32:9050" SET("tag.location" = "sub_cluster_a");
ALTER SYSTEM MODIFY BACKEND "192.168.88.33:9050" SET("tag.location" = "sub_cluster_a");

-- create resource group sub_cluster_b
ALTER SYSTEM MODIFY BACKEND "192.168.88.34:9050" SET("tag.location" = "sub_cluster_b");
ALTER SYSTEM MODIFY BACKEND "192.168.88.35:9050" SET("tag.location" = "sub_cluster_b");
```

2. Create Workload Groups for memory resource isolation within sub-clusters:
```
-- create workload groups for sub cluster A
CREATE WORKLOAD GROUP a_wlg_1 PROPERTIES('tag' = "sub_cluster_a", "memory_limit" = "30");
CREATE WORKLOAD GROUP a_wlg_2 PROPERTIES('tag' = "sub_cluster_a", "memory_limit" = "30");
CREATE WORKLOAD GROUP a_wlg_3 PROPERTIES('tag' = "sub_cluster_a", "memory_limit" = "30");

-- create workload groups for sub cluster B
CREATE WORKLOAD GROUP b_wlg_1 PROPERTIES('tag' = "sub_cluster_b", "memory_limit" = "30");
CREATE WORKLOAD GROUP b_wlg_2 PROPERTIES('tag' = "sub_cluster_b", "memory_limit" = "30");
```

## NOTE
1. Using Workload Resource Control in Kubernetes: Workload's CPU management relies on CGroup. If using Workload Groups in containers, start the container in privileged mode to allow the Doris process to read and write the host's CGroup files. When Doris runs in a container, the CPU resources allocated to the Workload Group are based on the container's available resources.
2. Memory and IO Management: Workload Group's memory and IO management are implemented internally by Doris and do not depend on external components, so there is no difference in deployment on containers or physical machines. For Doris deployment on K8S, using the Doris Operator is recommended to abstract away underlying permission details.