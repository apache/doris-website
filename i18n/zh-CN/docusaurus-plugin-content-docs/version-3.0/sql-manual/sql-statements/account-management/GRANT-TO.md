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

You can use Workload Groups to manage the CPU, memory, and I/O resources used by queries and imports in the Doris cluster, and to control the maximum concurrency of queries in the cluster. Permissions for Workload Groups can be granted to specific roles and users.

Workload Groups are particularly effective in the following scenarios:
1. For scenarios where performance stability is preferred, and it is not required for query load to utilize all cluster resources, but stable query latency is desired. In such cases, you can set hard limits on CPU/I/O for Workload Groups.
2. When overall cluster load is high and availability decreases, you can restore cluster availability by degrading Workload Groups that consume excessive resources. For example, reduce the maximum query concurrency and I/O throughput for these Workload Groups.

Using hard limits for resource management usually results in better stability and performance, such as configuring maximum concurrency for FE and setting hard limits on CPU. Soft limits on CPU typically only have an effect when the CPU is fully utilized, which can lead to increased latency due to resource contention with other Doris components (RPC) and the operating system. Configuring hard limits for Doris query loads can effectively mitigate this issue. Additionally, setting maximum concurrency and queuing can help prevent the exhaustion of all available cluster resources during peak times with continuous incoming queries.

## Version Description
Workload Group is a feature that has been supported since version 2.0. The main difference between version 2.0 and 2.1 is that the 2.0 version of Workload Group does not rely on CGroup, while the 2.1 version of Workload Group depends on CGroup. Therefore, when using the 2.1 version of Workload Group, the environment of CGroup needs to be configured.

#### Upgrade to version 2.0
If upgrading from version 1.2 to version 2.0, it is recommended to enable the WorkloadGroup after the overall upgrade of the Doris cluster is completed. Because if you only upgrade a single Follower and enable this feature, as the FE code of the Master has not been updated yet, there is no metadata information for Workload Group in the Doris cluster, which may cause queries for the upgraded Follower nodes to fail. The recommended upgrade process is as follows:
* First, upgrade the overall code of the Doris cluster to version 2.0.
* Start using this feature according to the section ***Workload group usage*** in the following text.

#### Upgrade to version 2.1
If the code version is upgraded from 2.0 to 2.1, there are two situations:

Scenario 1: In version 2.1, if the Workload Group has already been used, you only need to refer to the process of configuring cgroup v1 in the following text to use the new version of the Workload Group.

Scenario 2: If the Workload Group is not used in version 2.0, it is also necessary to upgrade the Doris cluster as a whole to version 2.1, and then start using this feature according to the section ***Workload group usage*** in the following text.

## Workload group properties

* cpu_share: Optional, The default value is 1024, with a range of positive integers. used to set how much cpu time the workload group can acquire, which can achieve soft isolation of cpu resources. cpu_share is a relative value indicating the weight of cpu resources available to the running workload group. For example, if a user creates 3 workload groups rg-a, rg-b and rg-c with cpu_share of 10, 30 and 40 respectively, and at a certain moment rg-a and rg-b are running tasks while rg-c has no tasks, then rg-a can get 25% (10 / (10 + 30)) of the cpu resources while workload group rg-b can get 75% of the cpu resources. If the system has only one workload group running, it gets all the cpu resources regardless of the value of its cpu_share.

* memory_limit: Optional, default value is 0% which means unlimited, range of values from 1% to 100%. set the percentage of be memory that can be used by the workload group. The absolute value of the workload group memory limit is: `physical_memory * mem_limit * memory_limit`, where mem_limit is a be configuration item. The total memory_limit of all workload groups in the system must not exceed 100%. Workload groups are guaranteed to use the memory_limit for the tasks in the group in most cases. When the workload group memory usage exceeds this limit, tasks in the group with larger memory usage may be canceled to release the excess memory, refer to enable_memory_overcommit.

* enable_memory_overcommit: Optional, enable soft memory isolation for the workload group, default is true. if set to false, the workload group is hard memory isolated and the tasks with the largest memory usage will be canceled immediately after the workload group memory usage exceeds the limit to release the excess memory. if set to true, the workload group is hard memory isolated and the tasks with the largest memory usage will be canceled immediately after the workload group memory usage exceeds the limit to release the excess memory. if set to true, the workload group is softly isolated, if the system has free memory resources, the workload group can continue to use system memory after exceeding the memory_limit limit, and when the total system memory is tight, it will cancel several tasks in the group with the largest memory occupation, releasing part of the excess memory to relieve the system memory pressure. It is recommended that when this configuration is enabled for a workload group, the total memory_limit of all workload groups should be less than 100%, and the remaining portion should be used for workload group memory overcommit.

* cpu_hard_limit: Optional, default value -1%, no limit. The range of values is from 1% to 100%. In CPU hard limit mode, the maximum available CPU percentage of Workload Group cannot exceed cpu_hard_limit value, regardless of whether the current machine's CPU resources are fully utilized.
  Sum of all Workload Groups's cpu_hard_limit cannot exceed 100%. This is a new property added since version 2.1.
