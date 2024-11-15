---
{
      "title": "Cluster Operation",
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

## How to enter the container when the pod crashes

In the k8s environment, the service will enter the `CrashLoopBackOff` state due to some unexpected things. You can view the pod status and pod_name under the specified namespace through the `kubectl get pod --namespace ${namespace}` command.

In this state, the cause of the service problem cannot be determined simply by using the describe and logs commands. When the service enters the `CrashLoopBackOff` state, there needs to be a mechanism that allows the pod deploying the service to enter the `running` state so that users can enter the container for debugging through exec.

doris-operator provides a `Debug` running mode. The following describes how to enter Debug mode for manual debugging when the service enters `CrashLoopBackOff`, and how to return to normal startup state after solving the problem.


### Start Debug mode

When a pod of the service enters CrashLoopBackOff or cannot be started normally during normal operation, take the following steps to put the service into `Debug` mode and manually start the service to find the problem.

1. **Use the following command to add annotation to the pod with problems.**
  ```shell
  $ kubectl annotate pod ${pod_name} --namespace ${namespace} selectdb.com.doris/runmode=debug
  ```
  When the service is restarted next time, the service will detect the annotation that identifies the `Debug` mode startup, and will enter the `Debug` mode to start, and the pod status will be `running`.

2. **When the service enters `Debug` mode, the pod of the service is displayed in a normal state. Users can enter the inside of the pod through the following command**

  ```shell
  $ kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```

3. **Manually start the service under `Debug`. When the user enters the pod, manually execute the `start_xx.sh` script by modifying the port of the corresponding configuration file. The script directory is under `/opt/apache-doris/xx/bin`.**

  FE needs to modify `query_port`, BE needs to modify `heartbeat_service_port`
  The main purpose is to avoid misleading the flow by accessing the crashed node through service in `Debug` mode.

### Exit Debug mode

When the service locates the problem, it needs to exit the `Debug` operation. At this time, you only need to delete the corresponding pod according to the following command, and the service will start in the normal mode.
```shell
$ kubectl delete pod ${pod_name} --namespace ${namespace}
```

:::tip Tip  
**After entering the pod, you need to modify the port information of the configuration file before you can manually start the corresponding Doris component.**  

- FE needs to modify the `query_port=9030` configuration with the default path: `/opt/apache-doris/fe/conf/fe.conf`.  
- BE needs to modify the `heartbeat_service_port=9050` configuration with the default path: `/opt/apache-doris/be/conf/be.conf`.  
:::

## Upgrading doris cluster

This document describes how to use updates to upgrade an Apache Doris cluster based on a Doris Operator deployment.

Similar to conventionally deployed cluster upgrades, Doris clusters deployed by Doris Operator still require rolling upgrades from BE to FE nodes. Doris Operator is based on Kubernetes'  [Performing a Rolling Update](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/) provides rolling upgrade capabilities.

### Things to note before upgrading

- It is recommended that the upgrade operation be performed during off-peak periods.
- During the rolling upgrade process, the connection to the closed node will fail, causing the request to fail. For this type of business, it is recommended to add retry capabilities to the client.
- Before upgrading, you can read the [General Upgrade Manual](https://doris.apache.org/docs/dev/admin-manual/cluster-management/upgrade) to help you understand some principles and precautions during the upgrade. .
- The compatibility of data and metadata cannot be verified before upgrading. Therefore, cluster upgrade must avoid single copy of data and single FE FOLLOWER node in the cluster.
- Nodes will be restarted during the upgrade process, so unnecessary cluster balancing and replica repair logic may be triggered. Please shut it down first with the following command.
```mysql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```
- When upgrading Doris, please follow the principle of not upgrading across two or more key node versions. If you want to upgrade across multiple key node versions, upgrade to the latest key node version first, and then upgrade in sequence. If it is a non-key node version, You can ignore skipping. For details, please refer to [Upgrade Version Instructions](https://doris.apache.org/docs/dev/admin-manual/cluster-management/upgrade/#doris-release-notes)

### Upgrade operation

The order of node types in the upgrade process is as follows. If a certain type of node does not exist, it will be skipped:
```shell
   cn/be -> fe -> broker
```
It is recommended to modify the `image` of the corresponding cluster components in sequence and then apply the configuration. After the current type of component is fully upgraded and the status returns to normal, the rolling upgrade of the next type of node can be performed.

#### Upgrade BE

If you retain the cluster's crd (Doris Operator defines the abbreviation of `DorisCluster` type resource name) file, you can upgrade by modifying the configuration file and running the `kubectl apply` command.

1. Modify `spec.beSpec.image`

  Change `selectdb/doris.be-ubuntu:2.0.4` to `selectdb/doris.be-ubuntu:2.1.0`
  ```shell
  $ vim doriscluster-sample.yaml
  ```

2. Save the changes and apply the changes to be upgraded:
  ```shell
  $ kubectl apply -f doriscluster-sample.yaml -n doris
  ```

It can also be modified directly through `kubectl edit dcr`.

1. Check the dcr list under namespace 'doris' to obtain the `cluster_name` that needs to be updated.
  ```shell
  $ kubectl get dcr -n doris
  NAME                  FESTATUS    BESTATUS    CNSTATUS
  doriscluster-sample   available   available
  ```

2. Modify, save and take effect
  ```shell
  $ kubectl edit dcr doriscluster-sample -n doris
  ```
  After entering the text editor, you will find `spec.beSpec.image` and change `selectdb/doris.be-ubuntu:2.0.4` to `selectdb/doris.be-ubuntu:2.1.0`
  
3. View the upgrade process and results:
  ```shell
  $ kubectl get pod -n doris
  ```

When all Pods are rebuilt and enter the Running state, the upgrade is complete.

#### Upgrade FE

If you retain the cluster's crd (Doris Operator defines the abbreviation of the `DorisCluster` type resource name) file, you can upgrade by modifying the configuration file and running the `kubectl apply` command.

1. Modify `spec.feSpec.image`

  Change `selectdb/doris.fe-ubuntu:2.0.4` to `selectdb/doris.fe-ubuntu:2.1.0`
  ```shell
  $ vim doriscluster-sample.yaml
  ```

2. Save the changes and apply the changes to be upgraded:
  ```shell
  $ kubectl apply -f doriscluster-sample.yaml -n doris
  ```

It can also be modified directly through `kubectl edit dcr`.

1. Modify, save and take effect
  ```shell
  $ kubectl edit dcr doriscluster-sample -n doris
  ```
  After entering the text editor, you will find `spec.feSpec.image` and change `selectdb/doris.fe-ubuntu:2.0.4` to `selectdb/doris.fe-ubuntu:2.1.0`

2. View the upgrade process and results:
  ```shell
  $ kubectl get pod -n doris
  ```

When all Pods are rebuilt and enter the Running state, the upgrade is complete.

### After the upgrade is completed
#### Verify cluster node status
Access Doris through `mysql-client` through the method provided in the [Access Doris Cluster](../k8s-deploy/install-access-cluster) document.
Use SQL such as `show frontends` and `show backends` to view the version and status of each component.
```mysql
mysql> show frontends\G;
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
If the `Alive` status of the FE node is true and the `Version` value is the new version, the FE node is upgraded successfully.

```mysql
mysql> show backends\G;
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

If the `Alive` status of the BE node is true and the `Version` value is the new version, the BE node is upgraded successfully.

#### Restore cluster replica synchronization and balancing
After confirming that the status of each node is correct, execute the following SQL to restore cluster balancing and replica repair:
```
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```
