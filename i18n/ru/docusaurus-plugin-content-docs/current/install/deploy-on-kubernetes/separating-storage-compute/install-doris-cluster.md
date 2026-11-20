---
{
    "title": "Развертывание полноценного кластера Doris с разделением вычислений и хранения",
    "language": "ru",
    "description": "Пошаговое руководство по развертыванию с нуля работающего кластера Doris с разделением вычислений и хранения в Kubernetes: развертывание FoundationDB, Doris Operator и кластера Doris, а также создание Storage Vault.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "deploy cluster", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

Этот документ предназначен для тех, кто впервые развертывает в Kubernetes кластер Doris с разделением вычислений и хранения. Он проводит вас через весь процесс: от развертывания с нуля до записи данных. После прочтения вы сможете:

- Развернуть FoundationDB (хранилище метаданных) или подключиться к существующему кластеру FoundationDB
- Развернуть Doris Operator в Kubernetes
- Развернуть полноценный кластер с разделением вычислений и хранения с помощью Doris Operator
- Создать через SQL серверную часть объектного хранилища (Storage Vault)

## Результат развертывания {#deployment-outcome}

После выполнения этого руководства у вас будет кластер Doris с разделением вычислений и хранения, состоящий из следующих компонентов:

| Компонент | Описание | Число реплик по умолчанию |
|------|------|-----------|
| FE | Разбор SQL и координация работы | 1 |
| MS (MetaService) | Управление метаданными | 1 |
| Группа вычислений (CG) | Загрузка данных и кэширование | 2 |
| FoundationDB | Хранение метаданных | - |
| Storage Vault | Объектное хранилище, совместимое с S3 | - |

## Обзор этапов развертывания {#deployment-path-overview}

Весь процесс состоит из 5 последовательных шагов. Входные данные и результаты каждого шага приведены ниже:

| Шаг | Цель этапа | Входные данные | Результат |
|------|----------|------|------|
| Шаг 1 | Развернуть FoundationDB | Кластер K8s / доступные машины | Работающий кластер FDB и сведения для подключения |
| Шаг 2 | Развернуть Doris Operator | Доступ к кластеру K8s | Работающий Operator и CRD |
| Шаг 3 | Развернуть кластер Doris с разделением вычислений и хранения | `ddc-sample.yaml` и сведения для подключения к FDB | Работающий кластер с разделением вычислений и хранения |
| Шаг 4 | Создать удаленное хранилище | Работающий кластер и учетные данные объектного хранилища, совместимого с S3 | Storage Vault, доступный для постоянного хранения данных |
| Шаг 5 | Подключиться к кластеру и проверить всю цепочку операций | Подключение MySQL, установленное на шаге 4 | Работоспособность кластера подтверждена чтением и записью |

После шага 4 кластер готов принимать записи. На шаге 5 с помощью SQL проверяется вся цепочка операций. О расширенной настройке FE / MS / групп вычислений читайте в разделе [Расширенная настройка](#advanced-configuration) в конце документа.

## Шаг 1: развертывание FoundationDB {#step-1-deploy-foundationdb}

Кластер с разделением вычислений и хранения использует FoundationDB (FDB) для хранения метаданных. Перед развертыванием необходимо подготовить работающий кластер FDB. Выберите способ развертывания с учетом имеющейся инфраструктуры:

| Способ развертывания | Когда подходит | Дальнейшие действия |
|----------|----------|----------|
| Непосредственно на машинах (рекомендуется) | Уже есть доступные физические или виртуальные машины | Разверните FDB по инструкции [Разделение вычислений и хранения — подготовка к развертыванию](../../deploy-manually/separating-storage-compute-deploy-manually). Убедитесь, что машины с FDB и кластер K8s находятся в одной локальной сети |
| В Kubernetes | Требуется управлять FDB вместе с остальными ресурсами K8s | Следуйте приведенным ниже инструкциям по быстрому развертыванию в K8s |

### Быстрое развертывание в K8s (для разработки) {#k8s-quick-deployment-development}

Следуйте руководству [Развертывание FoundationDB](install-fdb.md), чтобы установить CRD закрепленных версий, FDB Operator, правила RBAC для Monitor и **конфигурацию для разработки с одной репликой**. В краткой инструкции и полном руководстве используются одни и те же ресурсы с зафиксированными версиями; не смешивайте старые YAML-файлы развертывания с новыми CRD.

1. Проверьте совместимость клиента MetaService: используйте конфигурацию 7.3.69 только с совместимым клиентом либо следуйте [варианту для 7.1](install-fdb.md#fdb-71) из руководства.
2. Выберите StorageClass для SSD и ознакомьтесь с [планированием ресурсов](install-fdb.md#resource-planning): конфигурация с одной репликой запрашивает 4.4 CPU / 5Gi с учетом вспомогательных контейнеров и 20Gi для PVC. Она не предназначена для эксплуатации в рабочей среде.
3. Выполните описанные в руководстве проверки установки, доступности, полной репликации и согласования состояния. Затем запишите имя созданной ConfigMap `fdb-single-config` в пространстве имен `fdb-system`: она понадобится на шаге 3 ниже. Также проверьте фактическое подключение MetaService.

Для начальной конфигурации с двумя репликами в руководстве предусмотрен отдельный профиль, запрашивающий 17.6 CPU / 132Gi с учетом вспомогательных контейнеров и 1000Gi для PVC, без учета ресурсов Operator и Doris. Перед использованием в рабочей среде предусмотрите независимые домены отказа хостов, ресурсы для рабочей нагрузки и запас для замены узлов.

## Шаг 2: развертывание Doris Operator {#step-2-deploy-doris-operator}

**Входные данные**: доступ к кластеру Kubernetes
**Действие**: применить определения ресурсов CRD, развернуть Operator и правила RBAC
**Результат**: Doris Operator работает в пространстве имен `doris`

### 1. Применить определения ресурсов CRD {#1-apply-crd-resource-definitions}

Выберите команду в зависимости от текущего состояния кластера:

- **Сценарий A: первое развертывание (или развертывание только кластера с разделением вычислений и хранения)**: примените все CRD:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **Сценарий B: кластер без разделения вычислений и хранения уже развернут**: добавьте только CRD для разделения вычислений и хранения:

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Развернуть Operator и правила RBAC {#2-deploy-the-operator-and-rbac-rules}

Выполните следующую команду для развертывания Doris Operator и необходимых ему правил RBAC:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

После развертывания проверьте состояние Pod с Operator:

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

Значение `Running` в столбце `STATUS` означает, что Operator готов к работе.

## Шаг 3: развертывание кластера с разделением вычислений и хранения {#step-3-deploy-the-compute-storage-decoupled-cluster}

**Входные данные**: пример конфигурации развертывания `ddc-sample.yaml` и сведения для подключения к FoundationDB
**Действие**: скачать пример, при необходимости изменить ключевые поля и развернуть кластер
**Результат**: работающий кластер Doris с разделением вычислений и хранения

### 1. Скачать пример конфигурации развертывания {#1-download-the-deployment-example}

Скачайте пример конфигурации развертывания по умолчанию из репозитория Doris Operator:

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. Изменить ключевые параметры {#2-modify-key-configurations}

После скачивания примера перед развертыванием необходимо изменить как минимум две категории полей, указанные ниже. Для остальных полей оставьте значения по умолчанию:

| Поле | Обязательное / необязательное | Описание |
|------|-------------|------|
| `spec.metaService.fdb` | **Обязательное** | Сведения для подключения к FDB, развернутой на шаге 1 (выберите адрес или ConfigMap) |
| `spec.computeGroups[].image` | **Обязательное** | Версия образа BE. Должна соответствовать выбранной версии Doris |
| `spec.metaService.image` | Необязательное | Версия образа MetaService. По умолчанию используется версия из примера |
| `spec.feSpec.electionNumber` | Необязательное | Число FE Followers. По умолчанию — 1; **после развертывания изменить нельзя** |
| `spec.computeGroups[].replicas` | Необязательное | Число реплик в группе вычислений. По умолчанию используется значение из примера |
| `spec.feSpec.requests` / `limits` | Необязательное | Запросы и ограничения вычислительных ресурсов FE (рекомендуется задавать в рабочей среде) |

После изменения раздел `spec` будет выглядеть примерно так (**способ A: FDB развернута на машинах**):

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

**Способ B: FDB развернута в K8s**: замените раздел `metaService.fdb` следующим:

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

Чтобы найти ConfigMap, выполните `kubectl get configmap` (подробнее см. в разделе [Развертывание FoundationDB — получение ConfigMap со сведениями для подключения](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)).

Описание параметров:

| Параметр | Описание |
|------|------|
| `${fdbEndpoint}` | Адрес для подключения клиента FoundationDB. При стандартном развертывании на виртуальной машине Linux он хранится в `/etc/foundationdb/fdb.cluster`. Подробнее см. [документацию о файле кластера FoundationDB](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) |
| `${beImage}` | Образ BE. Используйте образы из [официального репозитория образов Apache Doris](https://hub.docker.com/r/apache/doris) |
| `${foundationdbConfigMapName}` | Имя ConfigMap, созданной `fdb-kubernetes-operator` |
| `${namespace}` | Пространство имен, в котором находится ConfigMap |

### 3. Развернуть и проверить {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

После применения ресурсов дождитесь автоматического развертывания кластера. Проверьте его состояние следующей командой:

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**Критерии готовности:** значение `CLUSTERHEALTH` равно `green`, а `CGAVAILABLECOUNT` равно `CGCOUNT`.

## Шаг 4: создание удаленного хранилища {#step-4-create-the-remote-storage-backend}

**Входные данные**: работающий кластер Doris и учетные данные объектного хранилища, совместимого с S3
**Действие**: выполнить SQL через клиент MySQL, чтобы создать и включить Vault
**Результат**: настроенное хранилище для постоянного хранения данных

После успешного запуска кластера зарегистрируйте объектное хранилище через SQL в качестве хранилища для постоянного размещения данных (в Doris оно называется Vault) и назначьте его Vault по умолчанию. Это необходимо для сохранения записанных данных.

### 1. Получить адрес службы FE {#1-get-the-access-address-of-the-fe-service}

Найдите Service, через который можно обратиться к FE, с помощью следующей команды:

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

### 2. Подключиться через клиент MySQL {#2-connect-through-a-mysql-client}

Запустите в кластере Kubernetes временный Pod с клиентом MySQL и войдите в него:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Внутри Pod подключитесь к кластеру Doris по имени Service для FE:

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Создать Storage Vault {#3-create-a-storage-vault}

Создайте через SQL Vault на основе объектного хранилища, поддерживающего протокол S3. В следующем примере используется Alibaba Cloud OSS:

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

### 4. Назначить Storage Vault по умолчанию {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

Здесь `${vaultName}` — имя Vault, который вы хотите использовать (например, `s3_vault` из предыдущего шага).

Теперь кластер готов принимать записи. На следующем шаге с помощью SQL проверяется вся цепочка операций.

## Шаг 5: подключение к кластеру и проверка всей цепочки операций {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**Входные данные**: подключение MySQL, установленное на шаге 4
**Действие**: выполнить проверочные SQL-запросы, чтобы убедиться в готовности кластера и возможности чтения и записи
**Результат**: работоспособность кластера подтверждена проверкой всей цепочки операций

Используя подключение клиента MySQL, установленное на шаге 4 (если вы уже вышли из клиента, повторите [шаг 4 — подключение через клиент MySQL](#2-connect-through-a-mysql-client)), последовательно выполните следующие команды.

### 1. Проверить доступность узлов BE {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

В выводе значение столбца `Alive` для каждого узла BE должно быть `true`: это означает, что BE в группе вычислений готовы к работе и распознаны FE.

### 2. Проверить, что Storage Vault действует {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

В выводе должен присутствовать Vault, созданный на шаге 4 (например, `s3_vault`), со значением `true` в столбце `IsDefault`. Это означает, что хранилище готово к работе.

### 3. Записать и прочитать тестовые данные {#3-write-and-query-test-data}

Последовательно выполните следующие SQL-команды, чтобы проверить всю цепочку: создание базы данных, создание таблицы, запись и запрос данных:

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

Если `SELECT` возвращает записанные данные, вся цепочка от FE через MetaService и группу вычислений до Storage Vault работает, а кластер готов к использованию.

## Расширенная настройка {#advanced-configuration}

После выполнения приведенных выше 5 шагов кластер готов к использованию. В рабочей среде обычно требуется дополнительная настройка. Нужные разделы документации указаны ниже:

| Тема | Документ | Основное содержание |
|--------|----------|----------|
| Подробности развертывания FoundationDB, конфигурация с двумя репликами / для рабочей среды, развертывание с FQDN, частный репозиторий образов | [Развертывание FoundationDB](install-fdb.md) | Принципы работы и все способы развертывания FDB |
| Смена образа MetaService, настройка ресурсов и параметров запуска, изменение времени ожидания проверки доступности | [Настройка MetaService](config-ms.md) | Все поля `spec.metaService.*` |
| Настройка ресурсов FE, изменение числа Followers и конфигурации запуска, настройка способа доступа (NodePort / LoadBalancer), постоянное хранилище | [Настройка FE](config-fe.md) | Все поля `spec.feSpec.*` |
| Группы вычислений из одной или нескольких групп, ограничения ресурсов, настройка способа доступа, постоянное хранение кэша и журналов | [Настройка группы вычислений](config-cg.md) | Все поля `spec.computeGroups[*]` |
| Настройка паролей администратора root и других пользователей с правами администратора, учетных данных Secret, подключение файлов аутентификации Kerberos | [Настройка аутентификации](config-cluster.md) | Учетные данные уровня кластера и Kerberos |
| Масштабирование узлов BE, добавление и удаление групп вычислений, проверка уменьшения масштаба и очистки PVC | [Масштабирование вычислительных ресурсов](config-cg.md#scaling-compute-groups) | Порядок действий, вывод узлов из эксплуатации и проверка результата |