* max_concurrency: Optional, maximum query concurrency, default value is the maximum integer value, which means there is no concurrency limit. When the number of running queries reaches this value, new queries will being queued.
* max_queue_size: Optional, length of the query queue. When the queue is full, new queries will be rejected. The default value is 0, which means no queuing.
* queue_timeout: Optional, query the timeout time in the queue, measured in milliseconds. If the query exceeds this value, an exception will be thrown directly to the client. The default value is 0, which means no queuing.
* scan_thread_num: Optional, the number of threads used for scanning in the current workload group. The default value is -1, which means it does not take effect, the number of scan threads in the be configuration shall prevail. The value is an integer greater than 0.
* max_remote_scan_thread_num: Optional. The maximum number of threads in the scan thread pool for reading external data sources. The default value is -1, which means the actual number of threads is determined by the BE and is typically related to the number of cores.
* min_remote_scan_thread_num: Optional. The minimum number of threads in the scan thread pool for reading external data sources. The default value is -1, which means the actual number of threads is determined by the BE and is typically related to the number of cores.
* tag: Optional. Default is empty. Assigns a tag to the Workload Group. The sum of resources for Workload Groups with the same tag cannot exceed 100%. If multiple values are desired, they can be separated by commas. Detailed description of the tagging function will follow.
* read_bytes_per_second: Optional. Specifies the maximum I/O throughput when reading internal tables in Doris. The default value is -1, which means there is no limit on I/O bandwidth. Note that this value is not bound to disks but to folders. For example, if Doris is configured with two folders for storing internal table data, the maximum read I/O for each folder will not exceed this value. If these two folders are configured on the same disk, the maximum throughput control will be twice the read_bytes_per_second. The directory where files are written is also subject to this value.
* remote_read_bytes_per_second: Optional. Specifies the maximum I/O throughput when reading external tables in Doris. The default value is -1, which means there is no limit on I/O bandwidth.

Notes:

1. At present, the simultaneous use of CPU's soft and hard limits is not supported. A cluster can only have soft or hard limits at a certain time. The switching method will be described in the following text.

2. All properties are optional, but at least one property needs to be specified when creating a Workload Group.

3. It is important to note that the default CPU soft limit values differ between cgroup v1 and cgroup v2. In cgroup v1, the default CPU soft limit value is 1024, with a range of 2 to 262144. In contrast, cgroup v2 has a default CPU soft limit value of 100, with a range of 1 to 10000.

If a value outside of this range is specified for the soft limit, it can lead to a failure in modifying the CPU soft limit in the backend. Additionally, if you set the default value of 100 in a cgroup v1 environment, it might cause the priority of this workload group to be the lowest on the machine.

## Grouping Workload Group By Tag
The Workload Group feature divides the resource usage of a single BE. When a user creates a Workload Group (Group A), its metadata is by default sent to all BEs and threads are started on each BE, leading to the following issues:
1. Multiple Clusters Issue: In a production environment, a Doris cluster is typically divided into several smaller clusters, such as a local storage cluster and a cluster with Compute Nodes for querying external storage. These two clusters operate independently. If a user wants to use the Workload Group feature, it would lead to the issue where the mem_limit of Workload Groups for external storage and local storage cannot exceed 100%, even though these two types of load are on completely different machines, which is obviously unreasonable.
2. Thread Resource Management: The number of threads itself is a resource. If a process's thread quota is exhausted, it will cause the process to crash. Therefore, sending the Workload Group metadata to all nodes by default is also unreasonable.

To address these issues, Doris implements a grouping feature for Workload Groups. The cumulative value of Workload Groups with the same tag cannot exceed 100%, but there can be multiple such tag groups within a cluster. When a BE node is tagged, it will match the corresponding Workload Groups based on specific rules.

Example:
1. Create a Workload Group named tag_wg with the tag cn1. If none of the BEs in the cluster have been tagged, the metadata for this Workload Group will be sent to all BEs. The tag attribute can specify multiple values, separated by commas.
```
create workload group tag_wg properties('tag'='cn1');
```
2. Modify the tag of a BE in the cluster to cn1. At this point, the tag_wg Workload Group will only be sent to this BE and any BE with no tag. The tag.workload_group attribute can specify multiple values, separated by commas.
   It is important to note that the alter interface currently does not support incremental updates. Each time the BE attributes are modified, the entire set of attributes needs to be provided. Therefore, in the statements below, the tag.location attribute is added, with 'default' as the system default value. In practice, the existing attributes of the BE should be specified accordingly.
```
alter system modify backend "localhost:9050" set ("tag.workload_group" = "cn1", "tag.location"="default");
```

Workload Group and BE Matching Rules:
If the Workload Group's tag is empty, the Workload Group can be sent to all BEs, regardless of whether the BE has a tag or not.
If the Workload Group's tag is not empty, the Workload Group will only be sent to BEs with the same tag.

You can refer to the recommended usage:[group-workload-groups](./group-workload-groups.md)

## Configure GGroup

The 2.0 version of Doris uses scheduling based on Doris itself to implement CPU resource limitations. However, starting from version 2.1, Doris defaults to using CGroup-based CPU resource limitations. Therefore, if you wish to enforce CPU resource constraints in version 2.1, the node where the BE (Backend) is located must have the CGroup environment already installed.

Currently, supported CGroup versions are CGroup v1 and CGroup v2.

If users use the Workload Group software limit in version 2.0 and upgrade to version 2.1, they also need to configure CGroup, Otherwise, cpu soft limit may not work.

If using CGroup within a container, the container needs to have permission to operate the host.

