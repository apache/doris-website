---
{
    "title": "Развёртывание полного кластера Doris с разделением вычислений и хранения",
    "language": "ru",
    "description": "Пошаговое руководство по развёртыванию с нуля рабочего кластера Doris с разделением вычислений и хранения в Kubernetes: развёртывание FoundationDB, Doris Operator и кластера Doris, а также создание Storage Vault.",
    "keywords": ["Doris", "разделение вычислений и хранения", "Kubernetes", "развёртывание кластера", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

Этот документ предназначен для тех, кто впервые развёртывает в Kubernetes кластер Doris с разделением вычислений и хранения. Руководство охватывает весь путь от развёртывания с нуля до записи данных. Прочитав его, вы сможете:

- Развернуть FoundationDB (хранилище метаданных) или подключиться к существующему кластеру
- Развернуть Doris Operator в Kubernetes
- Развернуть полный кластер с разделением вычислений и хранения с помощью Doris Operator
- Создать серверную часть объектного хранилища (Storage Vault) с помощью SQL

## Результат развёртывания {#deployment-outcome}

После выполнения этого руководства у вас будет кластер Doris с разделением вычислений и хранения, состоящий из следующих компонентов:

| Компонент | Описание | Число реплик по умолчанию |
|------|------|-----------|
| FE | Разбор SQL и координация работы | 1 |
| MS (MetaService) | Управление метаданными | 1 |
| Вычислительная группа (CG) | Загрузка данных и кеширование | 2 |
| FoundationDB | Хранение метаданных | - |
| Storage Vault | Объектное хранилище, совместимое с S3 | - |

## Обзор порядка развёртывания {#deployment-path-overview}

Весь процесс состоит из 5 последовательных шагов. Входные данные и результат каждого шага указаны ниже:

| Шаг | Цель | Входные данные | Результат |
|------|----------|------|------|
| Шаг 1 | Развернуть FoundationDB | Кластер K8s / доступные машины | Работающий кластер FDB и данные для подключения |
| Шаг 2 | Развернуть Doris Operator | Доступ к кластеру K8s | Работающий Operator и CRD |
| Шаг 3 | Развернуть кластер Doris с разделением вычислений и хранения | `ddc-sample.yaml` и данные для подключения к FDB | Работающий кластер с разделением вычислений и хранения |
| Шаг 4 | Создать удалённую серверную часть хранилища | Работающий кластер и учётные данные объектного хранилища, совместимого с S3 | Storage Vault, доступный для постоянного хранения данных |
| Шаг 5 | Подключиться к кластеру и выполнить сквозную проверку | Подключение MySQL, установленное на шаге 4 | Работоспособность кластера подтверждена чтением и записью |

После шага 4 кластер готов принимать записи. На шаге 5 выполняется сквозная проверка с помощью SQL. Дополнительные настройки FE / MS / вычислительной группы описаны в разделе [Дополнительные настройки](#advanced-configuration) в конце документа.

## Шаг 1. Развёртывание FoundationDB {#step-1-deploy-foundationdb}

Кластер с разделением вычислений и хранения использует FoundationDB (FDB) для хранения метаданных. До развёртывания кластера необходимо подготовить работающий FDB. Выберите способ развёртывания с учётом имеющейся инфраструктуры:

| Способ развёртывания | Когда подходит | Дальнейшие действия |
|----------|----------|----------|
| Непосредственно на машинах (рекомендуется) | Уже есть доступные физические или виртуальные машины | Разверните FDB по инструкции [Подготовка к развёртыванию кластера с разделением вычислений и хранения](../../deploy-manually/separating-storage-compute-deploy-manually). Убедитесь, что машины с FDB и кластер K8s находятся в одной локальной сети |
| В Kubernetes | Нужно централизованно управлять FDB в K8s | Выполните приведённые ниже действия из раздела «Быстрое развёртывание в K8s» |

### Быстрое развёртывание в K8s (самый простой вариант) {#k8s-quick-deployment-simplest-path}

Чтобы запустить минимальный кластер FDB (с одной репликой) в K8s, последовательно выполните следующие 4 действия:

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

**3. Разверните кластер FoundationDB (минимальная конфигурация с одной репликой):**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml
```

**4. Проверьте состояние FDB:**

```shell
kubectl get fdb
```

Когда в выводе `kubectl get fdb` значение столбца `AVAILABLE` станет `true`, кластер FDB будет готов к работе.

:::tip Дополнительные варианты
Конфигурация с одной репликой подходит только для разработки и тестирования. Для рабочей среды рекомендуется конфигурация с двумя репликами; при этом в кластере Kubernetes должно быть не менее трёх хостов. Другие варианты развёртывания (две реплики, рабочая среда, образы из частного репозитория, режим FQDN и т. д.) описаны в разделе [Развёртывание FoundationDB](install-fdb.md).
:::

## Шаг 2. Развёртывание Doris Operator {#step-2-deploy-doris-operator}

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

## Шаг 3. Развёртывание кластера с разделением вычислений и хранения {#step-3-deploy-the-compute-storage-decoupled-cluster}

**Входные данные**: пример конфигурации `ddc-sample.yaml` и данные для подключения к FoundationDB
**Действие**: скачать пример, при необходимости изменить ключевые поля и развернуть кластер
**Результат**: работающий кластер Doris с разделением вычислений и хранения

### 1. Скачайте пример конфигурации {#1-download-the-deployment-example}

Скачайте пример конфигурации по умолчанию из репозитория Doris Operator:

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. Измените ключевые параметры {#2-modify-key-configurations}

После скачивания примера перед развёртыванием необходимо изменить как минимум следующие две категории полей. Для остальных полей оставьте значения по умолчанию:

| Поле | Обязательное / необязательное | Описание |
|------|-------------|------|
| `spec.metaService.fdb` | **Обязательное** | Данные для подключения к FDB, развёрнутому на шаге 1 (укажите адрес или ConfigMap) |
| `spec.computeGroups[].image` | **Обязательное** | Версия образа BE. Должна соответствовать нужной вам версии Doris |
| `spec.metaService.image` | Необязательное | Версия образа MetaService. По умолчанию используется версия из примера |
| `spec.feSpec.electionNumber` | Необязательное | Число FE Follower. По умолчанию — 1; **после развёртывания изменить нельзя** |
| `spec.computeGroups[].replicas` | Необязательное | Число реплик в вычислительной группе. По умолчанию используется значение из примера |
| `spec.feSpec.requests` / `limits` | Необязательное | Запрашиваемые ресурсы и ограничения для FE (рекомендуется задать в рабочей среде) |

Изменённый раздел `spec` будет выглядеть примерно так (**способ A: FDB развёрнут на машинах**):

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

**Способ B: FDB развёрнут в K8s**: замените раздел `metaService.fdb` следующим содержимым:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

Чтобы найти ConfigMap, выполните `kubectl get configmap` (подробнее см. [Развёртывание FoundationDB — получение ConfigMap с данными для подключения](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)).

Описание параметров:

| Параметр | Описание |
|------|------|
| `${fdbEndpoint}` | Адрес для подключения клиента FoundationDB. При развёртывании на виртуальной машине Linux с настройками по умолчанию он хранится в `/etc/foundationdb/fdb.cluster`. Подробнее см. [документацию по файлу кластера FoundationDB](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) |
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

**Критерии готовности:** значение `CLUSTERHEALTH` — `green`, а `CGAVAILABLECOUNT` равно `CGCOUNT`.

## Шаг 4. Создание удалённой серверной части хранилища {#step-4-create-the-remote-storage-backend}

**Входные данные**: работающий кластер Doris и учётные данные объектного хранилища, совместимого с S3
**Действие**: выполнить SQL через клиент MySQL, чтобы создать и включить Vault
**Результат**: настроенная серверная часть хранилища для постоянного хранения данных

После успешного запуска кластера зарегистрируйте объектное хранилище через SQL как серверную часть для постоянного хранения данных (в Doris она называется Vault) и назначьте его Vault по умолчанию. Это позволит сохранять записанные данные.

### 1. Получите адрес службы FE {#1-get-the-access-address-of-the-fe-service}

Выполните следующую команду, чтобы найти Service, через который доступен FE:

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

Внутри Pod подключитесь к кластеру Doris по имени FE Service:

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Создайте Storage Vault {#3-create-a-storage-vault}

С помощью SQL создайте Vault для объектного хранилища, поддерживающего протокол S3. В следующем примере используется Alibaba Cloud OSS:

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

Способы создания других серверных частей хранилища и подробное описание полей приведены в разделе [Управление Storage Vault](../../deploy-manually/separating-storage-compute-deploy-manually) документации по разделению вычислений и хранения.

### 4. Назначьте Storage Vault по умолчанию {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

Здесь `${vaultName}` — имя Vault, которое вы хотите использовать (например, `s3_vault` из предыдущего шага).

Теперь кластер готов принимать записи. На следующем шаге выполните сквозную проверку с помощью SQL.

## Шаг 5. Подключение к кластеру и сквозная проверка {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**Входные данные**: подключение MySQL, установленное на шаге 4
**Действие**: выполнить проверочные SQL-запросы и убедиться, что кластер готов и нормально читает и записывает данные
**Результат**: работоспособность кластера подтверждена сквозной проверкой

Используя подключение клиента MySQL, установленное на шаге 4 (если вы уже вышли из клиента, повторите действия из раздела [Шаг 4 — подключение через клиент MySQL](#2-connect-through-a-mysql-client)), последовательно выполните следующие команды для проверки.

### 1. Убедитесь, что узлы BE работают {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

В выводе значение столбца `Alive` для каждого узла BE должно быть `true`. Это означает, что узлы BE вычислительной группы готовы к работе и распознаны FE.

### 2. Убедитесь, что Storage Vault действует {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

В выводе должен присутствовать Vault, созданный на шаге 4 (например, `s3_vault`), а значение его столбца `IsDefault` должно быть `true`. Это означает, что серверная часть хранилища готова к работе.

### 3. Запишите и запросите тестовые данные {#3-write-and-query-test-data}

Последовательно выполните следующие SQL-команды, чтобы проверить всю цепочку: «создать базу данных, создать таблицу, записать данные, выполнить запрос»:

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

Если `SELECT` возвращает записанные данные, значит, вся цепочка от FE через MetaService и вычислительную группу до Storage Vault работает, а кластер готов к использованию.

## Дополнительные настройки {#advanced-configuration}

После выполнения описанных выше 5 шагов кластер готов к использованию. В рабочей среде обычно требуется дополнительная настройка. Нужные инструкции можно найти в следующей таблице:

| Тема | Документ | Основное содержание |
|--------|----------|----------|
| Подробности развёртывания FoundationDB, режим с двумя репликами и конфигурация для рабочей среды, развёртывание с FQDN, частный репозиторий образов | [Развёртывание FoundationDB](install-fdb.md) | Принципы работы и все варианты развёртывания FDB |
| Смена образа MetaService, настройка ресурсов, параметров запуска и времени ожидания проверки работоспособности | [Настройка MetaService](config-ms.md) | Все поля раздела `spec.metaService.*` |
| Настройка ресурсов FE, изменение числа Follower, настройка запуска, режима доступа (NodePort / LoadBalancer) и постоянного хранилища | [Настройка FE](config-fe.md) | Все поля раздела `spec.feSpec.*` |
| Одна или несколько вычислительных групп, ограничения ресурсов, режим доступа, постоянное хранение кеша и журналов | [Настройка вычислительной группы](config-cg.md) | Все поля раздела `spec.computeGroups[*]` |
| Установка паролей для root и других пользователей с правами администратора, учётные данные Secret, монтирование файлов аутентификации Kerberos | [Настройка аутентификации](config-cluster.md) | Учётные данные уровня кластера и Kerberos |
| Масштабирование узлов BE, добавление и удаление вычислительных групп, проверка уменьшения числа узлов и очистки PVC | [Масштабирование вычислительных ресурсов](config-cg.md#scaling-compute-groups) | Порядок действий, вывод узлов из эксплуатации и проверка результата |
