---
{
    "title": "Развертывание FoundationDB",
    "language": "ru",
    "description": "Установка FoundationDB Operator и базы данных с фиксированными версиями в Kubernetes: зеркалирование образов, планирование ресурсов, совместимость клиентов и проверка готовности.",
    "keywords": [
        "Doris",
        "Kubernetes",
        "FoundationDB",
        "fdb-kubernetes-operator",
        "resources",
        "VeloDB"
    ]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview) (FDB) — распределенная база данных со строгой согласованностью. Doris использует FoundationDB для хранения метаданных в режиме разделения вычислений и хранения.

Перед развертыванием Doris подготовьте службу FoundationDB. Выберите способ развертывания с учетом вашей среды:

- Разверните FoundationDB непосредственно на машинах по [руководству по ручному развертыванию](../../deploy-manually/separating-storage-compute-deploy-manually.md). После развертывания убедитесь, что MetaService может обращаться к FoundationDB.
- Разверните FoundationDB в Kubernetes с помощью fdb-kubernetes-operator, выполнив приведенные ниже шаги.

## Перед началом работы {#before-you-start}

Для развертывания FoundationDB в Kubernetes подготовьте:

- Учетную запись Kubernetes с правами на создание CRD, ресурсов RBAC и рабочих нагрузок.
- Доступный для записи StorageClass на базе SSD и узлы с достаточными ресурсами для конфигурации, указанной ниже.
- Работающий DNS кластера и сетевое соединение от MetaService до Pod FDB.

