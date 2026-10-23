---
{
    "title": "03 Развёртывание кластера Doris",
    "language": "ru",
    "description": "Полное руководство по развёртыванию кластера Apache Doris в Kubernetes с помощью Doris Operator: скачивание шаблона развёртывания, настройка кластера и проверка его состояния.",
    "keywords": ["развёртывание кластера Doris", "Kubernetes", "K8s", "DorisCluster", "совмещённое хранение и вычисления", "быстрое развёртывание"]
}
---

Прежде чем развёртывать кластер Doris в Kubernetes, [установите Doris Operator](install-doris-operator.md).

Процесс развёртывания кластера Doris состоит из трёх шагов: скачивание шаблона развёртывания Doris, настройка и установка шаблона, а также проверка состояния кластера.

## Шаг 1: Скачивание шаблона развёртывания Doris {#step-1-download-the-doris-deployment-template}

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```

## Шаг 2: Установка настроенного шаблона развёртывания {#step-2-install-the-customized-deployment-template}

Настройте конфигурацию в соответствии со своими требованиями, следуя указаниям в [разделе о настройке кластера](./install-config-cluster.md), а затем выполните развёртывание следующей командой:

```shell
kubectl apply -f doriscluster-sample.yaml
```

## Шаг 3: Проверка состояния развёртывания кластера {#step-3-check-the-cluster-deployment-status}

1. **Проверьте состояние подов**:

  ```shell
  kubectl get pods
  ```

  Ожидаемый результат:

  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```

2. **Проверьте состояние развёрнутого ресурса**:

  ```shell
  kubectl get dcr -n doris
  ```

  Ожидаемый результат:

  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
