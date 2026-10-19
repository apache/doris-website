---
{
    "title": "클러스터 운영",
    "language": "ko",
    "description": "Kubernetes 환경에서 서비스 확장 및 축소, 롤링 업그레이드, CrashLoopBackOff 처리, Debug 모드 시작, 메타데이터 복구 등 Doris 클러스터 관리 작업을 다루는 운영 가이드입니다.",
    "keywords": ["Doris 클러스터 운영", "확장 및 축소", "롤링 업그레이드", "CrashLoopBackOff", "Debug 모드", "메타데이터 복구", "K8s", "Kubernetes"]
}
---

## 서비스가 비정상 종료될 때 컨테이너에 접속하는 방법 {#how-to-enter-the-container-when-the-service-crashes}

K8s 환경에서는 예기치 않은 상황으로 인해 서비스가 `CrashLoopBackOff` 상태에 진입할 수 있습니다. `kubectl get pod --namespace ${namespace}` 명령으로 지정된 네임스페이스의 Pod 상태와 pod_name을 확인할 수 있습니다.

이 상태에서는 describe와 logs 명령만으로 서비스 장애의 원인을 파악할 수 없습니다. 서비스가 `CrashLoopBackOff` 상태에 진입하면, 배포된 Pod를 `running` 상태로 전환하여 exec로 컨테이너에 접속하고 디버깅할 수 있게 하는 메커니즘이 필요합니다.

Doris Operator는 `Debug` 실행 모드를 제공합니다. 다음은 서비스가 `CrashLoopBackOff` 상태에 진입했을 때 수동 디버깅을 위해 Debug 모드로 전환하는 방법과 문제 해결 후 정상적인 시작 방식으로 복원하는 방법을 설명합니다.

### Debug 모드 시작 {#start-debug-mode}

정상 운영 중 서비스 Pod가 CrashLoopBackOff 상태에 진입하거나 정상적으로 시작되지 않으면, 다음 단계에 따라 서비스를 `Debug` 모드로 전환하여 수동으로 시작하고 문제를 해결하세요.

1. **다음 명령으로 문제가 있는 Pod에 어노테이션을 추가합니다**

  ```shell
  kubectl annotate pod ${pod_name} --namespace ${namespace} apache.org.doris/runmode=debug
  ```

  서비스가 다음에 재시작될 때 `Debug` 모드 시작을 지정하는 어노테이션을 감지하고 `Debug` 모드로 시작하며, Pod 상태는 `running`이 됩니다.

2. **서비스가 `Debug` 모드에 진입하면 서비스 Pod가 정상 상태로 표시됩니다. 다음 명령으로 Pod에 접속할 수 있습니다**

  ```shell
  kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```

3. **`Debug` 모드에서 서비스를 수동으로 시작합니다. Pod에 접속한 후 구성 파일에서 관련 포트를 수정하고 `start_xx.sh` 스크립트를 수동으로 실행합니다. 스크립트 디렉터리는 `/opt/apache-doris/xx/bin`입니다.**

  FE는 `query_port`를, BE는 `heartbeat_service_port`를 수정해야 합니다. 이렇게 해야 비정상 종료된 노드가 `Debug` 모드에서 여전히 서비스를 통해 접근 가능하여 트래픽이 잘못 전달되는 상황을 방지할 수 있습니다.

### Debug 모드 종료 {#exit-debug-mode}

문제의 원인을 파악한 후 다음 명령으로 해당 Pod를 삭제하여 `Debug` 모드를 종료합니다. 그러면 서비스가 일반 모드로 시작됩니다.

```shell
kubectl delete pod ${pod_name} --namespace ${namespace}
```

:::tip 팁
**Pod에 접속한 후 해당 Doris 컴포넌트를 수동으로 시작하기 전에 반드시 구성 파일의 포트 정보를 수정해야 합니다.**
- FE의 경우 `query_port=9030` 구성을 수정합니다. 기본 경로는 `/opt/apache-doris/fe/conf/fe.conf`입니다.
- BE의 경우 `heartbeat_service_port=9050` 구성을 수정합니다. 기본 경로는 `/opt/apache-doris/be/conf/be.conf`입니다.
:::

## 서비스 확장 및 축소 {#service-scaling}

