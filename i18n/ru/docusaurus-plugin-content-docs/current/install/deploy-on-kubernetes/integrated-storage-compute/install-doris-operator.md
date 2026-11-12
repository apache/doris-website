---
{
    "title": "01 Развертывание Doris Operator",
    "language": "ru",
    "description": "Полное руководство по установке Apache Doris Operator в Kubernetes: установка CRD, развертывание Operator и проверка состояния.",
    "keywords": ["Doris Operator", "Kubernetes", "K8s", "CRD", "Operator deployment", "integrated storage and compute"]
}
---

Развертывание Doris Operator состоит из трёх шагов: установки CRD, развертывания сервиса Operator и проверки состояния развертывания.

## Шаг 1: Установка CRD Doris Operator {#step-1-install-the-doris-operator-crd}

Добавьте определение пользовательского ресурса (Custom Resource Definition, CRD) для Doris Operator с помощью следующей команды:

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```

## Шаг 2: Развертывание Doris Operator {#step-2-deploy-the-doris-operator}

Установите Doris Operator с помощью следующей команды:

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```

Ожидаемый вывод:

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

## Шаг 3: Проверка состояния Doris Operator {#step-3-check-the-doris-operator-status}

Проверьте состояние развертывания Doris Operator с помощью следующей команды:

```shell
kubectl get pods -n doris
```

Ожидаемый вывод:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
