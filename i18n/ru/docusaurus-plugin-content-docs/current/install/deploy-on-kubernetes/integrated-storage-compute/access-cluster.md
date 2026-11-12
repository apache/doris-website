---
{
    "title": "04 Доступ к кластеру Doris",
    "language": "ru",
    "description": "Узнайте, как получить доступ к кластеру Doris в Kubernetes в режимах ClusterIP, NodePort и LoadBalancer, включая подключение через клиент MySQL и настройку StreamLoad.",
    "keywords": ["доступ к кластеру Doris", "клиент MySQL", "ClusterIP", "NodePort", "LoadBalancer", "StreamLoad", "Service", "K8s"]
}
---

Kubernetes использует Service для предоставления VIP и балансировки нагрузки. Service поддерживает три режима предоставления доступа извне: `ClusterIP`, `NodePort` и `LoadBalancer`.

## Режим ClusterIP {#clusterip-mode}

По умолчанию Doris в Kubernetes использует [режим доступа ClusterIP](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip). Режим доступа ClusterIP предоставляет внутренний адрес в кластере Kubernetes, который служит адресом сервиса внутри Kubernetes.

После первоначального развёртывания вы можете подключиться к Doris по протоколу MySQL под пользователем `root` без пароля следующим образом.

### Шаг 1: Получение Service {#step-1-get-the-service}

После развёртывания кластера выполните следующую команду, чтобы просмотреть Service, предоставляемые Doris Operator:

```shell
kubectl -n doris get svc
```

Результат будет следующим:

```shell
NAME                              TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                               AGE
doriscluster-sample-be-internal   ClusterIP   None          <none>        9050/TCP                              9m
doriscluster-sample-be-service    ClusterIP   10.1.68.128   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   9m
doriscluster-sample-fe-internal   ClusterIP   None          <none>        9030/TCP                              14m
doriscluster-sample-fe-service    ClusterIP   10.1.118.16   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   14m
```

В приведённом выше выводе и у FE, и у BE есть Service двух типов с суффиксами `internal` и `service` соответственно:

- Service с суффиксом `internal` используются только для внутреннего взаимодействия Doris, например для проверки работоспособности и обмена данными, и недоступны извне.

- Service с суффиксом `service` используются для доступа к сервисам кластера.

### Шаг 2: Подключение к Doris {#step-2-access-doris}

