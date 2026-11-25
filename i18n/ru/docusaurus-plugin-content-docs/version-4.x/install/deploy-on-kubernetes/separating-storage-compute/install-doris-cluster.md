---
{
    "title": "Развёртывание полноценного кластера Doris с разделением вычислений и хранения",
    "language": "ru",
    "description": "Пошаговое руководство по развёртыванию с нуля работающего кластера Doris с разделением вычислений и хранения в Kubernetes: развёртывание FoundationDB, Doris Operator и кластера Doris, создание Storage Vault.",
    "keywords": ["Doris", "разделение вычислений и хранения", "Kubernetes", "развёртывание кластера", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

Это руководство предназначено для тех, кто впервые развёртывает кластер Doris с разделением вычислений и хранения в Kubernetes. Оно охватывает весь процесс: от начального развёртывания до записи данных. Прочитав его, вы сможете:

- Развернуть FoundationDB (хранилище метаданных) или подключиться к существующему кластеру
- Развернуть Doris Operator в Kubernetes
- Развернуть полноценный кластер с разделением вычислений и хранения с помощью Doris Operator
- Создать через SQL объектное хранилище (Storage Vault)

## Результат развёртывания {#deployment-outcome}

После выполнения этого руководства у вас будет кластер Doris с разделением вычислений и хранения, состоящий из следующих компонентов:

| Компонент | Назначение | Число реплик по умолчанию |
|------|------|-----------|
| FE | Разбор SQL и координация работы | 1 |
| MS (MetaService) | Управление метаданными | 1 |
| Вычислительная группа (CG) | Загрузка данных и кэширование | 2 |
| FoundationDB | Хранение метаданных | - |
| Storage Vault | S3-совместимое объектное хранилище | - |

## Обзор этапов развёртывания {#deployment-path-overview}

Весь процесс состоит из 5 последовательных шагов. Для каждого шага указаны входные данные и результат:

| Шаг | Цель | Входные данные | Результат |
|------|----------|------|------|
| Шаг 1 | Развернуть FoundationDB | Кластер K8s / доступные машины | Работающий кластер FDB и данные для подключения |
| Шаг 2 | Развернуть Doris Operator | Доступ к кластеру K8s | Работающий Operator и CRD |
| Шаг 3 | Развернуть кластер Doris с разделением вычислений и хранения | `ddc-sample.yaml` и данные для подключения к FDB | Работающий кластер с разделением вычислений и хранения |
| Шаг 4 | Создать удалённое хранилище | Работающий кластер и учётные данные S3-совместимого объектного хранилища | Storage Vault для постоянного хранения данных |
| Шаг 5 | Подключиться к кластеру и проверить всю цепочку | Подключение MySQL, установленное на шаге 4 | Работа кластера подтверждена чтением и записью |

После шага 4 кластер готов принимать данные на запись. На шаге 5 с помощью SQL проверяется работа всей цепочки. Дополнительные настройки FE / MS / вычислительных групп описаны в разделе [Дополнительные настройки](#advanced-configuration) в конце документа.

## Шаг 1: развёртывание FoundationDB {#step-1-deploy-foundationdb}

Кластер с разделением вычислений и хранения использует FoundationDB (FDB) для хранения метаданных. До развёртывания кластера Doris необходимо подготовить работающий кластер FDB. Выберите способ развёртывания в зависимости от имеющейся инфраструктуры:

| Способ развёртывания | Когда подходит | Дальнейшие действия |
|----------|----------|----------|
| Непосредственно на машинах (рекомендуется) | Есть доступные физические или виртуальные машины | Разверните FDB по руководству [Подготовка к развёртыванию с разделением вычислений и хранения](../../deploy-manually/separating-storage-compute-deploy-manually). Убедитесь, что машины с FDB и кластер K8s находятся в одной локальной сети |
| В Kubernetes | Нужно управлять FDB средствами K8s | Выполните инструкции из раздела «Быстрое развёртывание в K8s» ниже |

### Быстрое развёртывание в K8s (для разработки) {#k8s-quick-deployment-development}

Установите CRD закреплённой версии, FDB Operator, правила Monitor RBAC и **конфигурацию для разработки с одной репликой** по руководству [Развёртывание FoundationDB](install-fdb.md). В краткой инструкции и полном руководстве используются одни и те же ресурсы определённых версий; не смешивайте старые YAML-файлы развёртывания с новыми CRD.

1. Проверьте совместимость клиента MetaService: используйте конфигурацию 7.3.69 только с совместимым клиентом либо следуйте [варианту для 7.1](install-fdb.md#fdb-71) из руководства.
2. Выберите SSD StorageClass и изучите [планирование ресурсов](install-fdb.md#resource-planning): конфигурация с одной репликой запрашивает 4.4 CPU / 5Gi с учётом вспомогательных контейнеров и 20Gi для PVC. Она не предназначена для эксплуатации в рабочей среде.
3. Выполните описанные в руководстве проверки установки, доступности, полного дублирования данных и согласования состояния. Затем запишите имя созданного ConfigMap `fdb-single-config` в пространстве имён `fdb-system`: оно понадобится на шаге 3 ниже. Также проверьте фактическое подключение MetaService.

Для начальной конфигурации с двумя репликами в руководстве предусмотрен отдельный вариант, запрашивающий 17.6 CPU / 132Gi с учётом вспомогательных контейнеров и 1000Gi для PVC. Ресурсы Operator и Doris в эти значения не входят. Перед использованием в рабочей среде спланируйте независимые домены отказа хостов, ресурсы для нагрузки и резерв для замены узлов.

## Шаг 2: развёртывание Doris Operator {#step-2-deploy-doris-operator}

**Входные данные**: доступ к кластеру Kubernetes
**Действие**: применить определения ресурсов CRD, развернуть Operator и правила RBAC
**Результат**: Doris Operator работает в пространстве имён `doris`

### 1. Примените определения ресурсов CRD {#1-apply-crd-resource-definitions}

Выберите команду в зависимости от текущего состояния кластера:

- **Сценарий A: первое развёртывание (или развёртывание только кластера с разделением вычислений и хранения)**: примените все CRD:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **Сценарий B: кластер без разделения вычислений и хранения уже развёрнут**: добавьте только CRD, относящиеся к разделению вычислений и хранения:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Разверните Operator и правила RBAC {#2-deploy-the-operator-and-rbac-rules}

Выполните следующую команду, чтобы развернуть Doris Operator и необходимые ему правила RBAC:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

После развёртывания проверьте состояние Pod с Operator:

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

Значение `Running` в столбце `STATUS` означает, что Operator готов к работе.

## Шаг 3: развёртывание кластера с разделением вычислений и хранения {#step-3-deploy-the-compute-storage-decoupled-cluster}

**Входные данные**: пример конфигурации `ddc-sample.yaml` и данные для подключения к FoundationDB
**Действие**: скачать пример, при необходимости изменить ключевые поля и развернуть кластер
**Результат**: работающий кластер Doris с разделением вычислений и хранения

### 1. Скачайте пример конфигурации {#1-download-the-deployment-example}

Скачайте пример конфигурации по умолчанию из репозитория Doris Operator:

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. Измените ключевые настройки {#2-modify-key-configurations}

После скачивания примера перед развёртыванием необходимо изменить как минимум две следующие категории полей. Для остальных полей оставьте значения по умолчанию:

| Поле | Обязательно / необязательно | Описание |
|------|-------------|------|
| `spec.metaService.fdb` | **Обязательно** | Данные для подключения к FDB, развёрнутой на шаге 1 (укажите адрес или ConfigMap) |
| `spec.computeGroups[].image` | **Обязательно** | Версия образа BE. Должна соответствовать нужной вам версии Doris |
| `spec.metaService.image` | Необязательно | Версия образа MetaService. По умолчанию используется версия из примера |
| `spec.feSpec.electionNumber` | Необязательно | Число FE Followers. По умолчанию — 1; **после развёртывания изменить нельзя** |
| `spec.computeGroups[].replicas` | Необязательно | Число реплик в вычислительной группе. По умолчанию берётся значение из примера |
| `spec.feSpec.requests` / `limits` | Необязательно | Ограничения вычислительных ресурсов FE (рекомендуются для рабочей среды) |

Изменённый раздел `spec` будет выглядеть примерно так (**способ A: FDB развёрнута на машинах**):

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}      # Required: FDB client access address (machine deployment)
  feSpec:
    electionNumber: 1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
  computeGroups:
    - uniqueId: cg1
      image: ${beImage}            # Required: BE image
      replicas: 2
      requests:
        cpu: 8
        memory: 8Gi
      limits:
        cpu: 8
        memory: 8Gi
```

**Способ B: FDB развёрнута в K8s**: замените раздел `metaService.fdb` следующим содержимым:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

Чтобы найти ConfigMap, выполните `kubectl get configmap` (подробнее см. в разделе [Развёртывание FoundationDB — получение ConfigMap с данными для подключения](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)).

Описание параметров:

| Параметр | Описание |
|------|------|
| `${fdbEndpoint}` | Адрес для подключения клиента FoundationDB. При стандартном развёртывании на виртуальной машине Linux он хранится в `/etc/foundationdb/fdb.cluster`. Подробнее см. [документацию по файлу кластера FoundationDB](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) |
| `${beImage}` | Образ BE. Используйте образы из [официального репозитория образов Apache Doris](https://hub.docker.com/r/apache/doris) |
| `${foundationdbConfigMapName}` | Имя ConfigMap, созданного `fdb-kubernetes-operator` |
| `${namespace}` | Пространство имён, в котором находится ConfigMap |

### 3. Разверните кластер и проверьте его состояние {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

После применения ресурсов дождитесь автоматического развёртывания кластера. Проверьте его состояние следующей командой:

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**Критерии готовности:** `CLUSTERHEALTH` имеет значение `green`, а `CGAVAILABLECOUNT` равно `CGCOUNT`.

## Шаг 4: создание удалённого хранилища {#step-4-create-the-remote-storage-backend}

**Входные данные**: работающий кластер Doris и учётные данные S3-совместимого объектного хранилища
**Действие**: выполнить SQL через клиент MySQL, чтобы создать и включить Vault
**Результат**: настроенное хранилище для постоянного хранения данных

После успешного запуска кластера зарегистрируйте объектное хранилище через SQL как хранилище постоянных данных (в Doris оно называется Vault) и назначьте его Vault по умолчанию. Это позволит постоянно хранить записанные данные.

### 1. Получите адрес FE Service {#1-get-the-access-address-of-the-fe-service}

Выполните следующую команду, чтобы найти Service для доступа к FE:

```shell
kubectl get svc
```

Пример вывода:

```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```

Service без суффикса `-internal` используются для внешнего доступа.

### 2. Подключитесь через клиент MySQL {#2-connect-through-a-mysql-client}

Запустите в кластере Kubernetes временный Pod с клиентом MySQL и войдите в него:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Внутри Pod подключитесь к кластеру Doris по имени FE Service:

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Создайте Storage Vault {#3-create-a-storage-vault}

С помощью SQL создайте Vault на основе объектного хранилища, поддерживающего протокол S3. В следующем примере используется Alibaba Cloud OSS:

```mysql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
    PROPERTIES (
        "type"="S3",
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
        "s3.region" = "bj",
        "s3.bucket" = "bucket",
        "s3.root.path" = "big/data/prefix",
        "s3.access_key" = "your-ak",
        "s3.secret_key" = "your-sk",
        "provider" = "OSS"
    );
```

Способы создания других хранилищ и подробное описание полей приведены в разделе [Управление Storage Vault](../../deploy-manually/separating-storage-compute-deploy-manually) документации по разделению вычислений и хранения.

### 4. Назначьте Storage Vault по умолчанию {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

Здесь `${vaultName}` — имя Vault, который вы хотите использовать, например `s3_vault` из предыдущего шага.

Теперь кластер готов принимать данные на запись. На следующем шаге с помощью SQL проверяется работа всей цепочки.

## Шаг 5: подключение к кластеру и проверка всей цепочки {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**Входные данные**: подключение MySQL, установленное на шаге 4
**Действие**: выполнить проверочные SQL-запросы и убедиться, что кластер готов к работе и нормально читает и записывает данные
**Результат**: работающий кластер, успешно прошедший проверку всей цепочки

Продолжая работу в клиенте MySQL, подключённом на шаге 4 (если вы уже вышли, повторите [шаг 4 — подключение через клиент MySQL](#2-connect-through-a-mysql-client)), последовательно выполните следующие команды.

### 1. Убедитесь, что узлы BE работают {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

В выводе столбец `Alive` для каждого узла BE должен иметь значение `true`. Это означает, что узлы BE в вычислительной группе готовы к работе и распознаны FE.

### 2. Убедитесь, что Storage Vault действует {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

В выводе должен присутствовать Vault, созданный на шаге 4 (например, `s3_vault`), а значение его поля `IsDefault` должно быть `true`. Это означает, что хранилище готово к работе.

### 3. Запишите и запросите тестовые данные {#3-write-and-query-test-data}

Выполните следующий SQL, чтобы пройти всю цепочку: «создать базу данных, создать таблицу, записать данные, выполнить запрос»:

```mysql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE IF NOT EXISTS hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO hello VALUES (1, 'hello doris');
SELECT * FROM hello;
```

Если `SELECT` возвращает записанные данные, значит вся цепочка от FE через MetaService и вычислительную группу до Storage Vault работает, а кластер готов к использованию.

## Дополнительные настройки {#advanced-configuration}

После выполнения всех 5 шагов кластер готов к использованию. В рабочей среде обычно требуются дополнительные настройки. Соответствующие руководства перечислены ниже:

| Тема | Руководство | Основное содержание |
|--------|----------|----------|
| Подробности развёртывания FoundationDB, режим с двумя репликами / для рабочей среды, развёртывание с FQDN, частный репозиторий образов | [Развёртывание FoundationDB](install-fdb.md) | Принципы работы и все варианты развёртывания FDB |
| Смена образа MetaService, настройка ресурсов, параметров запуска и времени ожидания проверки работоспособности | [Настройка MetaService](config-ms.md) | Все поля `spec.metaService.*` |
| Настройка ресурсов FE, изменение числа Followers, настройка запуска, режима доступа (NodePort / LoadBalancer) и постоянного хранилища | [Настройка FE](config-fe.md) | Все поля `spec.feSpec.*` |
| Вычислительные группы с одной или несколькими группами, ограничения ресурсов, настройка режима доступа, постоянное хранение кэша и журналов | [Настройка вычислительной группы](config-cg.md) | Все поля `spec.computeGroups[*]` |
| Установка паролей для root и других пользователей с правами администратора, учётные данные Secret, монтирование файлов аутентификации Kerberos | [Настройка аутентификации](config-cluster.md) | Учётные данные на уровне кластера и Kerberos |
| Масштабирование узлов BE, добавление и удаление вычислительных групп, проверка уменьшения числа узлов и очистки PVC | [Масштабирование вычислительных ресурсов](config-cg.md#scaling-compute-groups) | Порядок действий, вывод узлов из эксплуатации и проверка результата |
