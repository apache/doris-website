---
{
  "title": "集群运维",
  "language": "zh-CN"
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

## 服务 Crash 情况下如何进入容器
在 K8s 环境中服务因为一些预期之外的事情会进入 `CrashLoopBackOff` 状态，通过 `kubectl get pod --namespace ${namespace}` 命令可以查看指定 namespace 下的 pod 状态和 pod_name。
在这种状态下，单纯通过 describe 和 logs 命令无法判定服务出问题的原因。当服务进入 `CrashLoopBackOff` 状态时，需要有一种机制允许部署服务的 pod 进入 `running` 状态方便用户通过 exec 进入容器内进行 debug。

Doris Operator 提供了 `Debug` 的运行模式，下面描述了当服务进入 `CrashLoopBackOff` 时如何进入 Debug 模式进行人工 Debug，以及解决后如何恢复到正常启动状态。

### 启动 Debug 模式

当服务一个 pod 进入 CrashLoopBackOff 或者正常运行过程中无法再正常启动时，通过以下步骤让服务进入 `Debug` 模式，进行手动启动服务查找问题。

1. **通过以下命令给运行有问题的 pod 进行添加 annnotation**
  ```shell
  $ kubectl annotate pod ${pod_name} --namespace ${namespace} selectdb.com.doris/runmode=debug
  ```
  当服务进行下一次重启时候，服务会检测到标识 `Debug` 模式启动的 annotation 就会进入 `Debug` 模式启动，pod 状态为 `running`。

2. **当服务进入 `Debug` 模式，此时服务的 pod 显示为正常状态，用户可以通过如下命令进入 pod 内部**

  ```shell
  $ kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```
  
3. **`Debug` 下手动启动服务，当用户进入 pod 内部，通过修改对应配置文件有关端口进行手动执行 `start_xx.sh` 脚本，脚本目录为 `/opt/apache-doris/xx/bin` 下。**

  FE 需要修改 `query_port`，BE 需要修改 `heartbeat_service_port`
  主要是避免`Debug`模式下还能通过 service 访问到 crash 的节点导致误导流。

### 退出 Debug 模式

当服务定位到问题后需要退出 `Debug` 运行，此时只需要按照如下命令删除对应的 pod，服务就会按照正常的模式启动。
```shell
$ kubectl delete pod ${pod_name} --namespace ${namespace}
```

:::tip Tip  
**进入 pod 内部后，需要修改配置文件的端口信息，才能手动启动 相应的 Doris 组件**
- FE 需要修改默认路径为：`/opt/apache-doris/fe/conf/fe.conf` 的 `query_port=9030` 配置。
- BE 需要修改默认路径为：`/opt/apache-doris/be/conf/be.conf` 的 `heartbeat_service_port=9050` 配置。  
:::

## 服务扩缩容
Doris 在 K8s 之上的扩缩容可通过修改 DorisCluster 资源对应组件的 replicas 字段来实现。修改可直接编辑对应的资源，也可通过命令的方式。

### 获取 DorisCluster 资源

使用命令 `kubectl --namespace {namespace} get doriscluster` 获取已部署 DorisCluster (简称 dcr ) 资源的名称。本文中，我们以 `doris` 为 namespace.

```shell
$ kubectl --namespace doris get doriscluster
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

### 扩缩容资源

K8s 所有运维操作通过修改资源为最终状态，由 Operator 服务自动完成运维。扩缩容操作可通过 `kubectl --namespace {namespace}  edit doriscluster {dcr_name}` 直接进入编辑模式修改对应 spec 的 replicas 值，保存退出后 Doris Operator 完成运维，也可以通过如下命令实现不同组件的扩缩容。

#### FE 扩容

1. **查看当前 FE 服务数量**

  ```shell
  $ kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS       AGE
  doriscluster-sample-fe-0   1/1     Running   0              10d
  ```

2. **扩容 FE**

  ```shell
  $ kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"feSpec":{"replicas":3}}}'
  ```

3. **检测扩容结果**
  ```shell
  $ kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-2   1/1     Running   0          9m37s
  doriscluster-sample-fe-1   1/1     Running   0          9m37s
  doriscluster-sample-fe-0   1/1     Running   0          8m49s
  ```

#### BE 扩容

1. **查看当前 BE 服务数量**

  ```shell
  $ kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  ```

2. **扩容 BE**

  ```shell
  $ kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"beSpec":{"replicas":3}}}'
  ```

3. **检测扩容结果**
  ```shell
  $ kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  doriscluster-sample-be-2   1/1     Running   0             12m
  doriscluster-sample-be-1   1/1     Running   0             12m
  ```

### 节点缩容

关于节点缩容问题，Doris-Operator 目前并不能很好的支持节点安全下线，在这里仍能够通过减少集群组件的 replicas 属性来实现减少 FE 或 BE 的目的，这里是直接 stop 节点来实现节点下线，当前版本的 Doris-Operator 并未能实现 [decommission](../../../../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-DECOMMISSION-BACKEND) 安全转移副本后下线。由此可能引发一些问题及其注意事项如下

- 表存在单副本情况下贸然下线 BE 节点，一定会有数据丢失，尽可能避免此操作。
- FE Follower 节点尽量避免随意下线，可能带来元数据损坏影响服务。
- FE Observer 类型节点可以随意下线，并无风险。
- CN 节点不持有数据副本，可以随意下线，但因此会损失存在于该 CN 节点的远端数据缓存，导致数据查询短时间内存在一定的性能回退。

## 升级 Doris 集群
Doris 集群整体升级需要先升级 BE，再升级 FE。Doris Operator 基于 Kubernetes 的 [滚动更新功能](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/) 实现每个组件的滚动平滑升级。

### 升级前注意事项

- 升级操作推荐在业务低峰期进行。
- 滚动升级过程中，会导致连接到被关闭节点的连接失效，造成请求失败，对于这类业务，推荐在客户端添加重试能力。
- 升级前可以阅读 [常规升级手册](../../../../admin-manual/cluster-management/upgrade.md)，便于理解升级中的一些原理和注意事项。
- 升级前无法对数据和元数据的兼容性进行验证，因此集群升级一定要避免数据存在 单副本 情况 和 集群单 FE FOLLOWER 节点。
- 升级过程中会有节点重启，所以可能会触发不必要的集群均衡和副本修复逻辑，先通过以下命令关闭
```
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```
- Doris 升级请遵守不要跨两个及以上关键节点版本升级的原则，若要跨多个关键节点版本升级，先升级到最近的关键节点版本，随后再依次往后升级，若是非关键节点版本，则可忽略跳过。具体参考 [升级版本说明](../../../../admin-manual/cluster-management/upgrade.md)

### 升级操作

升级过程节点类型顺序如下，如果某类型节点不存在则跳过：
```
  cn/be -> fe -> broker
