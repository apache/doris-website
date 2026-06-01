---
{
    "title": "Cluster Operations",
    "language": "en",
    "description": "Doris cluster operations guide: service scaling, rolling upgrades, CrashLoopBackOff handling, Debug mode startup, metadata recovery, and other cluster management operations in Kubernetes environments.",
    "keywords": ["Doris cluster operations", "scaling", "rolling upgrade", "CrashLoopBackOff", "Debug mode", "metadata recovery", "K8s", "Kubernetes"]
}
---

## How to Enter the Container When the Service Crashes

In a K8s environment, services may enter the `CrashLoopBackOff` state due to unexpected events. You can use the `kubectl get pod --namespace ${namespace}` command to view the pod status and pod_name under the specified namespace.

In this state, the describe and logs commands alone cannot determine the cause of the service failure. When the service enters the `CrashLoopBackOff` state, a mechanism is needed to allow the deployed pod to enter the `running` state so that you can use exec to enter the container for debugging.

Doris Operator provides a `Debug` running mode. The following describes how to enter Debug mode for manual debugging when a service enters `CrashLoopBackOff`, and how to restore normal startup after the issue is resolved.

### Start Debug Mode

When a service pod enters CrashLoopBackOff or fails to start normally during normal operation, follow these steps to put the service into `Debug` mode for manual startup and troubleshooting.

1. **Add an annotation to the problematic pod using the following command**

  ```shell
  kubectl annotate pod ${pod_name} --namespace ${namespace} apache.org.doris/runmode=debug
  ```

  When the service restarts next time, it detects the annotation that identifies `Debug` mode startup and enters `Debug` mode startup, with the pod status as `running`.

2. **When the service enters `Debug` mode, the service pod displays as normal status. You can enter the pod using the following command**

  ```shell
  kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```
  
3. **Manually start the service in `Debug` mode. After entering the pod, modify the relevant ports in the configuration file and manually execute the `start_xx.sh` script. The script directory is `/opt/apache-doris/xx/bin`.**

  FE needs to modify `query_port`, and BE needs to modify `heartbeat_service_port`, to avoid the crashed node still being accessible through the service in `Debug` mode and causing traffic misdirection.

### Exit Debug Mode

After locating the issue, exit `Debug` mode by deleting the corresponding pod with the following command. The service then starts in normal mode.

```shell
kubectl delete pod ${pod_name} --namespace ${namespace}
```

:::tip Tip
**After entering the pod, you must modify the port information in the configuration file before manually starting the corresponding Doris components.**
- For FE, modify the `query_port=9030` configuration. The default path is `/opt/apache-doris/fe/conf/fe.conf`.
- For BE, modify the `heartbeat_service_port=9050` configuration. The default path is `/opt/apache-doris/be/conf/be.conf`.
:::

## Service Scaling

Scaling Doris on K8s is achieved by modifying the replicas field of the corresponding component in the DorisCluster resource. You can either edit the resource directly or use commands.

### Get DorisCluster Resources

Use the command `kubectl --namespace {namespace} get doriscluster` to get the name of deployed DorisCluster (dcr for short) resources. In this document, we use `doris` as the namespace.

```shell
kubectl --namespace doris get doriscluster
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

### Scale Resources

All K8s operations are performed by modifying resources to a final state, with the Operator service automatically handling the operation. Scaling can be done by entering edit mode directly with `kubectl --namespace {namespace}  edit doriscluster {dcr_name}` to modify the replicas value of the corresponding spec. After saving and exiting, Doris Operator completes the operation. You can also scale different components using the following commands.

#### Scale FE

1. **View the current number of FE services**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS       AGE
  doriscluster-sample-fe-0   1/1     Running   0              10d
  ```

2. **Scale FE**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"feSpec":{"replicas":3}}}'
  ```

3. **Verify the scaling result**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-2   1/1     Running   0          9m37s
  doriscluster-sample-fe-1   1/1     Running   0          9m37s
  doriscluster-sample-fe-0   1/1     Running   0          8m49s
  ```

#### Scale BE

1. **View the current number of BE services**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  ```

2. **Scale BE**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"beSpec":{"replicas":3}}}'
  ```

