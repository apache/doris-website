---
{
    "title": "Управление кластером",
    "language": "ru",
    "description": "Руководство по управлению кластером Doris: масштабирование сервисов, последовательные обновления, устранение CrashLoopBackOff, запуск в режиме Debug, восстановление метаданных и другие операции управления кластером в среде Kubernetes.",
    "keywords": ["управление кластером Doris", "масштабирование", "последовательное обновление", "CrashLoopBackOff", "режим Debug", "восстановление метаданных", "K8s", "Kubernetes"]
}
---

## Как войти в контейнер при аварийном завершении сервиса {#how-to-enter-the-container-when-the-service-crashes}

В среде K8s сервисы могут переходить в состояние `CrashLoopBackOff` из-за непредвиденных событий. Команда `kubectl get pod --namespace ${namespace}` позволяет посмотреть состояние pod и pod_name в указанном пространстве имён.

В этом состоянии одних команд describe и logs недостаточно, чтобы определить причину сбоя сервиса. Когда сервис переходит в состояние `CrashLoopBackOff`, нужен механизм, позволяющий развёрнутому pod перейти в состояние `running`, чтобы можно было войти в контейнер с помощью exec для отладки.

В Doris Operator предусмотрен режим работы `Debug`. Ниже описано, как включить режим Debug для ручной отладки, когда сервис переходит в состояние `CrashLoopBackOff`, и как восстановить обычный запуск после устранения проблемы.

### Запуск режима Debug {#start-debug-mode}

Если во время обычной работы pod сервиса переходит в состояние CrashLoopBackOff или не может запуститься штатно, выполните следующие действия, чтобы перевести сервис в режим `Debug` для ручного запуска и диагностики.

1. **Добавьте аннотацию к проблемному pod с помощью следующей команды**

  ```shell
  kubectl annotate pod ${pod_name} --namespace ${namespace} apache.org.doris/runmode=debug
  ```

  При следующем перезапуске сервис обнаружит аннотацию, указывающую на запуск в режиме `Debug`, и запустится в режиме `Debug`, а pod перейдёт в состояние `running`.

2. **Когда сервис переходит в режим `Debug`, его pod отображается в нормальном состоянии. Войти в pod можно с помощью следующей команды**

  ```shell
  kubectl --namespace ${namespace} exec -ti ${pod_name} bash
  ```

3. **Запустите сервис вручную в режиме `Debug`. После входа в pod измените соответствующие порты в файле конфигурации и вручную выполните скрипт `start_xx.sh`. Скрипты находятся в каталоге `/opt/apache-doris/xx/bin`.**

  Для FE нужно изменить `query_port`, а для BE нужно изменить `heartbeat_service_port`, чтобы аварийно завершившийся узел не оставался доступным через сервис в режиме `Debug` и не получал трафик по ошибке.

### Выход из режима Debug {#exit-debug-mode}

После выявления проблемы выйдите из режима `Debug`, удалив соответствующий pod следующей командой. Затем сервис запустится в обычном режиме.

```shell
kubectl delete pod ${pod_name} --namespace ${namespace}
```

:::tip Совет
**После входа в pod обязательно измените параметры портов в файле конфигурации, прежде чем вручную запускать соответствующие компоненты Doris.**
- Для FE измените параметр `query_port=9030`. Путь по умолчанию: `/opt/apache-doris/fe/conf/fe.conf`.
- Для BE измените параметр `heartbeat_service_port=9050`. Путь по умолчанию: `/opt/apache-doris/be/conf/be.conf`.
:::

## Масштабирование сервисов {#service-scaling}

Масштабирование Doris в K8s выполняется путём изменения поля replicas соответствующего компонента в ресурсе DorisCluster. Ресурс можно редактировать напрямую или с помощью команд.

### Получение ресурсов DorisCluster {#get-doriscluster-resources}

Используйте команду `kubectl --namespace {namespace} get doriscluster`, чтобы получить имена развёрнутых ресурсов DorisCluster (сокращённо dcr). В этом документе используется пространство имён `doris`.

```shell
kubectl --namespace doris get doriscluster
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```

### Масштабирование ресурсов {#scale-resources}

Все операции в K8s выполняются путём изменения ресурсов до целевого состояния, а сервис Operator автоматически выполняет необходимые действия. Для масштабирования можно сразу перейти в режим редактирования с помощью команды `kubectl --namespace {namespace}  edit doriscluster {dcr_name}` и изменить значение replicas в соответствующей спецификации spec. После сохранения изменений и выхода Doris Operator выполнит операцию. Также можно масштабировать отдельные компоненты с помощью следующих команд.

#### Масштабирование FE {#scale-fe}

1. **Посмотрите текущее количество сервисов FE**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS       AGE
  doriscluster-sample-fe-0   1/1     Running   0              10d
  ```

2. **Измените количество FE**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"feSpec":{"replicas":3}}}'
  ```