Without configuring GGroup, users can use all functions of the workload group except for CPU limitations.

1. Firstly, confirm that the CGgroup has been installed on the node where BE is located.
```
cat /proc/filesystems | grep cgroup
nodev	cgroup
nodev	cgroup2
nodev	cgroupfs
```

2. Check the cgroup version.
```
If this path exists, it indicates that cgroup v1 is currently active.
/sys/fs/cgroup/cpu/


If this path exists, it indicates that cgroup v2 is currently active.
/sys/fs/cgroup/cgroup.controllers
```

3. Create a new directory named ```doris``` in CGroup path, user can specify their own directory name.

```
// If using CGroup v1, then mkdir as follow:
mkdir /sys/fs/cgroup/cpu/doris

// If using CGroup v2, then mkdir as follow:
mkdir /sys/fs/cgroup/doris
```

4. It is necessary to ensure that Doris's BE process has read/write/execute permissions for this directory
```
// If using CGroup v1, then do as follow:
// 1.Modify the permissions of this directory to read, write, and execute
chmod 770 /sys/fs/cgroup/cpu/doris

// 2.Assign the ownership of this directory to Doris's account
chown -R doris:doris /sys/fs/cgroup/cpu/doris


// If using CGroup v2, then do as follow:
// 1.Modify the permissions of this directory to read, write, and execute
chmod 770 /sys/fs/cgroup/doris

// 2.Assign the ownership of this directory to Doris's account
chown -R doris:doris /sys/fs/cgroup/doris

```

5. If CGroup v2 is being used in the current environment, the following actions need to be taken. This is because cgroup v2 has stricter permission controls, requiring write access to the cgroup.procs file in the root directory in order to move processes between groups.
   This step can be skipped if using CGroup v1.
```
chmod a+w /sys/fs/cgroup/cgroup.procs
```

6. Modify the configuration of BE and specify the path to cgroup
```
// If using CGroup v1:
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris


// If using CGroup v2:
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```

7. restart BE, in the log (be. INFO), you can see the words "add thread xxx to group" indicating successful configuration.

:::tip
NOTE:
1. The current workload group does not yet support the deployment of multiple BEs on a single machine.
2. After the machine is restarted, the above cgroup configurations will be cleared. If you want the above configurations to take effect after a reboot, you can use systemd to set these operations as a custom system service, so that the creation and permission assignments are automatically completed each time the machine restarts.
:::

## Note for Using Workload Groups in K8S
The CPU management for Workloads is implemented based on CGroup. To use Workload Groups within containers, you need to start the containers in privileged mode so that the Doris processes inside the container have permission to read and write CGroup files on the host.

When Doris runs inside a container, the CPU resources for Workload Groups are allocated based on the container's available resources. For example, if the host machine has 64 cores and the container is allocated 8 cores, with a CPU hard limit of 50% configured for the Workload Group, the actual number of usable cores for the Workload Group would be 4 (8 cores * 50%).

Memory and I/O management for Workload Groups are handled internally by Doris and do not rely on external components, so there is no difference in deployment between containers and physical machines.

If you want to use Doris on K8S, it is recommended to use the Doris Operator for deployment, as it can abstract away the underlying permission details.

## Workload group usage
1. First, create a custom workload group.
```
create workload group if not exists g1
properties (
    "cpu_share"="1024",
    "memory_limit"="30%",
    "enable_memory_overcommit"="true"
);
```
This is soft CPU limit. Since version 2.1, the system will automatically create a group named ```normal```, which cannot be deleted.
For details on creating a workload group, see [CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS).

2. show/alter/drop workload group statement as follows:
```
show workload groups;

alter workload group g1 properties('memory_limit'='10%');

drop workload group g1;
```
to view the workload group, you can visit doris system table ```information_schema.workload_groups``` or [SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS);to delete a workload group, refer to [DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP); to modify a workload group, refer to [ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP).

3. Bind the workload group.
* Bind the user to the workload group by default by setting the user property to ```normal```.Note that the value here cannot be left blank, otherwise the statement will fail to execute. If you're unsure which group to set, you can set it to ```normal```, as ```normal``` is the global default group.
```
set property 'default_workload_group' = 'g1'.
```
After executing this statement, the current user's query will use 'g1' by default.

* Specify the workload group via the session variable, which defaults to null.
```
set workload_group = 'g1'.
```
session variable `workload_group` takes precedence over user property `default_workload_group`, in case `workload_group` is empty, the query will be bound to `default_workload_group`, in case session variable ` workload_group` is not empty, the query will be bound to `workload_group`.

If you are a non-admin user, you need to execute [SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS) to check if the current user can see the workload group, if not, the workload group may not exist or the current user does not have permission to execute the query. If you cannot see the workload group, the workload group may not exist or the current user does not have privileges. To authorize the workload group, refer to: [grant statement](../../sql-manual/sql-statements/account-management/GRANT-TO).

4. Execute the query, which will be associated with the g1 workload group.

### Query Queue
```
create workload group if not exists queue_group
properties (
    "cpu_share"="10",
    "memory_limit"="30%",
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```
1. It should be noted that the current queuing design is not aware of the number of FEs, and the queuing parameters only works in a single FE, for example:

A Doris cluster is configured with a work load group and set max_concurrency=1,
If there is only 1 FE in the cluster, then this workload group will only run one SQL at the same time from the Doris cluster perspective,
If there are 3 FEs, the maximum number of query that can be run in Doris cluster is 3.