3. **Verify the scaling result**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  doriscluster-sample-be-2   1/1     Running   0             12m
  doriscluster-sample-be-1   1/1     Running   0             12m
  ```

### Node Scale-In

For node scale-in, Doris-Operator currently does not provide good support for safe node decommissioning. You can still reduce the replicas attribute of cluster components to reduce the number of FE or BE nodes. This directly stops the node to take it offline. The current version of Doris-Operator does not implement [decommission](../../../sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND) for safe replica migration before going offline. This may cause some issues. Note the following:

- Taking a BE node offline rashly when a table has only a single replica will definitely result in data loss. Avoid this operation as much as possible.

- Avoid arbitrarily taking FE Follower nodes offline, as it may cause metadata corruption and affect the service.

- FE Observer type nodes can be taken offline arbitrarily without risk.

- CN nodes do not hold data replicas and can be taken offline arbitrarily. However, this will lose the remote data cache on that CN node, causing some performance regression for data queries in the short term.

## Upgrade Doris Cluster

Upgrading the Doris cluster as a whole requires upgrading BE first, then FE. Doris Operator implements rolling smooth upgrades for each component based on Kubernetes' [rolling update feature](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/).

### Notes Before Upgrade

- It is recommended to perform upgrade operations during off-peak business hours.

- During the rolling upgrade process, connections to closed nodes will become invalid, causing request failures. For such businesses, it is recommended to add retry capability on the client side.

- Before upgrading, you can read the [General Upgrade Manual](../../../admin-manual/cluster-management/upgrade.md) to understand some principles and considerations during the upgrade.

- Before the upgrade, the compatibility of data and metadata cannot be verified. Therefore, the cluster upgrade must avoid scenarios with single-replica data and a single FE FOLLOWER node in the cluster.

- During the upgrade, nodes will be restarted, which may trigger unnecessary cluster balancing and replica repair logic. Disable them first using the following commands:

```
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

- When upgrading Doris, follow the principle of not skipping two or more key node versions. To upgrade across multiple key node versions, first upgrade to the nearest key node version, then upgrade in sequence. Non-key node versions can be skipped. For details, refer to [Upgrade Version Notes](../../../admin-manual/cluster-management/upgrade.md).

### Upgrade Operations

The order of node types during the upgrade process is as follows. Skip a type if no node of that type exists:

```
  cn/be -> fe -> broker
```

It is recommended to modify the `image` of the corresponding cluster component in sequence, then apply the configuration. Wait until the components of the current type are fully upgraded and the status is restored to normal before performing the rolling upgrade of the next type of nodes.

#### Upgrade BE

If the cluster's CRD (Doris Operator defines `DorisCluster` as the abbreviation of the resource type name) file is preserved, you can upgrade by modifying the configuration file and running `kubectl apply`.

1. Modify `spec.beSpec.image`

   Change `apache/doris:be-2.1.8` to `apache/doris:be-2.1.9`.
  
2. Save the changes and apply this modification to upgrade FE:

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

You can also modify it directly using `kubectl edit dcr`.

1. View the dcr list under namespace 'doris' and get the `cluster_name` to be updated:

   ```shell
   $ kubectl get dcr -n doris
   NAME                  FESTATUS    BESTATUS    CNSTATUS
   Doriscluster-sample   available   available
   ```

2. Modify, save, and apply:

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```
  
   After entering the text editor, find `spec.beSpec.image` and change `apache/doris:be-2.1.8` to `apache/doris:be-2.1.9`.

3. View the upgrade process and result:

   ```shell
   kubectl get pod -n doris
   ```
  
The upgrade is complete when all Pods are recreated and enter the Running state.

#### Upgrade FE

If the cluster's crd (Doris-Operator defines `DorisCluster` as the abbreviation of the resource type name) file is preserved, you can upgrade by modifying the configuration file and running `kubectl apply`.

1. Modify `spec.feSpec.image`

   Change `apache/doris:fe-2.1.8` to `apache/doris:fe-2.1.9`.

   ```shell
   vim doriscluster-sample.yaml
   ```

2. Save the changes and apply this modification to upgrade FE:

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

You can also modify it directly using `kubectl edit dcr`.

1. Modify, save, and apply:

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```

   After entering the text editor, find `spec.feSpec.image` and change `apache/doris:fe-2.1.8` to `apache/doris:fe-2.1.9`.

2. View the upgrade process and result:
   ```shell
   kubectl get pod -n doris
   ```
  
