---
{
    "title": "Resource Group",
    "language": "en",
    "description": "Resource Group is a mechanism under the compute-storage integration architecture that achieves physical isolation between different workloads."
}
---

Resource Group is a mechanism under the compute-storage integration architecture that achieves physical isolation between different workloads. Its basic principle is illustrated in this diagram:

![Resource Group](/images/resource_group.png)

- By using tags, BEs are divided into different groups, each identified by the tag's name. For example, in the diagram above, host1, host2, and host3 are all set to group a, while host4 and host5 are set to group b.

- Different replicas of a table are placed in different groups. For instance, in the diagram above, table1 has 3 replicas, all located in group a, while table2 has 4 replicas, with 2 in group a and 2 in group b.

- During queries, different Resource Groups are used based on the user. For example, online users can only access data on host1, host2, and host3, so they can access both table1 and table2. However, offline users can only access host4 and host5, so they can only access data from table2. Since table1 does not have corresponding replicas in group b, accessing it would result in an error.

Essentially, a Resource Group is a placement strategy for table replicas, so it has the following advantages and limitations:

- Different Resource Groups use different BEs, so they are completely isolated from each other. Even if a BE within a group fails, it will not affect queries in other groups. Since data loading require multiple replicas to succeed, if the remaining number of replicas does not meet the quorum, the data loading will still fail.

- Each Resource Group must have at least one replica of each table. For example, if you want to establish 5 Resource Groups and each group may access all tables, then each table needs 5 replicas, which can result in significant storage costs.

## Typical Use Cases

- Read-write isolation: A cluster can be divided into two Resource Groups, with an Offline Resource Group for executing ETL jobs and an Online Resource Group for handling online queries. Data is stored with 3 replicas, with 2 replicas in the Online Resource Group and 1 replica in the Offline Resource Group. The Online Resource Group is primarily used for high-concurrency, low-latency online data services, while large queries or offline ETL operations can be executed using nodes in the Offline Resource Group. This allows for the provision of both online and offline services within a unified cluster.

- Isolation between different businesses: When data is not shared between multiple businesses, a Resource Group can be assigned to each business, ensuring no interference between them. This effectively consolidates multiple physical clusters into a single large cluster for management.

- Isolation between different users: For example, if there is a business table within a cluster that needs to be shared among all three users, but it is desirable to minimize resource contention between them, we can create 3 replicas of the table, stored in 3 different Resource Groups, and bind each user to a specific Resource Group.

## Configure Resource Group

### Setting Tags for BEs

Assuming the current Doris cluster has 6 BE nodes, named host[1-6]. Initially, all BE nodes belong to a default resource group (Default).

We can use the following commands to divide these 6 nodes into 3 resource groups: group_a, group_b, and group_c.

   ```sql
   alter system modify backend "host1:9050" set ("tag.location" = "group_a");
   alter system modify backend "host2:9050" set ("tag.location" = "group_a");
   alter system modify backend "host3:9050" set ("tag.location" = "group_b");
   alter system modify backend "host4:9050" set ("tag.location" = "group_b");
   alter system modify backend "host5:9050" set ("tag.location" = "group_c");
   alter system modify backend "host6:9050" set ("tag.location" = "group_c");
   ```
    
    Here, we will form Resource Group group_a with host[1-2], Resource Group group_b with host[3-4], and Resource Group group_c with host[5-6].

   > Note: A BE can only belong to one Resource Group.


### Redistribution data by Resource Group

After dividing the resource groups, you can distribute different replicas of user data across different resource groups. Assuming we have a user table named UserTable, and we want to store one replica in each of the three resource groups. This can be achieved through the following table creation statement:

   ```sql
   create table UserTable
   (k1 int, k2 int)
   distributed by hash(k1) buckets 1
   properties(
       "replication_allocation"="tag.location.group_a:1, tag.location.group_b:1, tag.location.group_c:1"
   )
   ```

In this way, the data in the UserTable will be stored in three replicas, each located on nodes within the resource groups group_a, group_b, and group_c, respectively.