2. In some operational scenarios, the administrator needs to bypass the queuing. This can be achieved by setting a session variable:
```
set bypass_workload_group = true;
```

### Configure CPU hard limits
At present, Doris defaults to running the CPU's soft limit. If you want to use Workload Group's hard limit, you can do as follows.

1 Enable the cpu hard limit in FE. If there are multiple FE, the same operation needs to be performed on each FE.
```
1 modify fe.conf in disk
experimental_enable_cpu_hard_limit = true

2 modify conf in memory
ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
```

2 modify cpu_hard_limit
```
alter workload group g1 properties ( 'cpu_hard_limit'='20%' );
```

3 Viewing the current configuration of the Workload Group, it can be seen that although the cpu_share may not be 0, but due to the hard limit mode being enabled, the query will also follow the CPU's hard limit during execution. That is to say, the switch of CPU software and hardware limits does not affect workload group modification.
```
mysql [information_schema]>select name, cpu_share,memory_limit,enable_memory_overcommit,cpu_hard_limit from information_schema.workload_groups where name='g1';
+------+-----------+--------------+--------------------------+----------------+
| name | cpu_share | memory_limit | enable_memory_overcommit | cpu_hard_limit |
+------+-----------+--------------+--------------------------+----------------+
| g1   |      1024 | 30%          | true                     | 20%            |
+------+-----------+--------------+--------------------------+----------------+
1 row in set (0.02 sec)
```

### How to switch CPU limit node between soft limit and hard limit
At present, Doris does not support running both the soft and hard limits of the CPU simultaneously. A Doris cluster can only have either the CPU soft limit or the CPU hard limit at any time.

Users can switch between two modes, and the main switching methods are as follows:

1 If the current cluster configuration is set to the default CPU soft limit and it is expected to be changed to the CPU hard limit, then cpu_hard_limit should be set to a valid value first.
```
alter workload group test_group properties ( 'cpu_hard_limit'='20%' );
```
It is necessary to modify cpu_hard_limit of all Workload Groups in the current cluster, sum of all Workload Group's cpu_hard_limit cannot exceed 100%.
Due to the CPU's hard limit can not being able to provide a valid default value, if only the switch is turned on without modifying cpu_hard_limit, the CPU's hard limit will not work.

2 Turn on the CPU hard limit switch in all FEs.
```
1 modify fe.conf
experimental_enable_cpu_hard_limit = true

2 modify conf in memory
ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
```

If user expects to switch back from cpu hard limit to cpu soft limit, then they only need to set ```enable_cpu_hard_limit=false```.
CPU Soft Limit property ```cpu_share``` will be filled with a valid value of 1024 by default(If the user has never set the cpu_share before), and users can adjust cpu_share based on the priority of Workload Group.

# Workload Group Permissions Table
You can view the Workload Groups that users or roles have access to through the Workload Group privilege table. Authorization related usage can refer to[grant statement](../../sql-manual/sql-statements/account-management/GRANT-TO).

This table currently has row level permission control. Root or admin accounts can view all data, while non root/admin accounts can only see data from Workload Groups that they have access to.

Schema of Workload Group privilege table is as follow:
```
mysql [information_schema]>desc information_schema.workload_group_privileges;
+---------------------+--------------+------+-------+---------+-------+
| Field               | Type         | Null | Key   | Default | Extra |
+---------------------+--------------+------+-------+---------+-------+
| GRANTEE             | varchar(64)  | Yes  | false | NULL    |       |
| WORKLOAD_GROUP_NAME | varchar(256) | Yes  | false | NULL    |       |
| PRIVILEGE_TYPE      | varchar(64)  | Yes  | false | NULL    |       |
| IS_GRANTABLE        | varchar(3)   | Yes  | false | NULL    |       |
+---------------------+--------------+------+-------+---------+-------+
```

Column Description:
1. grantee, user or role.
2. workload_group_name, value is the name of Workload Group or '%', where '%' represents all Workload Group.
3. privilege_type, type of privilege, at present, the value of this column is only Usage_priv.
4. is_grantable, value is YES or NO, it means whether the user can grant access privilege of Workload Group to other user.Only root/admin user has grant privilege.

Basic usage:
1. Search for Workload Group with authorized access based on username.
```
mysql [information_schema]>select * from workload_group_privileges where GRANTEE like '%test_wlg_user%';
+---------------------+---------------------+----------------+--------------+
| GRANTEE             | WORKLOAD_GROUP_NAME | PRIVILEGE_TYPE | IS_GRANTABLE |
+---------------------+---------------------+----------------+--------------+
| 'test_wlg_user'@'%' | normal              | Usage_priv     | NO           |
| 'test_wlg_user'@'%' | test_group          | Usage_priv     | NO           |
+---------------------+---------------------+----------------+--------------+
2 rows in set (0.04 sec)
```

