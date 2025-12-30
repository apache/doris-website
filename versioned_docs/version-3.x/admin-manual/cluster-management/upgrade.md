---
{
    "title": "Upgrading Cluster",
    "language": "en",
    "description": "Doris provides the capability for rolling upgrades, enabling step-by-step upgrades of FE and BE nodes, minimizing downtime,"
}
---

Doris provides the capability for rolling upgrades, enabling step-by-step upgrades of FE and BE nodes, minimizing downtime, and ensuring the system remains operational during the upgrade process.

## Version Compatibility

Doris versioning consists of three components: the first digit represents a major milestone version, the second digit indicates a feature version, and the third digit corresponds to a bug fix. New features are not introduced in bug fix versions. For example, in Doris version 2.1.3, "2" indicates the second milestone version, "1" represents the feature version under this milestone, and "3" denotes the third bug fix for this feature version.

During version upgrades, the following rules apply:

- **Three-digit versions:** Versions with the same first two digits can be directly upgraded across three-digit versions. For example, version 2.1.3 can be directly upgraded to version 2.1.7.

- **Two-digit and one-digit versions:** Cross-version upgrades for two-digit versions are not recommended due to compatibility concerns. It is advised to upgrade sequentially through each two-digit version. For example, upgrading from version 3.0 to 3.3 should follow the sequence 3.0 -> 3.1 -> 3.2 -> 3.3.

The detailed version information can be found in the [versioning rules](https://doris.apache.org/community/release-versioning).

## Upgrade Precautions

When performing an upgrade, pay attention to the following:

- **Behavioral changes between versions:** Review the Release Notes before upgrading to identify compatibility issues.

- **Add retry mechanisms for tasks in the cluster:** Nodes are restarted sequentially during upgrades. Ensure that retry mechanisms are in place for query tasks and Stream Load import jobs to avoid task failures. Routine Load jobs using flink-doris-connector or spark-doris-connector already include retry mechanisms in their code and do not require additional logic.

- **Disable replica repair and balance functions:** Disable these functions during the upgrade process. Regardless of the upgrade outcome, re-enable these functions after the upgrade is complete.

## Metadata Compatibility Testing

:::caution Note

In a production environment, it is recommended to configure at least three FE nodes for high availability. If there is only one FE node, metadata compatibility testing must be performed before upgrading. Metadata compatibility is critical as incompatibility may cause upgrade failures and data loss. It is recommended to conduct metadata compatibility tests before each upgrade, keeping in mind the following:

- Perform metadata compatibility testing on a development machine or BE node whenever possible to avoid using FE nodes.

- If testing must be conducted on an FE node, use a non-Master node and stop the original FE process.

:::

Before upgrading, conduct metadata compatibility testing to prevent failures caused by metadata incompatibility.

1. **Backup metadata information:**

   Before starting the upgrade, back up the metadata of the Master FE node.

   Use the `show frontends` command and refer to the `IsMaster` column to identify the Master FE node. FE metadata can be hot-backed up without stopping the FE node. By default, FE metadata is stored in the `fe/doris-meta` directory. This can be confirmed via the `meta_dir` parameter in the `fe.conf` configuration file.

2. **Modify the `fe.conf` configuration file of the test FE node:**

   ```bash
   vi ${DORIS_NEW_HOME}/conf/fe.conf
   ```

   Modify the following port information, ensuring all ports are different from those in the production environment, and update the `clusterID` parameter:  
   ```
   ...
   ## modify port
   http_port = 18030
   rpc_port = 19020
   query_port = 19030
   arrow_flight_sql_port = 19040
   edit_log_port = 19010

   ## modify clusterIP
   clusterId=<a_new_clusterIP, such as 123456>
   ...
   ```

3. Copy the backed-up Master FE metadata to the new compatibility testing environment.  

   ```bash
   cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
   ```

4. Edit the `VERSION` file in the copied metadata directory to update the `cluster_id` to a new cluster IP, for example, change it to `123456` as shown in the example:  

   ```bash
   vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
   clusterId=123456
   ```

5. Start the FE process in the testing environment.  
 
   ```bash
   sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
   ```

   For versions earlier than 2.0.2, add the `metadata_failure_recovery` parameter to the `fe.conf` file before starting the FE process:  
   ```bash
   echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
   sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon 
   ```

6. Verify that the FE process has started successfully by connecting to the current FE using the MySQL command. For example, use the query port `19030` as mentioned above:  
 
   ```bash
   mysql -uroot -P19030 -h127.0.0.1
   ```

## Upgrade Steps

The detailed process for the upgrade is as follows:

1. Disable replica repair and balance functions

2. Upgrade BE nodes

3. Upgrade FE nodes

4. Enable replica repair and balance functions

During the upgrade process, the principle of upgrading BE nodes first, followed by upgrading FE nodes, should be followed. When upgrading FE, upgrade the Observer FE and Follower FE nodes first, and then upgrade the Master FE node.

:::caution Note

In general, only the `/bin` and `/lib` directories under the FE directory and the `/bin` and `/lib` directories under the BE directory need to be upgraded.

For versions 2.0.2 and later, a `custom_lib/` directory has been added under the FE and BE deployment paths (if it doesn't exist, it can be manually created). The `custom_lib/` directory is used to store some user-defined third-party jar files, such as `hadoop-lzo-*.jar`, `orai18n.jar`, etc. This directory does not need to be replaced during the upgrade.

:::

### Step 1: Disable Replica Repair and Balance Functions

During the upgrade process, nodes will be restarted, which may trigger unnecessary cluster balancing and replica repair logic. Disable these functions first using the following command:

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```


### Step 2: Upgrade BE Nodes

:::info Note:

To ensure the safety of your data, please use 3 replicas to store your data to avoid data loss caused by upgrade mistakes or failures.
:::
1. In a multi-replica cluster, you can choose to stop the process on one BE node and perform a gradual upgrade:

   ```bash
   sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
   ```

2. Rename the `/bin` and `/lib` directories in the BE directory:

   ```bash
   mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
   mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
   ```

3. Copy the new version's `/bin` and `/lib` directories to the original BE directory:

   ```bash
   cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
   cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
   ```

4. Start the BE node:

   ```bash
   sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
   ```

5. Connect to the cluster and check the node information:

   ```sql
   show backends\G
   ```

   If the BE node's `alive` status is `true` and the `Version` value is the new version, the node has been successfully upgraded.

### Step 3: Upgrade FE Nodes

1. In a multi-FE node setup, select a non-Master node for the upgrade and stop it first:

   ```bash
   sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
   ```

2. Rename the `/bin`, `/lib`, and `/mysql_ssl_default_certificate` directories in the FE directory:

   ```bash
   mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
   mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
   mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
   ```

3. Copy the new version's `/bin`, `/lib`, and `/mysql_ssl_default_certificate` directories to the original FE directory:

   ```bash
   cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
   cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
   cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
   ```

4. Start the FE node:

   ```sql
   sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
   ```

5. Connect to the cluster and check the node information:

   ```sql
   show frontends\G
   ```

   If the FE node's `alive` status is `true` and the `Version` value is the new version, the node has been successfully upgraded.

6. Complete the upgrade of the other FE nodes in sequence, and finally upgrade the Master node.

### Step 4: Enable Replica Repair and Balance Functions

After the upgrade is complete and all BE nodes' status is `Alive`, enable the cluster's replica repair and balance functions:

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