3. **Проверьте результат масштабирования**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=fe"
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-2   1/1     Running   0          9m37s
  doriscluster-sample-fe-1   1/1     Running   0          9m37s
  doriscluster-sample-fe-0   1/1     Running   0          8m49s
  ```

#### Масштабирование BE {#scale-be}

1. **Посмотрите текущее количество сервисов BE**

  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  ```

2. **Измените количество BE**

  ```shell
  kubectl --namespace doris patch doriscluster doriscluster-sample --type merge --patch '{"spec":{"beSpec":{"replicas":3}}}'
  ```

3. **Проверьте результат масштабирования**
  ```shell
  kubectl --namespace doris get pods -l "app.kubernetes.io/component=be"
  NAME                       READY   STATUS    RESTARTS      AGE
  doriscluster-sample-be-0   1/1     Running   0             3d2h
  doriscluster-sample-be-2   1/1     Running   0             12m
  doriscluster-sample-be-1   1/1     Running   0             12m
  ```

### Сокращение числа узлов {#node-scale-in}

При сокращении числа узлов Doris-Operator в настоящее время не обеспечивает полноценную поддержку их безопасного вывода из эксплуатации. Вы по-прежнему можете уменьшить значение атрибута replicas у компонентов кластера, чтобы сократить количество узлов FE или BE. При этом узел просто останавливается и отключается от кластера. В текущей версии Doris-Operator не реализован [вывод из эксплуатации](../../../sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND) с безопасным переносом реплик перед отключением узла. Это может привести к проблемам. Учитывайте следующее:

- Необдуманное отключение узла BE, когда таблица имеет только одну реплику, неизбежно приведёт к потере данных. По возможности избегайте этой операции.

- Избегайте произвольного отключения узлов FE Follower, поскольку это может повредить метаданные и нарушить работу сервиса.

- Узлы FE типа Observer можно отключать произвольно без риска.

- Узлы CN не хранят реплики данных, поэтому их можно отключать произвольно. Однако при этом будет потерян кеш удалённых данных на отключённом узле CN, что на короткое время снизит производительность запросов к данным.

## Обновление кластера Doris {#upgrade-doris-cluster}

При обновлении всего кластера Doris сначала нужно обновить BE, а затем FE. Doris Operator обеспечивает плавное последовательное обновление каждого компонента на основе [механизма последовательного обновления](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/) Kubernetes.

### Рекомендации перед обновлением {#notes-before-upgrade}

- Рекомендуется выполнять обновление в часы наименьшей нагрузки.

- Во время последовательного обновления соединения с остановленными узлами становятся недействительными, что приводит к сбоям запросов. Для приложений, чувствительных к таким сбоям, рекомендуется добавить повторные попытки на стороне клиента.

- Перед обновлением ознакомьтесь с [общим руководством по обновлению](../../../admin-manual/cluster-management/upgrade.md), чтобы узнать об основных принципах и мерах предосторожности.

- До обновления невозможно проверить совместимость данных и метаданных. Поэтому нельзя обновлять кластер, в котором есть данные с единственной репликой или только один узел FE FOLLOWER.

- Во время обновления узлы перезапускаются, что может вызвать ненужную балансировку кластера и восстановление реплик. Предварительно отключите эти механизмы следующими командами:

```
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

- При обновлении Doris нельзя пропускать две или более ключевые версии. Если обновление охватывает несколько ключевых версий, сначала обновитесь до ближайшей ключевой версии, а затем последовательно переходите к следующим. Промежуточные некритические версии можно пропускать. Подробности приведены в [примечаниях по выбору версии для обновления](../../../admin-manual/cluster-management/upgrade.md).

### Порядок обновления {#upgrade-operations}

Типы узлов обновляются в следующем порядке. Если узлов определённого типа нет, пропустите этот тип:

```
  cn/be -> fe -> broker
```

Рекомендуется последовательно изменять `image` соответствующего компонента кластера, а затем применять конфигурацию. Дождитесь полного обновления компонентов текущего типа и восстановления их нормального состояния, прежде чем начинать последовательное обновление узлов следующего типа.

#### Обновление BE {#upgrade-be}

Если файл CRD кластера (в Doris Operator `DorisCluster` используется как сокращённое имя типа ресурса) сохранён, обновление можно выполнить, изменив файл конфигурации и запустив `kubectl apply`.

1. Измените `spec.beSpec.image`

   Замените `apache/doris:be-2.1.8` на `apache/doris:be-2.1.9`.
  
2. Сохраните изменения и примените их для обновления FE:

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

Также можно внести изменения напрямую с помощью `kubectl edit dcr`.

1. Посмотрите список dcr в пространстве имён 'doris' и определите `cluster_name` для обновления:

   ```shell
   $ kubectl get dcr -n doris
   NAME                  FESTATUS    BESTATUS    CNSTATUS
   Doriscluster-sample   available   available
   ```

2. Внесите, сохраните и примените изменения:

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```
  
   В открывшемся текстовом редакторе найдите `spec.beSpec.image` и замените `apache/doris:be-2.1.8` на `apache/doris:be-2.1.9`.

3. Посмотрите ход и результат обновления:

   ```shell
   kubectl get pod -n doris
   ```
  