2. Search for user which has access privilege by Workload Group name.
```
mysql [information_schema]>select * from workload_group_privileges where WORKLOAD_GROUP_NAME='test_group';
+---------------------+---------------------+----------------+--------------+
| GRANTEE             | WORKLOAD_GROUP_NAME | PRIVILEGE_TYPE | IS_GRANTABLE |
+---------------------+---------------------+----------------+--------------+
| 'test_wlg_user'@'%' | test_group          | Usage_priv     | NO           |
+---------------------+---------------------+----------------+--------------+
1 row in set (0.03 sec)
```
`csv_with_names_and_types` format: Currently, it does not support parsing the column type from a csv file. When using this format, S3 tvf will parse the first line of the file as the number and name of the columns of the table schema, and set the column type to String. Meanwhile, the second line of the file is ignored.

The file content of student_with_names_and_types.csv:

```
id,name,age
INT,STRING,INT
1,ftw,12
2,zs,18
3,ww,20
```

use S3 tvf

```sql
MySQL [(none)]> select * from s3("uri" = "http://127.0.0.1:9312/test2/student_with_names_and_types.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv_with_names_and_types",
->                 "use_path_style" = "true") order by id;
+------+------+------+
| id   | name | age  |
+------+------+------+
| 1    | ftw  | 12   |
| 2    | zs   | 18   |
| 3    | ww   | 20   |
+------+------+------+
```

You can also use `desc function S3()` to view the Table Schema.

```sql
MySQL [(none)]> Desc function s3("uri" = "http://127.0.0.1:9312/test2/student_with_names_and_types.csv",
->                 "s3.access_key"= "minioadmin",
->                 "s3.secret_key" = "minioadmin",
->                 "s3.endpoint" = "http://127.0.0.1:9312",
->                 "s3.region" = "us-east-1",
->                 "format" = "csv_with_names_and_types",
->                 "use_path_style" = "true");
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | TEXT | Yes  | false | NULL    | NONE  |
| name  | TEXT | Yes  | false | NULL    | NONE  |
| age   | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

**json format**

`json` format: The json format involves many optional parameters, and the meaning of each parameter can be referred to: [Json Load](../../../data-operate/import/import-way/load-json-format.md). When S3 tvf queries the json format file, it locates a json object according to the `json_root` and `jsonpaths` parameters, and uses the `key` in the object as the column name of the table schema, and sets the column type to String. For example:

The file content of data.json:

```
[{"id":1, "name":"ftw", "age":18}]
[{"id":2, "name":"xxx", "age":17}]
[{"id":3, "name":"yyy", "age":19}]
```

use S3 tvf:

```sql
MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/data.json",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "json",
    "strip_outer_array" = "true",
    "read_json_by_line" = "true",
    "use_path_style"="true");
+------+------+------+
| id   | name | age  |
+------+------+------+
| 1    | ftw  | 18   |
| 2    | xxx  | 17   |
| 3    | yyy  | 19   |
+------+------+------+

MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/data.json",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "json",
    "strip_outer_array" = "true",
    "jsonpaths" = "[\"$.id\", \"$.age\"]",
    "use_path_style"="true");
+------+------+
| id   | age  |
+------+------+
| 1    | 18   |
| 2    | 17   |
| 3    | 19   |
+------+------+
```

**parquet format**

`parquet` format: S3 tvf supports parsing the column names and column types of the table schema from the parquet file. Example:

```sql
MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "parquet",
    "use_path_style"="true") limit 5;
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

```sql
MySQL [(none)]> desc function s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "parquet",
    "use_path_style"="true");
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

**orc format**

`orc` format: Same as `parquet` format, set `format` parameter to orc.

```sql
MySQL [(none)]> select * from s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.orc",
    "s3.access_key"= "minioadmin",
    "s3.secret_key" = "minioadmin",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "orc",
    "use_path_style"="true") limit 5;
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

**avro format**

`avro` format: S3 tvf supports parsing the column names and column types of the table schema from the avro file. Example:

```sql
select * from s3(
         "uri" = "http://127.0.0.1:9312/test2/person.avro",
         "ACCESS_KEY" = "ak",
         "SECRET_KEY" = "sk",
         "s3.endpoint" = "http://127.0.0.1:9312",
         "s3.region" = "us-east-1",
         "FORMAT" = "avro");
+--------+--------------+-------------+-----------------+
| name   | boolean_type | double_type | long_type       |
+--------+--------------+-------------+-----------------+
| Alyssa |            1 |     10.0012 | 100000000221133 |
| Ben    |            0 |    5555.999 |      4009990000 |
| lisi   |            0 | 5992225.999 |      9099933330 |
+--------+--------------+-------------+-----------------+
```

**uri contains wildcards**

uri can use wildcards to read multiple files. Note: If wildcards are used, the format of each file must be consistent (especially csv/csv_with_names/csv_with_names_and_types count as different formats), S3 tvf uses the first file to parse out the table schema. For example:

The following two csv files:

```
// file1.csv
1,aaa,18
2,qqq,20
3,qwe,19

// file2.csv
5,cyx,19
6,ftw,21
```

You can use wildcards on the uri to query.

```sql
MySQL [(none)]> select * from s3(
        "uri" = "http://127.0.0.1:9312/test2/file*.csv",
        "s3.access_key"= "minioadmin",
        "s3.secret_key" = "minioadmin",
        "s3.endpoint" = "http://127.0.0.1:9312",
        "s3.region" = "us-east-1",
        "format" = "csv",
        "use_path_style"="true");
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
| 1    | aaa  | 18   |
| 2    | qqq  | 20   |
| 3    | qwe  | 19   |
| 5    | cyx  | 19   |
| 6    | ftw  | 21   |
+------+------+------+
```

