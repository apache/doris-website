---
{
    "title": "Развертывание полноценного кластера Doris с разделением вычислений и хранения",
    "language": "ru",
    "description": "Пошаговое руководство по созданию с нуля работающего кластера Doris с разделением вычислений и хранения в Kubernetes: развертывание FoundationDB, развертывание Doris Operator, развертывание кластера Doris и создание Storage Vault.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "deploy cluster", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

Этот документ предназначен для пользователей, которые впервые настраивают кластер Doris с разделением вычислений и хранения в Kubernetes. Он охватывает весь процесс: от развертывания с нуля до возможности записывать данные. Изучив этот документ, вы сможете:

- Развернуть FoundationDB (хранилище метаданных) или подключиться к существующему кластеру
- Развернуть Doris Operator в Kubernetes
- Развернуть полноценный кластер с разделением вычислений и хранения с помощью Doris Operator
- Создать объектное хранилище для долговременного хранения данных (Storage Vault) с помощью SQL

## Результат развертывания {#deployment-outcome}

После выполнения этого руководства вы получите кластер Doris с разделением вычислений и хранения, состоящий из следующих компонентов:

| Компонент | Описание | Количество реплик по умолчанию |
|------|------|-----------|
| FE | Разбор SQL и координация | 1 |
| MS (MetaService) | Управление метаданными | 1 |
| Compute Group (CG) | Прием и кэширование данных | 2 |
| FoundationDB | Хранение метаданных | - |
| Storage Vault | Объектное хранилище, совместимое с S3 | - |

## Обзор процесса развертывания {#deployment-path-overview}

Весь процесс состоит из 5 последовательных шагов. Необходимые исходные данные и результат каждого шага приведены ниже:

| Шаг | Цель этапа | Исходные данные | Результат |
|------|----------|------|------|
| Шаг 1 | Развернуть FoundationDB | Кластер K8s / доступные машины | Работающий кластер FDB и сведения для доступа |
| Шаг 2 | Развернуть Doris Operator | Доступ к кластеру K8s | Работающий Operator и CRD |
| Шаг 3 | Развернуть кластер Doris с разделением вычислений и хранения | `ddc-sample.yaml` и сведения для доступа к FDB | Работающий кластер с разделением вычислений и хранения |
| Шаг 4 | Создать удаленное хранилище | Работающий кластер и учетные данные объектного хранилища, совместимого с S3 | Storage Vault, доступное для долговременного хранения данных |
| Шаг 5 | Подключиться к кластеру и выполнить сквозную проверку | Соединение MySQL, установленное на шаге 4 | Работающий кластер, проверенный чтением и записью |

После шага 4 кластер готов принимать данные для записи. На шаге 5 выполняется сквозная проверка с помощью SQL. Дополнительные настройки FE / MS / Compute Group описаны в разделе [Расширенная настройка](#advanced-configuration) в конце этого документа.

## Шаг 1: разверните FoundationDB {#step-1-deploy-foundationdb}

Кластер с разделением вычислений и хранения использует FoundationDB (FDB) для хранения метаданных. Перед развертыванием необходимо подготовить работающий кластер FDB. Выберите способ развертывания с учетом имеющейся инфраструктуры:

| Способ развертывания | Когда подходит | Дальнейшие действия |
|----------|----------|----------|
| Развертывание непосредственно на машинах (рекомендуется) | Есть доступные физические или виртуальные машины | Выполните развертывание по инструкции [Разделение вычислений и хранения: подготовка к развертыванию](../../deploy-manually/separating-storage-compute-deploy-manually). Убедитесь, что машины для развертывания и кластер K8s находятся в одной локальной сети |
| Развертывание в Kubernetes | Требуется централизованно управлять FDB в K8s | Выполните инструкции из раздела «Быстрое развертывание в K8s» ниже |

### Быстрое развертывание в K8s (самый простой способ) {#k8s-quick-deployment-simplest-path}

Последовательно выполните следующие 4 шага, чтобы запустить минимальный кластер FDB (с одной репликой) в K8s:

**1. Примените CRD FoundationDB:**

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

**2. Разверните fdb-kubernetes-operator:**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
```

**3. Разверните кластер FoundationDB (в минимальной конфигурации с одной репликой):**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml
```

**4. Проверьте состояние FDB:**

```shell
kubectl get fdb
```

Если значение в столбце `AVAILABLE` в выводе команды `kubectl get fdb` равно `true`, кластер FDB готов к работе.

:::tip Дополнительные варианты
Режим с одной репликой подходит только для разработки и тестирования. Для промышленной эксплуатации рекомендуется режим с двумя репликами, при этом кластер Kubernetes должен включать как минимум три хост-машины. Другие варианты развертывания (с двумя репликами, для промышленной эксплуатации, с образами из частного репозитория, в режиме FQDN и т. д.) описаны в разделе [Развертывание FoundationDB](install-fdb.md).
:::

## Шаг 2: разверните Doris Operator {#step-2-deploy-doris-operator}

**Исходные данные**: доступ к кластеру Kubernetes
**Действие**: примените определения ресурсов CRD, разверните Operator и правила RBAC
**Результат**: Doris Operator, работающий в пространстве имен `doris`

### 1. Примените определения ресурсов CRD {#1-apply-crd-resource-definitions}

Выберите команду в зависимости от текущего состояния кластера:

- **Сценарий A: первое развертывание (или развертывание только кластера с разделением вычислений и хранения)**: примените все CRD:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **Сценарий B: кластер без разделения вычислений и хранения уже развернут**: добавьте только CRD, относящиеся к разделению вычислений и хранения:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Разверните Operator и правила RBAC {#2-deploy-the-operator-and-rbac-rules}

Выполните следующую команду, чтобы развернуть Doris Operator и необходимые ему правила RBAC:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

После развертывания проверьте состояние Pod оператора:

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

Значение `STATUS`, равное `Running`, означает, что Operator готов к работе.

## Шаг 3: разверните кластер с разделением вычислений и хранения {#step-3-deploy-the-compute-storage-decoupled-cluster}

**Исходные данные**: пример развертывания `ddc-sample.yaml` и сведения для доступа к FoundationDB
**Действие**: скачайте пример, измените необходимые ключевые поля и разверните кластер
**Результат**: работающий кластер Doris с разделением вычислений и хранения

### 1. Скачайте пример развертывания {#1-download-the-deployment-example}

Скачайте стандартный пример развертывания из репозитория Doris Operator:

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. Измените ключевые параметры {#2-modify-key-configurations}

После скачивания примера перед развертыванием необходимо изменить как минимум следующие две категории полей. Для всех остальных полей оставьте значения по умолчанию:

| Поле | Обязательность | Описание |
|------|-------------|------|
| `spec.metaService.fdb` | **Обязательно** | Сведения для доступа к FDB, развернутому на шаге 1 (выберите адрес или ConfigMap) |
| `spec.computeGroups[].image` | **Обязательно** | Версия образа BE. Должна соответствовать требуемой версии Doris |
| `spec.metaService.image` | Необязательно | Версия образа MetaService. По умолчанию используется версия из примера |
| `spec.feSpec.electionNumber` | Необязательно | Количество FE в роли Follower. По умолчанию 1; **после развертывания изменить нельзя** |
| `spec.computeGroups[].replicas` | Необязательно | Количество реплик в Compute Group. По умолчанию используется значение из примера |
| `spec.feSpec.requests` / `limits` | Необязательно | Ограничения вычислительных ресурсов FE (рекомендуются для промышленных сред) |

После изменений раздел `spec` будет выглядеть примерно так (**способ A: FDB развернут на машинах**):

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

**Способ B: FDB развернут в K8s**: замените раздел `metaService.fdb` следующим содержимым:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

Чтобы получить ConfigMap, выполните `kubectl get configmap` (подробнее см. [Развертывание FoundationDB: получение ConfigMap со сведениями для доступа](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)).

Описание параметров:

| Параметр | Описание |
|------|------|
| `${fdbEndpoint}` | Адрес для клиентского доступа к FoundationDB. При стандартном развертывании на виртуальной машине Linux он хранится в `/etc/foundationdb/fdb.cluster`. Подробнее см. [документацию по файлу кластера FoundationDB](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) |
| `${beImage}` | Образ BE. Используйте образы из [официального репозитория образов Apache Doris](https://hub.docker.com/r/apache/doris) |
| `${foundationdbConfigMapName}` | Имя ConfigMap, созданного `fdb-kubernetes-operator` |
| `${namespace}` | Пространство имен, в котором находится ConfigMap |

### 3. Разверните и проверьте кластер {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

После применения ресурсов дождитесь автоматического создания кластера. Проверьте его состояние следующей командой:

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**Критерии готовности:** значение `CLUSTERHEALTH` равно `green`, а `CGAVAILABLECOUNT` равно `CGCOUNT`.

## Шаг 4: создайте удаленное хранилище {#step-4-create-the-remote-storage-backend}

**Исходные данные**: работающий кластер Doris и учетные данные объектного хранилища, совместимого с S3
**Действие**: выполните SQL через клиент MySQL, чтобы создать и включить Vault
**Результат**: настроенное хранилище, которое можно использовать для долговременного хранения данных

После успешного запуска кластера необходимо с помощью SQL зарегистрировать объектное хранилище для долговременного хранения данных (в Doris оно называется Vault) и назначить его Vault по умолчанию. Это позволит сохранять записываемые данные.

### 1. Получите адрес для доступа к Service FE {#1-get-the-access-address-of-the-fe-service}

Выполните следующую команду, чтобы найти Service, через который можно получить доступ к FE:

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

Для внешнего доступа используются Service без суффикса `-internal`.

### 2. Подключитесь через клиент MySQL {#2-connect-through-a-mysql-client}

Запустите в кластере Kubernetes временный Pod с клиентом MySQL и войдите в него:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Внутри Pod подключитесь к кластеру Doris, используя имя Service FE:

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

Способы создания других хранилищ и подробное описание каждого поля приведены в разделе [Управление Storage Vault](../../deploy-manually/separating-storage-compute-deploy-manually) документации по разделению вычислений и хранения.

### 4. Назначьте Storage Vault по умолчанию {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

Здесь `${vaultName}` обозначает имя Vault, которое вы хотите использовать (например, `s3_vault` из предыдущего шага).

Теперь кластер готов принимать данные для записи. Следующий шаг — сквозная проверка с помощью SQL.

## Шаг 5: подключитесь к кластеру и выполните сквозную проверку {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**Исходные данные**: соединение MySQL, установленное на шаге 4
**Действие**: выполните проверочные SQL-команды, чтобы убедиться, что кластер готов к работе и корректно выполняет чтение и запись
**Результат**: работающий кластер, прошедший сквозную проверку

Используя соединение клиента MySQL, установленное на шаге 4 (если вы уже вышли, повторите действия из раздела [Шаг 4: подключение через клиент MySQL](#2-connect-through-a-mysql-client)), последовательно выполните следующие команды для проверки.

### 1. Убедитесь, что узлы BE работают {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

Значение в столбце `Alive` для каждого узла BE в выводе равно `true`. Это означает, что узлы BE в Compute Group готовы к работе и распознаны FE.

### 2. Убедитесь, что Storage Vault используется {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

В выводе должно отображаться Vault, созданное на шаге 4 (например, `s3_vault`), со значением `IsDefault`, равным `true`. Это означает, что хранилище готово к работе.

### 3. Запишите тестовые данные и выполните запрос {#3-write-and-query-test-data}

Последовательно выполните следующие SQL-команды, чтобы пройти весь путь: «создание базы данных, создание таблицы, запись, запрос»:

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

Если `SELECT` возвращает записанные данные, вся цепочка от FE через MetaService и Compute Group до Storage Vault работает, и кластер готов к использованию.

## Расширенная настройка {#advanced-configuration}

После выполнения 5 шагов выше кластер готов к использованию. Для промышленной эксплуатации обычно требуются дополнительные настройки. Нужную документацию можно найти в следующей таблице:

| Тема | Документация | Основное содержание |
|--------|----------|----------|
| Подробности развертывания FoundationDB, режим с двумя репликами / режим для промышленной эксплуатации, развертывание с FQDN, частный репозиторий образов | [Развертывание FoundationDB](install-fdb.md) | Принципы работы и все варианты развертывания FDB |
| Смена образа MetaService, настройка ресурсов и параметров запуска, изменение тайм-аута liveness probe | [Настройка MetaService](config-ms.md) | Все поля в `spec.metaService.*` |
| Настройка ресурсов FE, изменение количества узлов Follower, настройка параметров запуска, режима доступа (NodePort / LoadBalancer) и постоянного хранилища | [Настройка FE](config-fe.md) | Все поля в `spec.feSpec.*` |
| Одна или несколько Compute Group, ограничения ресурсов, настройка режима доступа, постоянное хранение кэша и журналов | [Настройка Compute Group](config-cg.md) | Все поля в `spec.computeGroups[*]` |
| Настройка паролей root и других пользователей с правами администратора, учетные данные в Secret, монтирование файлов аутентификации Kerberos | [Настройка аутентификации](config-cluster.md) | Учетные данные уровня кластера и Kerberos |
