---
{
    "title": "Развёртывание FoundationDB",
    "language": "ru",
    "description": "Подробное руководство по развёртыванию кластера FoundationDB в Kubernetes с помощью fdb-kubernetes-operator, включая определения ресурсов, развёртывание оператора, настройку кластера и проверку состояния. Обеспечивает хранение метаданных для кластера Doris с разделением вычислений и хранения.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "FoundationDB", "fdb-kubernetes-operator", "metadata storage", "K8s"]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview) — распределённая база данных со строгой согласованностью для структурированных данных, распространяемая под открытой лицензией Apache 2.0. Doris использует FoundationDB в качестве хранилища метаданных в режиме разделения вычислений и хранения.

Для развёртывания кластера с разделением вычислений и хранения в Kubernetes необходимо предварительно развернуть сервис FoundationDB. Рекомендуются два способа развёртывания:

- Развёртывание непосредственно на машинах (в том числе физических). Чтобы развернуть FoundationDB непосредственно на машинах, следуйте разделу [Подготовка к развёртыванию](../../deploy-manually/separating-storage-compute-deploy-manually) в официальной документации Doris по разделению вычислений и хранения. Перед развёртыванием убедитесь, что машины с FoundationDB и кластер Kubernetes, в котором работает Doris, находятся в одной локальной сети.

- Развёртывание FoundationDB в Kubernetes. FoundationDB официально предоставляет [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) для развёртывания FoundationDB и управления им в Kubernetes.

## Развёртывание FoundationDB в Kubernetes {#deploy-foundationdb-on-kubernetes}

Развёртывание FoundationDB в Kubernetes состоит из 4 шагов:

1. Разверните определения ресурсов FoundationDB.
2. Разверните сервис fdb-kubernetes-operator.
3. Разверните кластер FoundationDB.
4. Проверьте состояние FoundationDB.

### Шаг 1: Развёртывание определений ресурсов FoundationDB {#step-1-deploy-the-foundationdb-resource-definitions}

Примените определения ресурсов FoundationDB с помощью следующих команд:

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

Ожидаемый результат:

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
```

### Шаг 2: Развёртывание сервиса fdb-kubernetes-operator {#step-2-deploy-the-fdb-kubernetes-operator-service}

В репозитории fdb-kubernetes-operator приведён пример развёртывания кластера FoundationDB в режиме IP. В репозитории doris-operator приведён пример развёртывания кластера FoundationDB в режиме FQDN. Скачайте подходящий для ваших задач пример.

1. Скачайте пример конфигурации развёртывания

    - Скачивание из официального репозитория fdb-kubernetes-operator
      По умолчанию fdb-kubernetes-operator развёртывает кластер FoundationDB в режиме IP. Вы можете скачать YAML-файл [конфигурации развёртывания fdb-kubernetes-operator по умолчанию](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml). Для развёртывания в режиме FQDN настройте использование доменных имён согласно разделу [Использование DNS](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns) в официальной документации.

      ```shell
      wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
      ```

    - Скачивание из репозитория doris-operator
      В репозитории doris-operator приведён адаптированный пример конфигурации развёртывания на основе fdb-kubernetes-operator версии 1.46.0, который можно сразу использовать для развёртывания кластера FoundationDB.

      ```shell
      wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
      ```

2. Разверните сервис fdb-kubernetes-operator

    После настройки YAML-файла развёртывания для `fdb-kubernetes-operator` разверните fdb-kubernetes-operator с помощью следующей команды:

    ```shell
    kubectl apply -f fdb-operator.yaml
    ```

    Ожидаемый результат:

    ```shell
    serviceaccount/fdb-kubernetes-operator-controller-manager created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
    rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
    clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
    deployment.apps/fdb-kubernetes-operator-controller-manager created
    ```
### Шаг 3: Развёртывание кластера FoundationDB {#step-3-deploy-the-foundationdb-cluster}

В [репозитории fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/config/samples/cluster.yaml) приведён пример конфигурации развёртывания FoundationDB. Скачайте его с помощью следующей команды.

1. Скачайте пример конфигурации развёртывания

    Скачайте официальный пример конфигурации развёртывания FoundationDB в режиме IP:

    ```shell
    wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
    ```

2. Настройте пример конфигурации развёртывания

    - Среда с доступом к dockerhub
      Настройте желаемое состояние развёртывания согласно [руководству пользователя](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md), доступному на официальном сайте. Для развёртывания в режиме FQDN задайте полю `routing.useDNSInClusterFile` значение true. Конфигурация выглядит следующим образом:
      В официальном репозитории doris-operator приведён [пример развёртывания FoundationDB в режиме FQDN](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/), который можно скачать и сразу использовать.

      ```yaml
      spec:
          routing:
              useDNSInClusterFile: true
      ```

    - Среда в закрытой сети
      В закрытой сети, где нет прямого доступа к dockerhub, скачайте необходимые образы из официального репозитория FoundationDB и загрузите их в частный реестр. fdb-kubernetes-operator зависит от [foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator) и [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar).
      Для развёртывания FoundationDB требуется образ [fdb-kubernetes-monitor](https://hub.docker.com/r/foundationdb/fdb-kubernetes-monitor/tags).
      После загрузки образов в частный реестр выполните настройку согласно разделу [Настройка образа FoundationDB](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image) в официальной документации fdb-kubernetes-operator.
      Используйте следующую конфигурацию, чтобы добавить настройки образов из частного реестра:

      ```yaml
      spec:
          mainContainer:
              imageConfigs:
                  - baseImage: foundationdb/fdb-kubernetes-monitor
                    tag: 7.1.38
          sidecarContainer:
              imageConfigs:
                  - baseImage: foundationdb/fdb-kubernetes-monitor
                    tag: 7.1.38
          version: 7.1.38
      ```

    В репозитории doris-operator представлены 4 варианта развёртывания FoundationDB: [минимальное развёртывание с одной репликой](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml), [минимальное развёртывание с двумя репликами](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster.yaml), [развёртывание в производственной среде с двумя репликами](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product.yaml) и [развёртывание в производственной среде с двумя репликами и образами из частного реестра](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product_private_env.yaml).

:::tip Совет
- При развёртывании FoundationDB необходимо задать поле `.spec.version` ресурса FoundationDBCluster, указав номер выпущенной версии FoundationDB.
- FoundationDB развёртывается с помощью fdb-kubernetes-operator. Для обеспечения высокой доступности в производственной среде кластер Kubernetes должен включать не менее трёх хостов.
:::

### Шаг 4: Проверка состояния FoundationDB {#step-4-verify-the-foundationdb-status}

FoundationDB развёртывается с помощью fdb-kubernetes-operator. Вы можете проверить состояние кластера FoundationDB с помощью следующей команды:

```shell
kubectl get fdb
```

Ожидаемый результат. Если `AVAILABLE` имеет значение `true`, кластер доступен:

```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```

## Получение ConfigMap с информацией для доступа к FoundationDB {#get-the-configmap-that-contains-foundationdb-access-information}

При развёртывании FoundationDB с помощью [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) в пространстве имён развёртывания создаётся отдельный ConfigMap с информацией для доступа к FoundationDB. Имя этого ConfigMap состоит из имени ресурса развёрнутого FoundationDB и суффикса "-config". Для просмотра ConfigMap используйте следующую команду:

```shell
kubectl get configmap
```

Ожидаемый результат:

```shell
test-cluster-config   5      15d
```

:::tip Совет
При развёртывании в Kubernetes удаление ресурса FoundationDBCluster приводит к потере метаданных. Обращайтесь с ресурсом FoundationDBCluster осторожно.
:::