**Using `S3` tvf with `insert into` and `cast`**

```sql
// Create doris internal table
CREATE TABLE IF NOT EXISTS ${testTable}
    (
        id int,
        name varchar(50),
        age int
    )
    COMMENT "my first table"
    DISTRIBUTED BY HASH(id) BUCKETS 32
    PROPERTIES("replication_num" = "1");

// Insert data using S3
insert into ${testTable} (id,name,age)
select cast (id as INT) as id, name, cast (age as INT) as age
from s3(
    "uri" = "${uri}",
    "s3.access_key"= "${ak}",
    "s3.secret_key" = "${sk}",
    "s3.endpoint" = "http://127.0.0.1:9312",
    "s3.region" = "us-east-1",
    "format" = "${format}",
    "strip_outer_array" = "true",
    "read_json_by_line" = "true",
    "use_path_style" = "true");
```
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job02 ON routine_test02
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad02",
                "kafka_partitions" = "0",
                "kafka_offsets" = "3"
            );
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test02;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### 指定 Consumer Group 的 group.id 与 client.id

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test03 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job03 ON routine_test03
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.group.id" = "kafka_job03",
                "property.client.id" = "kafka_client_03",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test03;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    |    3 | Alexander  |   22 |
    +------+------------+------+
    3 rows in set (0.01 sec)
    ```

### 设置导入过滤条件

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test04 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job04 ON routine_test04
            COLUMNS TERMINATED BY ",",
            WHERE id >= 3
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad04",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test04;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### 导入指定分区数据

1. 导入数据样例

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test05 (
        id      INT            NOT NULL  COMMENT "ID",
        name    VARCHAR(30)    NOT NULL  COMMENT "Name",
        age     INT                      COMMENT "Age",
        date    DATETIME                 COMMENT "Date"
    )
    DUPLICATE KEY(`id`)
    PARTITION BY RANGE(`id`)
    (PARTITION partition_a VALUES [("0"), ("1")),
    PARTITION partition_b VALUES [("1"), ("2")),
    PARTITION partition_c VALUES [("2"), ("3")))
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job05 ON routine_test05
            COLUMNS TERMINATED BY ",",
            PARTITION(partition_b)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad05",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test05;
    +------+----------+------+---------------------+
    | id   | name     | age  | date                |
    +------+----------+------+---------------------+
    |    1 | Benjamin |   18 | 2024-02-04 10:00:00 |
    +------+----------+------+---------------------+
    1 rows in set (0.01 sec)
    ```

### 设置导入时区

1. 导入数据样例

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test06 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        date    DATETIME                 COMMENT "date"
    )
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job06 ON routine_test06
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "timezone" = "Asia/Shanghai"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad06",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test06;
    +------+-------------+------+---------------------+
    | id   | name        | age  | date                |
    +------+-------------+------+---------------------+
    |    1 | Benjamin    |   18 | 2024-02-04 10:00:00 |
    |    2 | Emily       |   20 | 2024-02-05 11:00:00 |
    |    3 | Alexander   |   22 | 2024-02-06 12:00:00 |
    +------+-------------+------+---------------------+
    3 rows in set (0.00 sec)
    ```
### 设置 merge_type

**指定 merge_type 进行 delete 操作**

1. 导入数据样例

```sql
3,Alexander,22
5,William,26
```

导入前表中数据如下

```sql
mysql> SELECT * FROM routine_test07;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|    1 | Benjamin       |   18 |
|    2 | Emily          |   20 |
|    3 | Alexander      |   22 |
|    4 | Sophia         |   24 |
|    5 | William        |   26 |
|    6 | Charlotte      |   28 |
+------+----------------+------+
```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test07 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job07 ON routine_test07
            WITH DELETE
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad07",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    4 | Sophia         |   24 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

**指定 merge_typpe 进行 merge 操作**

1. 导入数据样例

```sql
1,xiaoxiaoli,28
2,xiaoxiaowang,30
3,xiaoxiaoliu,32
4,dadali,34
5,dadawang,36
6,dadaliu,38
```

导入前表中数据如下：

```sql
mysql> SELECT * FROM routine_test08;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|    1 | Benjamin       |   18 |
|    2 | Emily          |   20 |
|    3 | Alexander      |   22 |
|    4 | Sophia         |   24 |
|    5 | William        |   26 |
|    6 | Charlotte      |   28 |
+------+----------------+------+
6 rows in set (0.01 sec)
```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job08 ON routine_test08
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            DELETE ON id = 2
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad08",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```

4. 导入结果

```sql
mysql> SELECT * FROM routine_test08;
+------+-------------+------+
| id   | name        | age  |
+------+-------------+------+
|    1 | xiaoxiaoli  |   28 |
|    3 | xiaoxiaoliu |   32 |
|    4 | dadali      |   34 |
|    5 | dadawang    |   36 |
|    6 | dadaliu     |   38 |
+------+-------------+------+
5 rows in set (0.00 sec)
```

**指定导入需要 merge 的 sequence 列**

1. 导入数据样例

```sql
1,xiaoxiaoli,28
2,xiaoxiaowang,30
3,xiaoxiaoliu,32
4,dadali,34
5,dadawang,36
6,dadaliu,38
```