K8s에서 Doris를 확장하거나 축소하려면 DorisCluster 리소스에서 해당 컴포넌트의 replicas 필드를 수정합니다. 리소스를 직접 편집하거나 명령을 사용할 수 있습니다.

### DorisCluster 리소스 조회 {#get-doriscluster-resources}

`kubectl --namespace {namespace} get doriscluster` 명령으로 배포된 DorisCluster(약칭 dcr) 리소스의 이름을 조회합니다. 이 문서에서는 `doris`를 네임스페이스로 사용합니다.

```shell
kubectl --namespace doris get doriscluster
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

### 리소스 확장 및 축소 {#scale-resources}

모든 K8s 작업은 리소스를 원하는 최종 상태로 수정하는 방식으로 수행되며, Operator 서비스가 실제 작업을 자동으로 처리합니다. `kubectl --namespace {namespace}  edit doriscluster {dcr_name}`로 편집 모드에 직접 진입하여 해당 spec의 replicas 값을 수정하면 확장하거나 축소할 수 있습니다. 저장하고 종료하면 Doris Operator가 작업을 완료합니다. 다음 명령으로 각 컴포넌트를 확장하거나 축소할 수도 있습니다.

#### FE 확장 {#scale-fe}

1. **현재 FE 서비스 수를 확인합니다**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS       AGE
  doriscluster-sample-fe-0   1/1     Running   0              10d
  ```

2. **FE를 확장합니다**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"feSpec":{"replicas":3}}}'
  ```

3. **확장 결과를 확인합니다**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-2   1/1     Running   0          9m37s
  doriscluster-sample-fe-1   1/1     Running   0          9m37s
  doriscluster-sample-fe-0   1/1     Running   0          8m49s
  ```

#### BE 확장 {#scale-be}

1. **현재 BE 서비스 수를 확인합니다**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  ```

2. **BE를 확장합니다**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"beSpec":{"replicas":3}}}'
  ```

3. **확장 결과를 확인합니다**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  doriscluster-sample-be-2   1/1     Running   0             12m
  doriscluster-sample-be-1   1/1     Running   0             12m
  ```

### 노드 축소 {#node-scale-in}

현재 Doris-Operator는 노드 축소 시 안전한 노드 해제를 충분히 지원하지 않습니다. 클러스터 컴포넌트의 replicas 속성을 줄여 FE 또는 BE 노드 수를 줄일 수는 있습니다. 이 경우 노드를 직접 중지하여 오프라인으로 전환합니다. 현재 버전의 Doris-Operator는 노드를 오프라인으로 전환하기 전에 복제본을 안전하게 마이그레이션하는 [decommission](../../../sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND)을 구현하지 않았습니다. 이로 인해 문제가 발생할 수 있으므로 다음 사항에 유의하세요.

- 테이블에 복제본이 하나뿐인 상태에서 BE 노드를 성급하게 오프라인으로 전환하면 반드시 데이터가 손실됩니다. 이 작업은 최대한 피하세요.

- FE Follower 노드를 임의로 오프라인으로 전환하지 마세요. 메타데이터가 손상되어 서비스에 영향을 줄 수 있습니다.

- FE Observer 유형의 노드는 위험 없이 임의로 오프라인으로 전환할 수 있습니다.

- CN 노드는 데이터 복제본을 보유하지 않으므로 임의로 오프라인으로 전환할 수 있습니다. 다만 해당 CN 노드의 원격 데이터 캐시가 손실되어 단기적으로 데이터 쿼리 성능이 저하될 수 있습니다.

## Doris 클러스터 업그레이드 {#upgrade-doris-cluster}

Doris 클러스터 전체를 업그레이드하려면 먼저 BE를 업그레이드한 다음 FE를 업그레이드해야 합니다. Doris Operator는 Kubernetes의 [롤링 업데이트 기능](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)을 기반으로 각 컴포넌트를 롤링 방식으로 원활하게 업그레이드합니다.

### 업그레이드 전 유의 사항 {#notes-before-upgrade}

- 업무 부하가 적은 시간대에 업그레이드하는 것이 좋습니다.

- 롤링 업그레이드 중에는 종료된 노드에 대한 연결이 무효화되어 요청이 실패합니다. 이러한 영향을 받는 애플리케이션에는 클라이언트 측에 재시도 기능을 추가하는 것이 좋습니다.

- 업그레이드 전에 [일반 업그레이드 매뉴얼](../../../admin-manual/cluster-management/upgrade.md)을 읽고 업그레이드 시 적용되는 원칙과 유의 사항을 확인할 수 있습니다.

- 업그레이드 전에 데이터와 메타데이터의 호환성을 검증할 수 없습니다. 따라서 클러스터를 업그레이드할 때는 데이터 복제본이 하나뿐이거나 클러스터에 FE FOLLOWER 노드가 하나뿐인 구성을 피해야 합니다.

- 업그레이드 중에는 노드가 재시작되므로 불필요한 클러스터 밸런싱과 복제본 복구 로직이 실행될 수 있습니다. 먼저 다음 명령으로 이 기능들을 비활성화하세요.

```
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

