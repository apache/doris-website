---
{
    "title": "Развёртывание FoundationDB",
    "language": "ru",
    "description": "Установка FoundationDB Operator и базы данных закреплённых версий в Kubernetes: зеркалирование образов, планирование ресурсов, совместимость клиентов и проверка готовности.",
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

[FoundationDB](https://apple.github.io/foundationdb/#overview) (FDB) — распределённая база данных со строгой согласованностью. Doris использует FoundationDB для хранения метаданных в режиме разделения вычислений и хранения.

Перед развёртыванием Doris подготовьте службу FoundationDB. Выберите способ развёртывания с учётом своей среды:

- Разверните FoundationDB непосредственно на машинах, следуя [руководству по ручному развёртыванию](../../deploy-manually/separating-storage-compute-deploy-manually.md). После развёртывания убедитесь, что MetaService может обращаться к FoundationDB.
- Разверните FoundationDB в Kubernetes с помощью fdb-kubernetes-operator, следуя приведённым ниже инструкциям.

## Перед началом работы {#before-you-start}

Для развёртывания FoundationDB в Kubernetes подготовьте:

- Учётную запись Kubernetes с правами на создание CRD, ресурсов RBAC и рабочих нагрузок.
- Доступный для записи StorageClass на SSD и узлы с достаточной ёмкостью для ресурсов, перечисленных ниже.
- Работающий DNS кластера и сетевое соединение от MetaService до Pod FDB.

В примерах используется FDB 7.3.69, для которого в MetaService нужна совместимая клиентская библиотека версии 7.3. Если ваша версия Doris использует клиент версии 7.1, следуйте [инструкциям для FDB 7.1](#fdb-71). Клиент Operator используется контроллером и не обновляет клиентскую библиотеку MetaService.

:::tip
В этом руководстве описана новая установка FDB. Если FDB Operator уже установлен, проверьте, можно ли использовать его повторно, чтобы одним пространством имён не управляли несколько контроллеров. CRD действуют на уровне всего кластера, поэтому перед их обновлением проверьте совместимость с существующими кластерами FDB. Обновление существующих кластеров планируйте отдельно.
:::

## Версии и источники образов {#versions-and-image-sources}

В этом руководстве используются [примеры развёртывания от VeloDB FDB Operator](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/samples/velodb). CRD загружаются из [репозитория VeloDB FDB Operator, ветка branch-2.35.0](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/crd/bases), и соответствуют Operator v2.35.0. Совместимость и настройка развёртывания описаны в [руководстве к примерам](https://github.com/velodb/fdb-kubernetes-operator/blob/branch-2.35.0/config/samples/velodb/README.md). В примерах используются следующие образы:

| Компонент | Версия | Образ VeloDB |
| --- | --- | --- |
| FDB Operator / соответствующие CRD | v2.35.0 | `velodb/fdb-kubernetes-operator:v2.35.0` |
| Инициализатор клиента контроллера / база данных FDB | 7.3.69 | `velodb/fdb-kubernetes-monitor:7.3.69` |

Эти образы поддерживают linux/amd64 и linux/arm64. В примерах используется `imageType: unified`, поэтому основной контейнер FDB и sidecar используют один образ Monitor. Контроллер также использует этот образ для инициализации своего клиента.

Используйте вместе CRD, Operator и примеры кластеров из этого руководства. Общие примеры непосредственно в `config/samples/` и Helm chart представляют собой отдельные способы установки; не смешивайте настройки их контроллеров, клиентов или баз данных с приведёнными здесь профилями с закреплёнными версиями.

## Планирование ресурсов {#resource-planning}

Планируйте ресурсы и для FDB Operator, и для кластера FDB. Запросы и лимиты Operator составляют **500m CPU / 256Mi**, а запросы и лимиты его инициализатора клиента — **10m CPU / 50Mi**.

Репозиторий VeloDB FDB Operator содержит примеры кластеров с одной и двумя репликами. Выберите вариант в соответствии со своими задачами:

| Параметр | Одна реплика (разработка) | Две реплики |
| --- | --- | --- |
| Pod storage / log / stateless | 1 / 1 / 2 | 3 / 4 / 9 |
| Запросы основного контейнера на Pod | 1 CPU / 1Gi | 1 CPU / 8Gi |
| Лимиты основного контейнера на Pod | 1 CPU / 2Gi | 2 CPU / 8Gi |
| Запросы = лимиты sidecar на Pod | 100m CPU / 256Mi | 100m CPU / 256Mi |
| PVC на Pod storage / log | 10Gi / 10Gi | 200Gi / 100Gi |
| Всего Pod / PVC | 4 / 2 | 16 / 7 |
| Всего запрошено с учётом sidecar | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| Общая запрошенная ёмкость PVC | 20Gi | 1000Gi |

Итоговые значения учитывают sidecar, но не учитывают Operator, MS/FE/BE и накладные расходы Kubernetes. Для stateless Pod не нужны PVC для постоянного хранения данных. Зарезервируйте дополнительные ресурсы для Pod и хранилища на время последовательной замены Pod.

Пример с одной репликой предназначен для небольших функциональных тестов. В нём уменьшен объём памяти, поэтому проверьте настройки памяти и кэша и следите за ошибками OOM при своей нагрузке. По умолчанию в исходной конфигурации каждому основному контейнеру выделяется 1 CPU / 8Gi с одинаковыми запросами и лимитами; см. [требования к ресурсам](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements).

Кластеру с двумя репликами нужны как минимум три независимых домена отказа хостов. После развёртывания проверьте, что процессы storage, log и coordinator распределены по узлам надлежащим образом. В примерах используется предпочтительная антисвязанность, поэтому несколько Pod с одной ролью могут размещаться на одном узле. Если требуется размещать не более одного Pod каждой роли на узле, для девяти stateless Pod потребуется как минимум девять узлов, доступных для планирования. См. [настройку доменов отказа](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md).

Для промышленной эксплуатации используйте SSD и подбирайте ресурсы с учётом объёма метаданных, нагрузки на запись и пространства для восстановления. В примере каждому Pod storage выделено 200Gi, а каждому Pod log — 100Gi; при необходимости измените эти значения. Если несколько кластеров Doris совместно используют FDB, планируйте ресурсы с учётом их суммарной нагрузки и проверяйте достаточность ресурсов до промышленной эксплуатации. В каждом Pod storage/log работает один сервер; если увеличите число процессов, скорректируйте ресурсы CPU и памяти.

## Развёртывание FoundationDB в Kubernetes {#deploy-foundationdb-on-kubernetes}

Развёртывание FoundationDB в Kubernetes состоит из четырёх шагов:

1. Загрузить файлы развёртывания.
2. Развернуть CRD, FDB Operator и Monitor RBAC.
3. Развернуть кластер FoundationDB.
4. Проверить состояние кластера.

В следующих шагах используется пространство имён `fdb-system`. Operator управляет кластерами FDB только в этом пространстве имён. Чтобы использовать другое пространство имён, измените в файлах развёртывания пространства имён объектов и пространств имён субъектов RBAC согласованно.

### Шаг 1. Загрузите установочные файлы {#step-1-download-the-installation-assets}

Замените `/path/to/kubeconfig` путём к файлу конфигурации вашего кластера Kubernetes, затем проверьте существующие ресурсы FDB, контроллеры и StorageClass:

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

Если CRD или контроллер FDB уже существуют, сначала проверьте, можно ли использовать их повторно. Для новой среды загрузите файлы развёртывания следующими командами:

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

### Шаг 2. Установите CRD, контроллер и Monitor RBAC {#step-2-install-crds-the-controller-and-monitor-rbac}

Загруженные профили Operator, инициализатора и базы данных уже используют перечисленные выше образы VeloDB.

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

Когда все три CRD перейдут в состояние Established, а развёртывание Operator успешно завершится, переходите к кластеру FDB. Для CRD используется `--server-side`, поскольку файлы слишком велики для аннотации last-applied, применяемой на стороне клиента. При конфликте с существующим ресурсом проверьте его версию и принадлежность, прежде чем продолжать; не перезаписывайте его с помощью `--force-conflicts`.

`fdb-monitor-rbac.yaml` создаёт для Pod FDB отдельную учётную запись ServiceAccount `fdb-monitor` с правами get/list/watch/patch для Pod в этом пространстве имён.

### Шаг 3. Настройте и создайте базу данных {#step-3-configure-and-create-the-database}

Откройте `fdb-cluster.yaml` и замените оба значения `REPLACE_WITH_SSD_STORAGE_CLASS` на свой StorageClass. Скорректируйте CPU, память и ёмкость PVC с учётом раздела о планировании ресурсов выше. Пример с одной репликой предназначен для разработки; для промышленной эксплуатации выберите две реплики и подберите ресурсы под свою нагрузку.

В примере уже настроены Monitor ServiceAccount, домен отказа хоста, маршрутизация по FQDN и один сервер на Pod. При изменении конфигурации:

- Сохраняйте соответствие `spec.version`, `mainContainer.imageConfigs[].version` и `tag` версии FDB в образе. Для версии 7.1 сначала выполните [настройку FDB 7.1](#fdb-71).
- Контейнеры работают с UID/GID 4059 и используют `fsGroup: 4059` для прав доступа к томам. Проверьте, поддерживает ли ваш драйвер CSI запись от имени этой группы. Для пользовательских образов настройте идентификаторы в соответствии с образом.

После изменения конфигурации разверните кластер:

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-cluster.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb
```

Пример с одной репликой создаёт `fdb-single`, а пример с двумя — `fdb-double`. В следующих командах используется `fdb-single`; при необходимости замените его на `fdb-double`.

### Шаг 4. Проверьте доступность и согласование состояния {#step-4-verify-availability-and-reconciliation}

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get pods,pvc
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb fdb-single -o yaml
```

После развёртывания проверьте следующее:

- Тома привязаны, а контейнеры базы данных успешно запущены. Одного состояния Running у Pod недостаточно.
- `status.configured`, `status.health.available` и `status.health.fullReplication` имеют значение `true`.
- `status.generations.reconciled` достигло значения `metadata.generation`. Даже если база данных доступна, согласование состояния после замены или сокращения кластера может продолжаться.

После успешного прохождения этих проверок настройте MetaService с помощью созданного ConfigMap и убедитесь, что он подключается к FDB, прежде чем создавать таблицы. Перед промышленной эксплуатацией также проверьте состояние кластера, размещение coordinator и доступность при отказах хостов.

## Получение ConfigMap с данными для доступа к FoundationDB {#get-the-configmap-that-contains-foundationdb-access-information}

Operator создаёт `<FoundationDBCluster name>-config` в пространстве имён базы данных:

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
Несколько кластеров Doris могут совместно использовать одну FDB. При удалении отдельного кластера Doris сохраните общую FDB. Удаление ресурсов FDB или PVC может привести к потере метаданных, поэтому подготовьте план резервного копирования и восстановления.
:::

## Вариант для сборок MetaService, которым требуется FDB 7.1 {#fdb-71}

Если MetaService использует клиент версии 7.1, можно создать кластер FDB 7.1.67 на узлах amd64. Перед развёртыванием кластера FDB добавьте клиент версии 7.1 в Operator следующими командами:

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

В скопированном YAML кластера измените `spec.version`, а также `version` и `tag` в конфигурации основного образа на `7.1.67`. Образ 7.1.67 поддерживает только amd64: в кластерах с узлами разных архитектур задайте `nodeSelector: {kubernetes.io/arch: amd64}` для контроллера и каждого шаблона Pod базы данных. Используйте эту конфигурацию для создания нового кластера, совместимого с вашим MetaService; она не предназначена для понижения версии существующего кластера FDB.

## Частные реестры и устранение неполадок {#private-registries-and-troubleshooting}

Если из вашей среды нет доступа к Docker Hub, скопируйте необходимые образы в частный реестр и обновите файлы развёртывания:

- Operator и инициализатор: измените `image`.
- Кластер FDB: измените `mainContainer.imageConfigs[].baseImage`, сохранив соответствие версии FDB внутри образа значению `spec.version`. В режиме unified основной контейнер и sidecar используют один образ.
- Если для доступа к реестру требуется аутентификация, настройте `imagePullSecrets` в шаблонах Pod как для Operator, так и для FDB.

Включите все используемые образы инициализаторов клиентов и выберите платформы, соответствующие вашим узлам. Распространённые проблемы при развёртывании и способы их проверки перечислены ниже:

| Признак | Что проверить |
| --- | --- |
| Ошибка инициализации контроллера / образ не запускается | Доступ к зеркалу образов, тег, архитектуру узла; необязательный инициализатор версии 7.1 поддерживает только amd64 |
| PVC или Pod в состоянии Pending | StorageClass, выделение ресурсов CSI, ёмкость, запросы ресурсов, селекторы узлов и антисвязанность |
| `File could not be written` | Владельца тома, UID/GID/fsGroup и обработку прав доступа драйвером CSI |
| Состояние FDB не согласовано | Пространство имён, за которым наблюдает контроллер, и RBAC, события, журналы контроллера, ресурсы для замены и ход восстановления |
| FDB доступна, но MS не может подключиться | Совместимость клиента MetaService, созданные данные для подключения, DNS и сеть Pod |

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get events --sort-by=.metadata.creationTimestamp
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system logs \
  deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

Во время устранения неполадок сохраняйте общие CRD, кластеры FDB и PVC, чтобы защитить данные существующих кластеров.