导入前表中数据如下：

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
        "function_column.sequence_col" = "age"
    );
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job09 ON routine_test09
            WITH MERGE 
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age),
            DELETE ON id = 2,
            ORDER BY age
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "strict_mode" = "false"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad09",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

### 导入完成列影射与衍生列计算

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test10 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job10 ON routine_test10
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age, num=age*10)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad10",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test10;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### 导入包含包围符的数据

1. 导入数据样例

    ```sql
    1,"Benjamin",18
    2,"Emily",20
    3,"Alexander",22
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test11 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job11 ON routine_test11
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "enclose" = "\""
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test11;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.02 sec)
    ```

### JSON 格式导入

**以简单模式导入 JSON 格式数据**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test12 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job12 ON routine_test12
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test12;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

**匹配模式导入复杂的 JSON 格式数据**

1. 导入数据样例

    ```sql
    { "name" : "Benjamin", "id" : 1, "num":180 , "age":18 }
    { "name" : "Emily", "id" : 2, "num":200 , "age":20 }
    { "name" : "Alexander", "id" : 3, "num":220 , "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test13 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job13 ON routine_test13
            COLUMNS(name, id, num, age)
            PROPERTIES
            (
                "format" = "json",
                "jsonpaths" = "[\"$.name\",\"$.id\",\"$.num\",\"$.age\"]"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad13",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test13;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

**指定 JSON 根节点导入数据**

1. 导入数据样例

    ```sql
    {"id": 1231, "source" :{ "id" : 1, "name" : "Benjamin", "age":18 }}
    {"id": 1232, "source" :{ "id" : 2, "name" : "Emily", "age":20 }}
    {"id": 1233, "source" :{ "id" : 3, "name" : "Alexander", "age":22 }}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test14 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job14 ON routine_test14
            PROPERTIES
            (
                "format" = "json",
                "json_root" = "$.source"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad14",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test14;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**导入完成列影射与衍生列计算**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test15 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job15 ON routine_test15
            COLUMNS(id, name, age, num=age*10)
            PROPERTIES
            (
                "format" = "json",
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad15",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test15;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### 导入复杂类型

**导入 Array 数据类型**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "array":[1,2,3,4,5]}
    { "id" : 2, "name" : "Emily", "age":20, "array":[6,7,8,9,10]}
    { "id" : 3, "name" : "Alexander", "age":22, "array":[11,12,13,14,15]}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test16
    (
        id      INT             NOT NULL  COMMENT "id",
        name    VARCHAR(30)     NOT NULL  COMMENT "name",
        age     INT                       COMMENT "age",
        array   ARRAY<int(11)>  NULL      COMMENT "test array column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job16 ON routine_test16
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad16",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test16;
    +------+----------------+------+----------------------+
    | id   | name           | age  | array                |
    +------+----------------+------+----------------------+
    |    1 | Benjamin       |   18 | [1, 2, 3, 4, 5]      |
    |    2 | Emily          |   20 | [6, 7, 8, 9, 10]     |
    |    3 | Alexander      |   22 | [11, 12, 13, 14, 15] |
    +------+----------------+------+----------------------+
    3 rows in set (0.00 sec)
    ```

**导入 Map 数据类型**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "map":{"a": 100, "b": 200}}
    { "id" : 2, "name" : "Emily", "age":20, "map":{"c": 300, "d": 400}}
    { "id" : 3, "name" : "Alexander", "age":22, "map":{"e": 500, "f": 600}}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test17 (
        id      INT                 NOT NULL  COMMENT "id",
        name    VARCHAR(30)         NOT NULL  COMMENT "name",
        age     INT                           COMMENT "age",
        map     Map<STRING, INT>    NULL      COMMENT "test column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job17 ON routine_test17
        PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad17",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test17;
    +------+----------------+------+--------------------+
    | id   | name           | age  | map                |
    +------+----------------+------+--------------------+
    |    1 | Benjamin       |   18 | {"a":100, "b":200} |
    |    2 | Emily          |   20 | {"c":300, "d":400} |
    |    3 | Alexander      |   22 | {"e":500, "f":600} |
    +------+----------------+------+--------------------+
    3 rows in set (0.01 sec)
    ```

**导入 Bitmap 数据类型**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "bitmap_id":243}
    { "id" : 2, "name" : "Emily", "age":20, "bitmap_id":28574}
    { "id" : 3, "name" : "Alexander", "age":22, "bitmap_id":8573}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test18 (
        id        INT            NOT NULL      COMMENT "id",
        name      VARCHAR(30)    NOT NULL      COMMENT "name",
        age       INT                          COMMENT "age",
        bitmap_id INT                          COMMENT "test",
        device_id BITMAP         BITMAP_UNION  COMMENT "test column"
    )
    AGGREGATE KEY (`id`,`name`,`age`,`bitmap_id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job18 ON routine_test18
            COLUMNS(id, name, age, bitmap_id, device_id=to_bitmap(bitmap_id))
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad18",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 导入结果

    ```sql
    mysql> select id, BITMAP_UNION_COUNT(pv) over(order by id) uv from(
        ->    select id, BITMAP_UNION(device_id) as pv
        ->    from routine_test18 
        -> group by id 
        -> ) final;
    +------+------+
    | id   | uv   |
    +------+------+
    |    1 |    1 |
    |    2 |    2 |
    |    3 |    3 |
    +------+------+
    3 rows in set (0.00 sec)
    ```

**导入 HLL 数据类型**

1. 导入数据样例

    ```sql
    2022-05-05,10001,Test01,Beijing,windows
    2022-05-05,10002,Test01,Beijing,linux
    2022-05-05,10003,Test01,Beijing,macos
    2022-05-05,10004,Test01,Hebei,windows
    2022-05-06,10001,Test01,Shanghai,windows
    2022-05-06,10002,Test01,Shanghai,linux
    2022-05-06,10003,Test01,Jiangsu,macos
    2022-05-06,10004,Test01,Shaanxi,windows
    ```

2. 建表结构

    ```sql
    create table demo.routine_test19 (
        dt        DATE,
        id        INT,
        name      VARCHAR(10),
        province  VARCHAR(10),
        os        VARCHAR(10),
        pv        hll hll_union
    )
    Aggregate KEY (dt,id,name,province,os)
    distributed by hash(id) buckets 10;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job19 ON routine_test19
            COLUMNS TERMINATED BY ",",
            COLUMNS(dt, id, name, province, os, pv=hll_hash(id))
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad19",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test19;
    +------------+-------+----------+----------+---------+------+
    | dt         | id    | name     | province | os      | pv   |
    +------------+-------+----------+----------+---------+------+
    | 2022-05-05 | 10001 | Test01   | Beijing     | windows | NULL |
    | 2022-05-06 | 10001 | Test01   | Shanghai    | windows | NULL |
    | 2022-05-05 | 10002 | Test01   | Beijing     | linux   | NULL |
    | 2022-05-06 | 10002 | Test01   | Shanghai    | linux   | NULL |
    | 2022-05-05 | 10004 | Test01   | Heibei      | windows | NULL |
    | 2022-05-06 | 10004 | Test01   | Shanxi      | windows | NULL |
    | 2022-05-05 | 10003 | Test01   | Beijing     | macos   | NULL |
    | 2022-05-06 | 10003 | Test01   | Jiangsu     | macos   | NULL |
    +------------+-------+----------+----------+---------+------+
    8 rows in set (0.01 sec)

    mysql> SELECT HLL_UNION_AGG(pv) FROM routine_test19;
    +-------------------+
    | hll_union_agg(pv) |
    +-------------------+
    |                 4 |
    +-------------------+
    1 row in set (0.01 sec)
    ```

### Kafka 安全认证

**导入 SSL 认证的 Kafka 数据**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test20 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job20 ON routine_test20
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad21",
                "property.security.protocol" = "ssl",
                "property.ssl.ca.location" = "FILE:ca.pem",
                "property.ssl.certificate.location" = "FILE:client.pem",
                "property.ssl.key.location" = "FILE:client.key",
                "property.ssl.key.password" = "ssl_passwd"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test20;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**导入 Kerberos 认证的 Kafka 数据**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test21 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job21 ON routine_test21
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad21",
                "property.security.protocol" = "SASL_PLAINTEXT",
                "property.sasl.kerberos.service.name" = "kafka",
                "property.sasl.kerberos.keytab" = "/etc/krb5.keytab",
                "property.sasl.kerberos.keytab"="/opt/third/kafka/kerberos/kafka_client.keytab",
                "property.sasl.kerberos.principal" = "clients/stream.dt.local@EXAMPLE.COM"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test21;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**导入 PLAIN 认证的 Kafka 集群**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test22 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job22 ON routine_test22
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad22",
                "property.security.protocol"="SASL_PLAINTEXT",
                "property.sasl.mechanism"="PLAIN",
                "property.sasl.username"="admin",
                "property.sasl.password"="admin"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test22;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

### 一流多表导入

为 example_db 创建一个名为 test1 的 Kafka 例行动态多表导入任务。指定列分隔符和 group.id 和 client.id，并且自动默认消费所有分区，且从有数据的位置（OFFSET_BEGINNING）开始订阅。

这里假设需要将 Kafka 中的数据导入到 example_db 中的 tbl1 以及 tbl2 表中，我们创建了一个名为 test1 的例行导入任务，同时将名为 `my_topic` 的 Kafka 的 Topic 数据同时导入到 tbl1 和 tbl2 中的数据中，这样就可以通过一个例行导入任务将 Kafka 中的数据导入到两个表中。

```sql
CREATE ROUTINE LOAD example_db.test1
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

这个时候需要 Kafka 中的数据包含表名的信息。目前仅支持从 Kafka 的 Value 中获取动态表名，且需要符合这种格式：以 JSON 为例：`table_name|{"col1": "val1", "col2": "val2"}`, 其中 `tbl_name` 为表名，以 `|` 作为表名和表数据的分隔符。CSV 格式的数据也是类似的，如：`table_name|val1,val2,val3`。注意，这里的 `table_name` 必须和 Doris 中的表名一致，否则会导致导入失败。注意，动态表不支持后面介绍的 column_mapping 配置。

### 严格模式导入

为 example_db 的 example_tbl 创建一个名为 test1 的 Kafka 例行导入任务。导入任务为严格模式。

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
PRECEDING FILTER k1 = 1,
WHERE k1 < 100 and k2 like "%doris%"
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic"
);
```

## 更多帮助

参考 SQL 手册 [Routine Load](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)。也可以在客户端命令行下输入 `HELP ROUTINE LOAD` 获取更多帮助信息。