The following diagram demonstrates the current division of nodes and data distribution:

   ```text
    ┌────────────────────────────────────────────────────┐
    │                                                    │
    │         ┌──────────────────┐  ┌──────────────────┐ │
    │         │ host1            │  │ host2            │ │
    │         │  ┌─────────────┐ │  │                  │ │
    │ group_a │  │   replica1  │ │  │                  │ │
    │         │  └─────────────┘ │  │                  │ │
    │         │                  │  │                  │ │
    │         └──────────────────┘  └──────────────────┘ │
    │                                                    │
    ├────────────────────────────────────────────────────┤
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │         ┌──────────────────┐  ┌──────────────────┐ │
    │         │ host3            │  │ host4            │ │
    │         │                  │  │  ┌─────────────┐ │ │
    │ group_b │                  │  │  │   replica2  │ │ │
    │         │                  │  │  └─────────────┘ │ │
    │         │                  │  │                  │ │
    │         └──────────────────┘  └──────────────────┘ │
    │                                                    │
    ├────────────────────────────────────────────────────┤
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │         ┌──────────────────┐  ┌──────────────────┐ │
    │         │ host5            │  │ host6            │ │
    │         │                  │  │  ┌─────────────┐ │ │
    │ group_c │                  │  │  │   replica3  │ │ │
    │         │                  │  │  └─────────────┘ │ │
    │         │                  │  │                  │ │
    │         └──────────────────┘  └──────────────────┘ │
    │                                                    │
    └────────────────────────────────────────────────────┘
   ```

   When a database contains a very large number of tables, modifying the distribution strategy for each table can be cumbersome. Therefore, Doris also supports setting a unified data distribution strategy at the database level, but the settings for individual tables have higher priority than those at the database level. For example, consider a database db1 with four tables: table1 requires a replica distribution strategy of group_a:1,group_b:2, while table2, table3, and table4 require a strategy of group_c:1,group_b:2.

    To create db1 with a default distribution strategy, you can use the following statement:

   ```sql
   CREATE DATABASE db1 PROPERTIES (
   "replication_allocation" = "tag.location.group_c:1, tag.location.group_b:2"
   )
   ```

    Create table1 with a specific distribution strategy:


   ```sql
   CREATE TABLE table1
   (k1 int, k2 int)
   distributed by hash(k1) buckets 1
   properties(
   "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
   )
   ```

   For table2, table3, and table4, you do not need to specify replication_allocation in their creation statements, as they will inherit the database-level default strategy.

   :::caution
   Changing the replica distribution strategy at the database level will not affect existing tables.
   :::


## Setting Resource Groups for Users

You can use the following statements to restrict users' access to specific resource groups. For example, user1 can only use nodes in the group_a resource group, user2 can only use group_b, and user3 can use all three resource groups:

   ```sql
   set property for 'user1' 'resource_tags.location' = 'group_a';
   set property for 'user2' 'resource_tags.location' = 'group_b';
   set property for 'user3' 'resource_tags.location' = 'group_a, group_b, group_c';
   ```

   After setting, when user1 queries the UserTable, it will only access data replicas on nodes in the group_a resource group and use computing resources from this group. User3's queries can use replicas and computing resources from any resource group.

   > Note: By default, the resource_tags.location property for users is empty. In versions before 2.0.2, users are not restricted by tags and can use any resource group. In versions 2.0.3 and later, ordinary users can only use the default resource group by default. Root and admin users can use any resource group.

   :::caution Caution:
    After modifying the resource_tags.location property, users need to re-establish connections for the changes to take effect.
   :::

   

## Resource Group Allocation for Data Loading Jobs

The resource usage for data loading jobs (including insert, broker load, routine load, stream load, etc.) can be divided into two parts:

- Computing Part: responsible for reading data sources, data transformation, and distribution.

- Writing Part: responsible for data encoding, compression, and writing to disk.

Since writing resources must be on nodes where data replicas are located, and computing resources can be allocated from any node, Resource Groups can only restrict the resources used for the computing part in data loading scenarios.