The upgrade is complete when all Pods are recreated and enter the Running state.

### Post-Upgrade Handling

#### Verify Cluster Node Status

Use the method provided in the [Access Doris Cluster](install-config-cluster.md#access-configuration) document to access Doris through `mysql-client`.

Use SQL such as `show frontends` and `show backends` to view the version and status of each component.

```sql
show frontends\G;
*************************** 1. row ***************************
              Name: fe_13c132aa_3281_4f4f_97e8_655d01287425
              Host: doriscluster-sample-fe-0.doriscluster-sample-fe-internal.doris.svc.cluster.local
       EditLogPort: 9010
          HttpPort: 8030
         QueryPort: 9030
           RpcPort: 9020
ArrowFlightSqlPort: -1
              Role: FOLLOWER
          IsMaster: false
         ClusterId: 1779160761
              Join: true
             Alive: true
 ReplayedJournalId: 2422
     LastStartTime: 2024-02-19 06:38:47
     LastHeartbeat: 2024-02-19 09:31:33
          IsHelper: true
            ErrMsg:
           Version: doris-2.1.0
  CurrentConnected: Yes
*************************** 2. row ***************************
              Name: fe_f1a9d008_d110_4780_8e60_13d392faa54e
              Host: doriscluster-sample-fe-2.doriscluster-sample-fe-internal.doris.svc.cluster.local
       EditLogPort: 9010
          HttpPort: 8030
         QueryPort: 9030
           RpcPort: 9020
ArrowFlightSqlPort: -1
              Role: FOLLOWER
          IsMaster: true
         ClusterId: 1779160761
              Join: true
             Alive: true
 ReplayedJournalId: 2423
     LastStartTime: 2024-02-19 06:37:35
     LastHeartbeat: 2024-02-19 09:31:33
          IsHelper: true
            ErrMsg:
           Version: doris-2.1.0
  CurrentConnected: No
*************************** 3. row ***************************
              Name: fe_e42bf9da_006f_4302_b861_770d2c955a47
              Host: doriscluster-sample-fe-1.doriscluster-sample-fe-internal.doris.svc.cluster.local
       EditLogPort: 9010
          HttpPort: 8030
         QueryPort: 9030
           RpcPort: 9020
ArrowFlightSqlPort: -1
              Role: FOLLOWER
          IsMaster: false
         ClusterId: 1779160761
              Join: true
             Alive: true
 ReplayedJournalId: 2422
     LastStartTime: 2024-02-19 06:38:17
     LastHeartbeat: 2024-02-19 09:31:33
          IsHelper: true
            ErrMsg:
           Version: doris-2.1.0
  CurrentConnected: No
3 rows in set (0.02 sec)
```

If the FE node's `alive` status is true and the `Version` value is the new version, the FE node has been upgraded successfully.

```sql
show backends\G;
*************************** 1. row ***************************
              BackendId: 10002
                   Host: doriscluster-sample-be-0.doriscluster-sample-be-internal.doris.svc.cluster.local
          HeartbeatPort: 9050
                 BePort: 9060
               HttpPort: 8040
               BrpcPort: 8060
     ArrowFlightSqlPort: -1
          LastStartTime: 2024-02-19 06:37:56
          LastHeartbeat: 2024-02-19 09:32:43
                  Alive: true
   SystemDecommissioned: false
              TabletNum: 14
       DataUsedCapacity: 0.000
     TrashUsedCapcacity: 0.000
          AvailCapacity: 12.719 GB
          TotalCapacity: 295.167 GB
                UsedPct: 95.69 %
         MaxDiskUsedPct: 95.69 %
     RemoteUsedCapacity: 0.000
                    Tag: {"location" : "default"}
                 ErrMsg:
                Version: doris-2.1.0
                 Status: {"lastSuccessReportTabletsTime":"2024-02-19 09:31:48","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false}
HeartbeatFailureCounter: 0
               NodeRole: mix
*************************** 2. row ***************************
              BackendId: 10003
                   Host: doriscluster-sample-be-1.doriscluster-sample-be-internal.doris.svc.cluster.local
          HeartbeatPort: 9050
                 BePort: 9060
               HttpPort: 8040
               BrpcPort: 8060
     ArrowFlightSqlPort: -1
          LastStartTime: 2024-02-19 06:37:35
          LastHeartbeat: 2024-02-19 09:32:43
                  Alive: true
   SystemDecommissioned: false
              TabletNum: 8
       DataUsedCapacity: 0.000
     TrashUsedCapcacity: 0.000
          AvailCapacity: 12.719 GB
          TotalCapacity: 295.167 GB
                UsedPct: 95.69 %
         MaxDiskUsedPct: 95.69 %
     RemoteUsedCapacity: 0.000
                    Tag: {"location" : "default"}
                 ErrMsg:
                Version: doris-2.1.0
                 Status: {"lastSuccessReportTabletsTime":"2024-02-19 09:31:43","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false}
HeartbeatFailureCounter: 0
               NodeRole: mix
*************************** 3. row ***************************
              BackendId: 11024
                   Host: doriscluster-sample-be-2.doriscluster-sample-be-internal.doris.svc.cluster.local
          HeartbeatPort: 9050
                 BePort: 9060
               HttpPort: 8040
               BrpcPort: 8060
     ArrowFlightSqlPort: -1
          LastStartTime: 2024-02-19 08:50:36
          LastHeartbeat: 2024-02-19 09:32:43
                  Alive: true
   SystemDecommissioned: false
              TabletNum: 0
       DataUsedCapacity: 0.000
     TrashUsedCapcacity: 0.000
          AvailCapacity: 12.719 GB
          TotalCapacity: 295.167 GB
                UsedPct: 95.69 %
         MaxDiskUsedPct: 95.69 %
     RemoteUsedCapacity: 0.000
                    Tag: {"location" : "default"}
                 ErrMsg:
                Version: doris-2.1.0
                 Status: {"lastSuccessReportTabletsTime":"2024-02-19 09:32:04","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false}
HeartbeatFailureCounter: 0
               NodeRole: mix
3 rows in set (0.01 sec)
```

If the BE node's `alive` status is true and the `Version` value is the new version, the BE node has been upgraded successfully.

#### Restore Cluster Replica Synchronization and Balancing

After confirming that each node is in the correct state, execute the following SQL to restore cluster balancing and replica repair:

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## Start FE in metadata_failure_recovery Mode

When FE cannot elect a master and the service is unavailable, you can select a node with the largest `VLSN` value and force-start it as the master node using the `metadata_failure_recovery` mechanism to recover the cluster.

### Start in Recovery Mode in a Container Environment

1. Find the node with the largest `VLSN` value.
   In K8s, each time the FE Pod starts, it outputs the most recent 10 `VLSN` records on this node, as shown below:
    ```
    the annotations value:
    the value not equal!  debug
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:19:2025-08-05 03:42:47.650 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica-feeder fe_d8763579_92da_4d72_8c58_4e62b88bdff0 start stream at VLSN: 30
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:21:2025-08-05 03:42:47.659 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica initialization completed. Replica VLSN: -1  Heartbeat master commit VLSN: 49  DTVLSN:0 Replica VLSN delta: 50
    [Tue Aug  5 06:14:05 UTC 2025] start with meta run start_fe.sh with additional options: '--console'
    ```
   The above shows the `VLSN` records output when an instance cluster's FE starts. The current node's largest `VLSN` is 30 (the log output prefix is `start stream at VLSN:`).
2. Select the pod of the node with the largest value as the node using the recovery mechanism.
   After finding the pod of the node with the largest `VLSN` value, add the annotation that requires the recovery mechanism to start to the pod using the following command.
    ```
    kubectl annotate pod {podName} "selectdb.com.doris/recovery=true"
    ```
   When the Pod restarts again, the current node automatically adds ` --metadata_failure_recovery` to the startup command, and the service starts in recovery mode.
3. After the service is normal, you must remove the annotation added in step 2. Otherwise, unexpected behavior may occur after subsequent node restarts.

:::tip Tip
1. After adding the annotation, do not restart by deleting the pod, as this will cause the annotation to be lost. Wait for kubelet to automatically restart and pull up the pod, or enter the container and manually kill the process.
2. When starting in `metadata_failure_recovery` mode, FE log replay takes a long time. Before using this mode to start, modify the [startup probe timeout](install-config-cluster.md#startup-probe-timeout-configuration) of the FE service first, then delete all FE Pods to start `metadata_failure_recovery`.
:::