```
建议依次修改对应集群组件的 `image` 然后 应用该配置，待当前类型的组件完全升级成功状态恢复正常后，再进行下一个类型节点的滚动升级。

#### 升级 BE

如果保留了集群的 crd（Doris Operator 定义了 `DorisCluster` 类型资源名称的简写）文件，则可以通过修改该配置文件并且 `kubectl apply` 的命令来进行升级。

1. 修改 `spec.beSpec.image`

  将 `selectdb/doris.be-ubuntu:2.0.4` 变为 `selectdb/doris.be-ubuntu:2.1.0`
  
  ```shell
  $ vim doriscluster-sample.yaml
  ```
  
2. 保存修改后应用本次修改进行 be 升级：
  ```shell
  $ kubectl apply -f doriscluster-sample.yaml -n doris
  ```

也可通过 `kubectl edit dcr` 的方式直接修改。

1. 查看 namespace 为 'doris' 下的 dcr 列表，获取需要更新的 `cluster_name`
  ```shell
  $ kubectl get dcr -n doris
  NAME                  FESTATUS    BESTATUS    CNSTATUS
  Doriscluster-sample   available   available
  ```

2. 修改、保存并生效
  ```shell
  $ kubectl edit dcr doriscluster-sample -n doris
  ```
  
  进入文本编辑器后，将找到 `spec.beSpec.image` ，将 `selectdb/doris.be-ubuntu:2.0.4` 修改为 `selectdb/doris.be-ubuntu:2.1.0`

3. 查看升级过程和结果：
  ```shell
  $ kubectl get pod -n doris
  ```
  
当所有 Pod 都重建完毕进入 Running 状态后，升级完成。

#### 升级 FE

如果保留了集群的 crd（Doris-Operator 定义了 `DorisCluster` 类型资源名称的简写）文件，则可以通过修改该配置文件并且 `kubectl apply` 的命令来进行升级。

1. 修改 `spec.feSpec.image`

  将 `selectdb/doris.fe-ubuntu:2.0.4` 变为 `selectdb/doris.fe-ubuntu:2.1.0`
  ```shell
  $ vim doriscluster-sample.yaml
  ```

2. 保存修改后应用本次修改进行 be 升级：
  ```shell
  $ kubectl apply -f doriscluster-sample.yaml -n doris
  ```

也可通过 `kubectl edit dcr` 的方式直接修改。

1. 修改、保存并生效
  ```shell
  $ kubectl edit dcr doriscluster-sample -n doris
  ```
  进入文本编辑器后，将找到`spec.feSpec.image`，将 `selectdb/doris.fe-ubuntu:2.0.4` 修改为 `selectdb/doris.fe-ubuntu:2.1.0`

2. 查看升级过程和结果
  ```shell
  $ kubectl get pod -n doris
  ```
  
当所有 Pod 都重建完毕进入 Running 状态后，升级完成。

### 升级完成处理
#### 验证集群节点状态
通过  [访问 Doris 集群](install-config-cluster.md#访问配置) 文档提供的方式，通过 `mysql-client` 访问 Doris。
使用 `show frontends` 和 `show backends` 等 SQL 查看各个组件的 版本 和 状态。
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
若 FE 节点 `alive` 状态为 true，且 `Version` 值为新版本，则该 FE 节点升级成功。

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
若 BE 节点 `alive` 状态为 true，且 `Version` 值为新版本，则该 BE 节点升级成功

#### 恢复集群副本同步和均衡
在确认各个节点状态无误后，执行以下 SQL 恢复集群均衡和副本修复：
```mysql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