Режим ClusterIP можно использовать только внутри Kubernetes. Выполните следующую команду, чтобы создать в текущем кластере Kubernetes Pod с клиентом MySQL:

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never --namespace=doris -- /bin/bash
```

Внутри контейнера вы можете подключиться к кластеру Doris, указав имя Service с суффиксом `service`:

```shell
mysql -uroot -P9030 -hdoriscluster-sample-fe-service
```

## Режим NodePort {#nodeport-mode}

После [настройки режима доступа NodePort](install-config-cluster.md#nodeport) в разделе конфигурации доступа DorisCluster выполните следующие действия, чтобы подключиться к FE по протоколу MySQL под пользователем `root` без пароля.

### Шаг 1: Получение Service {#step-1-get-the-service-1}

После развёртывания кластера выполните следующую команду, чтобы просмотреть `Service`:

```shell
kubectl get service
```

Результат будет следующим:

```shell
NAME                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                                                       AGE
kubernetes                        ClusterIP   10.152.183.1     <none>        443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP   None             <none>        9030/TCP                                                      2d
doriscluster-sample-fe-service    NodePort    10.152.183.58    <none>        8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP   None             <none>        9050/TCP                                                      2d
doriscluster-sample-be-service    NodePort    10.152.183.244   <none>        9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```

### Шаг 2: Подключение к Doris {#step-2-access-doris-1}

Рассмотрим подключение через MySQL. По умолчанию Doris использует порт запросов (Query Port) 9030. В приведённом выше примере порт 9030 сопоставлен с локальным портом 31545. Для доступа к кластеру Doris необходимо получить IP-адрес узла кластера. Выполните следующую команду, чтобы узнать его:

```shell
kubectl get nodes -owide
```

Результат будет следующим:

```shell
NAME   STATUS   ROLES           AGE   VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE          KERNEL-VERSION          CONTAINER-RUNTIME
r60    Ready    control-plane   14d   v1.28.2   192.168.88.60   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r61    Ready    <none>          14d   v1.28.2   192.168.88.61   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r62    Ready    <none>          14d   v1.28.2   192.168.88.62   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
r63    Ready    <none>          14d   v1.28.2   192.168.88.63   <none>        CentOS Stream 8   4.18.0-294.el8.x86_64   containerd://1.6.22
```

В режиме NodePort вы можете обращаться к сервисам внутри кластера Kubernetes через IP-адрес любого узла и сопоставленный порт хоста. В этом примере доступны IP-адреса узлов 192.168.88.61, 192.168.88.62 и 192.168.88.63. Следующий пример показывает, как подключиться к Doris через узел 192.168.88.62 и порт хоста 31545, сопоставленный с `query port`:

```shell
mysql -h 192.168.88.62 -P 31545 -uroot
```

## Режим LoadBalancer {#loadbalancer-mode}

В публичном облаке после [настройки режима доступа LoadBalancer](install-config-cluster.md#loadbalancer) в разделе конфигурации доступа DorisCluster выполните следующие действия, чтобы подключиться к FE по протоколу MySQL под пользователем `root` без пароля.

### Шаг 1: Получение Service {#step-1-get-the-service-2}

После развёртывания кластера выполните следующую команду, чтобы просмотреть `Service`, который можно использовать для доступа к `Doris`:

```shell
kubectl get service
```

Результат будет следующим:

```shell
NAME                              TYPE           CLUSTER-IP       EXTERNAL-IP                                                                     PORT(S)                                                       AGE
kubernetes                        ClusterIP      10.152.183.1     <none>                                                                          443/TCP                                                       169d
doriscluster-sample-fe-internal   ClusterIP      None             <none>                                                                          9030/TCP                                                      2d
doriscluster-sample-fe-service    LoadBalancer   10.152.183.58    ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com         8030:31041/TCP,9020:30783/TCP,9030:31545/TCP,9010:31610/TCP   2d
doriscluster-sample-be-internal   ClusterIP      None             <none>                                                                          9050/TCP                                                      2d
doriscluster-sample-be-service    LoadBalancer   10.152.183.244   ac4828493dgrftb884g67wg4tb68gyut-1137823345.us-east-1.elb.amazonaws.com         9060:30940/TCP,8040:32713/TCP,9050:30621/TCP,8060:30926/TCP   2d
```
### Шаг 2: Подключение к Doris {#step-2-access-doris-2}

Рассмотрим подключение через MySQL:

```shell
mysql -h ac4828493dgrftb884g67wg4tb68gyut-1137856348.us-east-1.elb.amazonaws.com -P 31545 -uroot
```

## Использование StreamLoad для доступа к Doris, развёрнутому в Kubernetes {#using-streamload-to-access-doris-deployed-on-kubernetes}
Doris поддерживает импорт данных в режиме StreamLoad. Когда клиент и кластер Doris находятся в одной локальной сети, клиент может напрямую использовать адрес FE в качестве адреса запроса. Сервис FE получает запрос и возвращает код состояния HTTP 301 вместе с доступным адресом BE, указывая клиенту отправить запрос на импорт данных по этому адресу BE. Кластер Doris, развёрнутый в Kubernetes, использует для взаимодействия адреса, доступные только внутри Kubernetes. Если для StreamLoad настроен доступный адрес FE, адрес BE, возвращаемый FE через механизм перенаправления 301, доступен только внутри Kubernetes, из-за чего импорт данных из клиентов за пределами Kubernetes завершается ошибкой.

Когда клиент за пределами Kubernetes использует StreamLoad для импорта данных в кластер Doris, развёрнутый в Kubernetes, в качестве адреса импорта StreamLoad необходимо настроить адрес BE, доступный извне.
### Настройка внешнего доступа к Service для BE {#configure-the-be-service-to-be-externally-accessible}
Настройте `Service` для BE так, чтобы он был доступен извне кластера Kubernetes, согласно инструкциям для [NodePort](install-config-cluster.md#nodeport) или [LoadBalancer](install-config-cluster.md#loadbalancer). Затем обновите ресурс `DorisCluster`, используемый для развёртывания кластера Doris.

### Настройка прокси-адреса BE {#configure-the-be-proxy-address}
Используя способы получения адресов доступа, описанные в разделах [Режим NodePort](#nodeport-mode) или [Режим LoadBalancer](#loadbalancer-mode), получите адрес, доступный извне Kubernetes, и соответствующий порт сервиса web_server. Настройте полученные адрес и порт в качестве адреса запроса, используемого StreamLoad для импорта данных.