- Doris를 업그레이드할 때는 주요 기준 버전을 두 개 이상 건너뛰지 않는 원칙을 따르세요. 여러 주요 기준 버전에 걸쳐 업그레이드하려면 먼저 가장 가까운 주요 기준 버전으로 업그레이드한 다음 순서대로 업그레이드하세요. 주요 기준 버전이 아닌 버전은 건너뛸 수 있습니다. 자세한 내용은 [업그레이드 버전 유의 사항](../../../admin-manual/cluster-management/upgrade.md)을 참조하세요.

### 업그레이드 작업 {#upgrade-operations}

업그레이드 시 노드 유형별 순서는 다음과 같습니다. 해당 유형의 노드가 없으면 건너뛰세요.

```
  cn/be -> fe -> broker
```

해당 클러스터 컴포넌트의 `image`를 순서대로 수정한 다음 구성을 적용하는 것이 좋습니다. 현재 유형의 컴포넌트가 모두 업그레이드되고 정상 상태로 복원될 때까지 기다린 후 다음 유형의 노드를 롤링 업그레이드하세요.

#### BE 업그레이드 {#upgrade-be}

클러스터의 CRD 파일(Doris Operator는 리소스 유형 이름의 약칭을 `DorisCluster`로 정의합니다)이 보존되어 있다면 구성 파일을 수정하고 `kubectl apply`를 실행하여 업그레이드할 수 있습니다.

1. `spec.beSpec.image`를 수정합니다

   `apache/doris:be-2.1.8`을 `apache/doris:be-2.1.9`로 변경합니다.
  
2. 변경 사항을 저장하고 적용하여 FE를 업그레이드합니다.

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

`kubectl edit dcr`로 직접 수정할 수도 있습니다.

1. 'doris' 네임스페이스의 dcr 목록을 조회하여 업데이트할 `cluster_name`을 확인합니다.

   ```shell
   $ kubectl get dcr -n doris
   NAME                  FESTATUS    BESTATUS    CNSTATUS
   Doriscluster-sample   available   available
   ```

2. 수정한 후 저장하고 적용합니다.

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```
  
   텍스트 편집기에 진입한 후 `spec.beSpec.image`를 찾아 `apache/doris:be-2.1.8`을 `apache/doris:be-2.1.9`로 변경합니다.

3. 업그레이드 진행 상황과 결과를 확인합니다.

   ```shell
   kubectl get pod -n doris
   ```
  
모든 Pod가 다시 생성되어 Running 상태에 진입하면 업그레이드가 완료됩니다.

#### FE 업그레이드 {#upgrade-fe}

클러스터의 crd 파일(Doris-Operator는 리소스 유형 이름의 약칭을 `DorisCluster`로 정의합니다)이 보존되어 있다면 구성 파일을 수정하고 `kubectl apply`를 실행하여 업그레이드할 수 있습니다.

1. `spec.feSpec.image`를 수정합니다

   `apache/doris:fe-2.1.8`을 `apache/doris:fe-2.1.9`로 변경합니다.

   ```shell
   vim doriscluster-sample.yaml
   ```

2. 변경 사항을 저장하고 적용하여 FE를 업그레이드합니다.

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

`kubectl edit dcr`로 직접 수정할 수도 있습니다.

1. 수정한 후 저장하고 적용합니다.

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```

   텍스트 편집기에 진입한 후 `spec.feSpec.image`를 찾아 `apache/doris:fe-2.1.8`을 `apache/doris:fe-2.1.9`로 변경합니다.

2. 업그레이드 진행 상황과 결과를 확인합니다.
   ```shell
   kubectl get pod -n doris
   ```
  