Обновление завершено, когда все Pods пересозданы и перешли в состояние Running.

#### Обновление FE {#upgrade-fe}

Если файл crd кластера (в Doris-Operator `DorisCluster` используется как сокращённое имя типа ресурса) сохранён, обновление можно выполнить, изменив файл конфигурации и запустив `kubectl apply`.

1. Измените `spec.feSpec.image`

   Замените `apache/doris:fe-2.1.8` на `apache/doris:fe-2.1.9`.

   ```shell
   vim doriscluster-sample.yaml
   ```

2. Сохраните изменения и примените их для обновления FE:

   ```shell
   kubectl apply -f doriscluster-sample.yaml -n doris
   ```

Также можно внести изменения напрямую с помощью `kubectl edit dcr`.

1. Внесите, сохраните и примените изменения:

   ```shell
   kubectl edit dcr doriscluster-sample -n doris
   ```

   В открывшемся текстовом редакторе найдите `spec.feSpec.image` и замените `apache/doris:fe-2.1.8` на `apache/doris:fe-2.1.9`.

2. Посмотрите ход и результат обновления:
   ```shell
   kubectl get pod -n doris
   ```
  
Обновление завершено, когда все Pods пересозданы и перешли в состояние Running.

### Действия после обновления {#post-upgrade-handling}

#### Проверка состояния узлов кластера {#verify-cluster-node-status}

Используйте способ, описанный в документе [Доступ к кластеру Doris](install-config-cluster.md#access-configuration), чтобы подключиться к Doris через `mysql-client`.

Используйте SQL-команды, например `show frontends` и `show backends`, для просмотра версии и состояния каждого компонента.

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

Если состояние `alive` узла FE имеет значение true, а значение `Version` соответствует новой версии, обновление узла FE прошло успешно.

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

Если состояние `alive` узла BE имеет значение true, а значение `Version` соответствует новой версии, обновление узла BE прошло успешно.

#### Восстановление синхронизации реплик и балансировки кластера {#restore-cluster-replica-synchronization-and-balancing}

Убедившись, что каждый узел находится в нужном состоянии, выполните следующие SQL-команды, чтобы восстановить балансировку кластера и восстановление реплик:

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## Запуск FE в режиме metadata_failure_recovery {#start-fe-in-metadata_failure_recovery-mode}

Если FE не может выбрать master и сервис недоступен, можно выбрать узел с наибольшим значением `VLSN` и принудительно запустить его как узел master с помощью механизма `metadata_failure_recovery`, чтобы восстановить кластер.

### Запуск в режиме восстановления в контейнерной среде {#start-in-recovery-mode-in-a-container-environment}

1. Найдите узел с наибольшим значением `VLSN`.
   В K8s при каждом запуске Pod FE выводит последние 10 записей `VLSN` этого узла, как показано ниже:
    ```
    the annotations value:
    the value not equal!  debug
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:19:2025-08-05 03:42:47.650 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica-feeder fe_d8763579_92da_4d72_8c58_4e62b88bdff0 start stream at VLSN: 30
    /opt/apache-doris/fe/doris-meta/bdb/je.info.0:21:2025-08-05 03:42:47.659 UTC INFO [fe_f35530c4_3ff1_48fe_80d1_cc8e32dbc942] Replica initialization completed. Replica VLSN: -1  Heartbeat master commit VLSN: 49  DTVLSN:0 Replica VLSN delta: 50
    [Tue Aug  5 06:14:05 UTC 2025] start with meta run start_fe.sh with additional options: '--console'
    ```
   Выше показаны записи `VLSN`, выводимые при запуске FE в примере кластера. Наибольшее значение `VLSN` текущего узла равно 30 (префикс в журнале: `start stream at VLSN:`).
2. Выберите pod узла с наибольшим значением для запуска с использованием механизма восстановления.
   Найдя pod узла с наибольшим значением `VLSN`, добавьте к нему аннотацию для запуска механизма восстановления с помощью следующей команды.
    ```
    kubectl annotate pod {podName} "selectdb.com.doris/recovery=true"
    ```
   При следующем перезапуске Pod текущий узел автоматически добавит ` --metadata_failure_recovery` к команде запуска, и сервис запустится в режиме восстановления.
3. После восстановления нормальной работы сервиса обязательно удалите аннотацию, добавленную на шаге 2. Иначе при последующих перезапусках узла возможно непредвиденное поведение.

:::tip Совет
1. После добавления аннотации не выполняйте перезапуск путём удаления pod, поскольку это приведёт к потере аннотации. Дождитесь, пока kubelet автоматически перезапустит и запустит pod, либо войдите в контейнер и вручную завершите процесс.
2. При запуске в режиме `metadata_failure_recovery` воспроизведение журналов FE занимает много времени. Перед запуском в этом режиме сначала измените [тайм-аут проверки запуска](install-config-cluster.md#startup-probe-timeout-configuration) сервиса FE, а затем удалите все Pods FE для запуска `metadata_failure_recovery`.
:::