В примерах используется FDB 7.3.69, для которой MetaService требуется совместимая клиентская библиотека версии 7.3. Если ваша версия Doris использует клиент версии 7.1, следуйте [инструкциям для FDB 7.1](#fdb-71). Клиент Operator используется контроллером и не обновляет клиентскую библиотеку в MetaService.

:::tip
Это руководство описывает новую установку FDB. Если FDB Operator уже установлен, проверьте, можно ли использовать его повторно, чтобы несколько контроллеров не управляли одним namespace. CRD действуют на уровне всего кластера, поэтому перед их обновлением проверьте совместимость с существующими кластерами FDB. Обновление существующих кластеров планируйте отдельно.
:::

## Версии и источники образов {#versions-and-image-sources}

В этом руководстве используются [примеры развертывания из репозитория VeloDB FDB Operator](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/samples/velodb). CRD загружаются из [репозитория VeloDB FDB Operator, ветка branch-2.35.0](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/crd/bases), и соответствуют Operator v2.35.0. Совместимость и настройка развертывания описаны в [руководстве к примерам](https://github.com/velodb/fdb-kubernetes-operator/blob/branch-2.35.0/config/samples/velodb/README.md). В примерах используются следующие образы:

| Компонент | Версия | Образ VeloDB |
| --- | --- | --- |
| FDB Operator / соответствующие CRD | v2.35.0 | `velodb/fdb-kubernetes-operator:v2.35.0` |
| Инициализатор клиента контроллера / база данных FDB | 7.3.69 | `velodb/fdb-kubernetes-monitor:7.3.69` |

Эти образы поддерживают linux/amd64 и linux/arm64. В примерах используется `imageType: unified`, поэтому основной контейнер FDB и sidecar используют общий образ Monitor. Контроллер также использует этот образ для инициализации своего клиента.

Используйте CRD, Operator и примеры конфигурации кластера из этого руководства вместе. Общие примеры непосредственно в `config/samples/` и Helm chart представляют собой отдельные способы установки; не смешивайте их настройки контроллера, клиента и базы данных с приведенными здесь конфигурациями фиксированных версий.

## Планирование ресурсов {#resource-planning}

Планируйте ресурсы как для FDB Operator, так и для кластера FDB. Запросы и ограничения ресурсов Operator составляют **500m CPU / 256Mi**, а инициализатора его клиента — **10m CPU / 50Mi**.

В репозитории VeloDB FDB Operator есть примеры кластеров с одной и двумя репликами. Выберите подходящий вариант:

| Параметр | Одна реплика (разработка) | Две реплики |
| --- | --- | --- |
| Pod для storage / log / stateless | 1 / 1 / 2 | 3 / 4 / 9 |
| Запрос ресурсов основного контейнера на Pod | 1 CPU / 1Gi | 1 CPU / 8Gi |
| Ограничение ресурсов основного контейнера на Pod | 1 CPU / 2Gi | 2 CPU / 8Gi |
| Запрос = ограничение ресурсов sidecar на Pod | 100m CPU / 256Mi | 100m CPU / 256Mi |
| PVC на Pod storage / log | 10Gi / 10Gi | 200Gi / 100Gi |
| Всего Pod / PVC | 4 / 2 | 16 / 7 |
| Суммарные запросы ресурсов с учетом sidecar | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| Суммарная запрошенная емкость PVC | 20Gi | 1000Gi |

В итоговых значениях учтены sidecar, но не учтены Operator, MS/FE/BE и накладные расходы Kubernetes. Pod stateless не требуют PVC для постоянного хранения данных. Предусмотрите дополнительные ресурсы для Pod и хранилища на время последовательной замены экземпляров.

Пример с одной репликой предназначен для небольших функциональных тестов. В нем уменьшен объем памяти, поэтому проверьте настройки памяти и кеша и следите за ошибками OOM при вашей нагрузке. Значение по умолчанию в исходном проекте — 1 CPU / 8Gi на основной контейнер с одинаковыми запросами и ограничениями; см. [требования к ресурсам](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements).

Кластеру с двумя репликами нужны как минимум три независимых домена отказа хостов. После развертывания проверьте, что процессы storage, log и coordinator надлежащим образом распределены по узлам. В примерах используется предпочтительная антисвязанность, допускающая размещение нескольких Pod с одной ролью на одном узле. Если вам требуется размещать не более одного Pod каждой роли на узле, для девяти Pod stateless понадобятся как минимум девять узлов, доступных для планирования. См. [настройку доменов отказа](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md).

Для рабочей среды используйте SSD и подбирайте ресурсы с учетом объема метаданных, нагрузки на запись и места, необходимого для восстановления. В примере каждому Pod storage выделено 200Gi, а каждому Pod log — 100Gi; при необходимости измените эти значения. Если несколько кластеров Doris совместно используют FDB, планируйте ресурсы с учетом их совокупной нагрузки и проверьте достаточность ресурсов перед использованием в рабочей среде. В каждом Pod storage/log работает один сервер; при увеличении числа процессов скорректируйте объем CPU и памяти.

## Развертывание FoundationDB в Kubernetes {#deploy-foundationdb-on-kubernetes}

Развертывание FoundationDB в Kubernetes состоит из четырех шагов:

1. Загрузите файлы развертывания.
2. Разверните CRD, FDB Operator и Monitor RBAC.
3. Разверните кластер FoundationDB.
4. Проверьте состояние кластера.

В следующих шагах используется namespace `fdb-system`. Operator управляет кластерами FDB только в этом namespace. Чтобы использовать другой namespace, одновременно обновите namespace объектов и namespace субъектов RBAC в файлах развертывания.

### Шаг 1. Загрузка установочных файлов {#step-1-download-the-installation-assets}

Замените `/path/to/kubeconfig` путем к файлу конфигурации вашего кластера Kubernetes, затем проверьте существующие ресурсы FDB, контроллеры и StorageClass:

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

Если CRD или контроллер FDB уже существуют, сначала проверьте, можно ли использовать их повторно. Для новой среды загрузите файлы развертывания следующими командами:

```shell
mkdir fdb-install-v2.35.0
cd fdb-install-v2.35.0
FDB_CRDS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/branch-2.35.0/config/crd/bases
FDB_ASSETS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/branch-2.35.0/config/samples/velodb
for resource in clusters backups restores; do
  curl -fSL "$FDB_CRDS/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fSL "$FDB_ASSETS/operator.yaml" -o fdb-operator.yaml
curl -fSL "$FDB_ASSETS/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
# Development profile. Use cluster-double.yaml instead for the double profile.
curl -fSL "$FDB_ASSETS/cluster-single.yaml" -o fdb-cluster.yaml
```

### Шаг 2. Установка CRD, контроллера и Monitor RBAC {#step-2-install-crds-the-controller-and-monitor-rbac}

Загруженные конфигурации Operator, инициализатора и базы данных уже используют перечисленные выше образы VeloDB.

Разверните CRD, Operator и Monitor RBAC следующими командами:

```shell
kubectl --kubeconfig "$KUBECONFIG" create namespace fdb-system
kubectl --kubeconfig "$KUBECONFIG" apply --server-side \
  -f fdb-clusters-crd.yaml -f fdb-backups-crd.yaml -f fdb-restores-crd.yaml
kubectl --kubeconfig "$KUBECONFIG" wait --for=condition=Established --timeout=60s \
  crd/foundationdbclusters.apps.foundationdb.org \
  crd/foundationdbbackups.apps.foundationdb.org \
  crd/foundationdbrestores.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-operator.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-monitor-rbac.yaml
```

Продолжайте развертывание кластера FDB, когда все три CRD перейдут в состояние Established и развертывание Operator Deployment успешно завершится. Для CRD используется `--server-side`, поскольку файлы слишком велики для аннотации last-applied при применении на стороне клиента. Если возникает конфликт с существующим ресурсом, перед продолжением проверьте его версию и владельца, а не перезаписывайте ресурс с помощью `--force-conflicts`.

`fdb-monitor-rbac.yaml` создает отдельную учетную запись ServiceAccount `fdb-monitor` для Pod FDB и предоставляет ей права get/list/watch/patch на Pod в этом namespace.

### Шаг 3. Настройка и создание базы данных {#step-3-configure-and-create-the-database}

Откройте `fdb-cluster.yaml` и замените оба значения `REPLACE_WITH_SSD_STORAGE_CLASS` на ваш StorageClass. Скорректируйте CPU, память и емкость PVC согласно разделу о планировании ресурсов выше. Пример с одной репликой предназначен для разработки; для рабочей среды выберите две реплики и подберите ресурсы под свою нагрузку.

В примере уже настроены Monitor ServiceAccount, домен отказа хостов, маршрутизация по FQDN и один сервер на Pod. При изменении конфигурации учитывайте следующее:

- Значения `spec.version`, `mainContainer.imageConfigs[].version` и `tag` должны соответствовать версии FDB в образе. Для версии 7.1 сначала выполните [настройку FDB 7.1](#fdb-71).
- Контейнеры работают с UID/GID 4059 и используют `fsGroup: 4059` для доступа к томам. Проверьте, что ваш драйвер CSI поддерживает запись от имени этой группы. Для пользовательских образов настройте идентификаторы в соответствии с образом.

После изменения конфигурации разверните кластер:

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-cluster.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb
```

Пример с одной репликой создает `fdb-single`, а пример с двумя репликами — `fdb-double`. В следующих командах используется `fdb-single`; при необходимости замените его на `fdb-double`.

### Шаг 4. Проверка доступности и согласования состояния {#step-4-verify-availability-and-reconciliation}

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get pods,pvc
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb fdb-single -o yaml
```

После развертывания проверьте следующее:

- Тома привязаны, а контейнеры базы данных успешно запускаются. Одного состояния Running у Pod недостаточно.
- Значения `status.configured`, `status.health.available` и `status.health.fullReplication` равны `true`.
- `status.generations.reconciled` достигло значения `metadata.generation`. Даже если база данных доступна, согласование состояния после замены экземпляров или уменьшения размера кластера может еще продолжаться.

Когда эти проверки пройдут успешно, настройте MetaService с помощью созданного ConfigMap и убедитесь, что MetaService подключается к FDB, прежде чем создавать таблицы. Перед использованием в рабочей среде также проверьте состояние кластера, размещение координаторов и доступность при отказе хостов.

## Получение ConfigMap с данными для доступа к FoundationDB {#get-the-configmap-that-contains-foundationdb-access-information}

Operator создает `<FoundationDBCluster name>-config` в namespace базы данных:

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get configmap fdb-single-config -o yaml
```

Настройте ресурс Doris следующим образом; для примера с двумя репликами используйте `fdb-double-config`:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        namespace: fdb-system
        name: fdb-single-config
```

Добавьте эту конфигурацию в ресурс `DorisDisaggregatedCluster`. Подробности см. в разделе [Настройка MetaService](config-ms.md).

:::tip
Несколько кластеров Doris могут совместно использовать один FDB. При удалении отдельного кластера Doris сохраните общий FDB. Удаление ресурсов FDB или PVC может привести к потере метаданных, поэтому подготовьте план резервного копирования и восстановления.
:::

## Вариант для сборок MetaService, которым требуется FDB 7.1 {#fdb-71}

Если MetaService использует клиент версии 7.1, можно создать кластер FDB 7.1.67 на узлах amd64. Перед развертыванием кластера FDB добавьте клиент версии 7.1 в Operator следующими командами:

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

В скопированном YAML кластера измените `spec.version`, а также `version` и `tag` в конфигурации основного образа на `7.1.67`. Образ 7.1.67 поддерживает только amd64: в кластерах со смешанными архитектурами задайте `nodeSelector: {kubernetes.io/arch: amd64}` для контроллера и каждого шаблона Pod базы данных. Используйте эту конфигурацию для создания нового кластера, совместимого с вашим MetaService; она не предназначена для понижения версии существующего кластера FDB.

## Частные реестры и устранение неполадок {#private-registries-and-troubleshooting}

Если из вашей среды недоступен Docker Hub, скопируйте необходимые образы в частный реестр и обновите файлы развертывания:

- Operator и инициализатор: измените `image`.
- Кластер FDB: измените `mainContainer.imageConfigs[].baseImage`, сохранив соответствие версии FDB в образе значению `spec.version`. В режиме unified основной контейнер и sidecar используют общий образ.
- Если реестр требует аутентификации, настройте `imagePullSecrets` как в шаблоне Pod Operator, так и в шаблонах Pod FDB.

Включите все образы задействованных инициализаторов клиентов и выберите платформы, соответствующие вашим узлам. Распространенные проблемы при развертывании и способы проверки приведены ниже:

| Симптом | Что проверить |
| --- | --- |
| Сбой инициализации контроллера / образ не запускается | Доступ к зеркалу, tag, архитектуру узла; необязательный инициализатор версии 7.1 поддерживает только amd64 |
| PVC или Pod в состоянии Pending | StorageClass, выделение томов драйвером CSI, емкость, запросы ресурсов, селекторы узлов и антисвязанность |
| `File could not be written` | Владельца тома, UID/GID/fsGroup и обработку прав доступа драйвером CSI |
| Состояние FDB не согласовано | namespace, за которым следит контроллер, и RBAC, события, журналы контроллера, ресурсы для замены экземпляров и ход восстановления |
| FDB доступна, но MS не может подключиться | Совместимость клиента MetaService, созданные данные для подключения, DNS и сеть Pod |

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get events --sort-by=.metadata.creationTimestamp
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system logs \
  deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

Во время устранения неполадок сохраняйте общие CRD, кластеры FDB и PVC, чтобы защитить данные, используемые существующими кластерами.