모든 Pod가 다시 생성되어 Running 상태에 진입하면 업그레이드가 완료됩니다.

### 업그레이드 후 처리 {#post-upgrade-handling}

#### 클러스터 노드 상태 확인 {#verify-cluster-node-status}

[Doris 클러스터 접속](install-config-cluster.md#access-configuration) 문서에 설명된 방법으로 `mysql-client`를 통해 Doris에 접속합니다.

`show frontends`와 `show backends` 같은 SQL로 각 컴포넌트의 버전과 상태를 확인합니다.

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

FE 노드의 `alive` 상태가 true이고 `Version` 값이 새 버전이면 FE 노드가 성공적으로 업그레이드된 것입니다.

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

BE 노드의 `alive` 상태가 true이고 `Version` 값이 새 버전이면 BE 노드가 성공적으로 업그레이드된 것입니다.

#### 클러스터 복제본 동기화 및 밸런싱 복원 {#restore-cluster-replica-synchronization-and-balancing}

각 노드가 올바른 상태인지 확인한 후 다음 SQL을 실행하여 클러스터 밸런싱과 복제본 복구를 복원합니다.

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## metadata_failure_recovery 모드로 FE 시작 {#start-fe-in-metadata_failure_recovery-mode}

FE가 마스터를 선출하지 못해 서비스를 사용할 수 없는 경우, `VLSN` 값이 가장 큰 노드를 선택하고 `metadata_failure_recovery` 메커니즘으로 해당 노드를 마스터 노드로 강제 시작하여 클러스터를 복구할 수 있습니다.

### 컨테이너 환경에서 복구 모드로 시작 {#start-in-recovery-mode-in-a-container-environment}

1. `VLSN` 값이 가장 큰 노드를 찾습니다.
   K8s에서는 FE Pod가 시작될 때마다 해당 노드의 가장 최근 10개 `VLSN` 레코드를 다음과 같이 출력합니다.
    ```
    the annotations value:
    the value not equal!  debug
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:19:2025-08-05 03:42:47.650 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica-feeder fe_d8763579_92da_4d72_8c58_4e62b88bdff0 start stream at VLSN: 30
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:21:2025-08-05 03:42:47.659 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica initialization completed. Replica VLSN: -1  Heartbeat master commit VLSN: 49  DTVLSN:0 Replica VLSN delta: 50
    [Tue Aug  5 06:14:05 UTC 2025] start with meta run start_fe.sh with additional options: '--console'
    ```
   위는 예시 클러스터의 FE가 시작될 때 출력되는 `VLSN` 레코드입니다. 현재 노드의 최대 `VLSN`은 30입니다(로그 출력 접두사는 `start stream at VLSN:`입니다).
2. 값이 가장 큰 노드의 Pod를 복구 메커니즘을 적용할 대상으로 선택합니다.
   `VLSN` 값이 가장 큰 노드의 Pod를 찾은 후 다음 명령으로 Pod에 복구 메커니즘을 사용해 시작하도록 지정하는 어노테이션을 추가합니다.
    ```
    kubectl annotate pod {podName} "selectdb.com.doris/recovery=true"
    ```
   Pod가 다시 시작되면 현재 노드는 시작 명령에 ` --metadata_failure_recovery`를 자동으로 추가하고, 서비스는 복구 모드로 시작됩니다.
3. 서비스가 정상화되면 반드시 2단계에서 추가한 어노테이션을 제거해야 합니다. 그렇지 않으면 이후 노드 재시작 시 예기치 않은 동작이 발생할 수 있습니다.

:::tip 팁
1. 어노테이션을 추가한 후에는 Pod를 삭제하여 재시작하지 마세요. Pod를 삭제하면 어노테이션이 사라집니다. kubelet이 자동으로 Pod를 재시작하여 실행할 때까지 기다리거나, 컨테이너에 접속하여 프로세스를 수동으로 종료하세요.
2. `metadata_failure_recovery` 모드로 시작하면 FE 로그 재생에 오랜 시간이 걸립니다. 이 모드로 시작하기 전에 먼저 FE 서비스의 [시작 프로브 시간 초과](install-config-cluster.md#startup-probe-timeout-configuration)를 수정한 다음 모든 FE Pod를 삭제하여 `metadata_failure_recovery`를 시작하세요.
:::
