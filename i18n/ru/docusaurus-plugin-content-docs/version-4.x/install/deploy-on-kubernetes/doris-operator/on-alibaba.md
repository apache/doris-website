---
{
    "title": "Развертывание кластера Doris в Alibaba Cloud Container Service",
    "sidebar_label": "Рекомендации по развертыванию в Alibaba Cloud Container Service",
    "language": "ru",
    "description": "Руководство по развертыванию Doris в Alibaba Cloud ACK/ACS, включая проверку среды, настройку параметров, настройку реестра образов и устранение распространенных неполадок. Рассматриваются такие проблемы, как невозможность запуска узлов BE, включенный swap и настройка памяти с огромными страницами."
}
---

## Обзор Alibaba Cloud Container Service {#overview-of-alibaba-cloud-container-service}

Alibaba Cloud предоставляет два контейнерных сервиса:

| Сервис | Описание | Сценарий использования |
|------|------|----------|
| **ACK** (Container Service for Kubernetes) | Управляемый контейнерный сервис на приобретенных экземплярах ECS с полным контролем доступа | Сценарии, требующие управления базовыми экземплярами ECS или развертывания узлов BE в привилегированном режиме |
| **ACS** (Container Service ACS) | Сервис облачных вычислений с интерфейсом K8s и оплатой по потреблению, не требующий управления базовыми экземплярами ECS | Эластичные вычислительные ресурсы с оплатой по мере использования |

В этом документе описано развертывание кластера с помощью Doris Operator в каждом из этих сервисов.

## Развертывание в ACK {#ack-deployment}

ACK предоставляет управляемый контейнерный сервис на приобретенных экземплярах ECS с полным контролем доступа для настройки системных параметров. При использовании образа Alibaba Cloud Linux 3 текущие значения системных параметров полностью соответствуют требованиям для работы Doris. Для других образов параметры можно скорректировать внутри контейнера с помощью привилегированного режима K8s.

**При развертывании с ACK + Doris Operator большинство стандартных настроек ECS соответствуют требованиям, а параметры, которые им не соответствуют, корректирует Operator.**

### Сценарий 1: существующий кластер {#scenario-1-existing-cluster}

Если кластер контейнерного сервиса уже создан, выполните следующие действия для проверки и корректировки параметров:

#### Шаг 1: проверка состояния swap {#step-1-check-swap-status}

```bash
swapon --show
```

**Ожидаемый результат**: вывод отсутствует (swap отключен). Если вывод указывает на то, что swap включен, выполните `swapoff -a` и перезагрузите систему.

#### Шаг 2: проверка максимального количества файловых дескрипторов {#step-2-check-maximum-file-handle-count}

```bash
ulimit -n
```

**Ожидаемый результат**: не менее 65535. Если значение ниже, добавьте следующие строки в `/etc/security/limits.conf`:

```shell
* soft nofile 1000000
* hard nofile 1000000
```

#### Шаг 3: проверка количества областей виртуальной памяти {#step-3-check-virtual-memory-area-count}

```bash
sysctl vm.max_map_count
```

**Ожидаемый результат**: не менее 262144. Если требуется изменить значение, выполните `sysctl -w vm.max_map_count=2000000`.

#### Шаг 4: проверка прозрачных огромных страниц {#step-4-check-transparent-huge-pages}

```bash
cat /sys/kernel/mm/transparent_hugepage/enabled
```

**Ожидаемый результат**: вывод содержит `[never]`. Если значение равно `[always]`, выполните:

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

Подробнее см. в разделе [Проверка операционной системы](../../preparation/os-checking.md).

### Сценарий 2: новый кластер {#scenario-2-new-cluster}

Чтобы создать новый кластер, нажмите «Создать кластер» в консоли Alibaba Cloud Container Service ACK. На шаге **Настройка пула узлов** добавьте следующий скрипт в поле «Предварительные пользовательские данные экземпляра»:

```shell
#!/bin/bash
chmod +x /etc/rc.d/rc.local

# Disable firewall
echo "sudo systemctl stop firewalld.service" >> /etc/rc.d/rc.local
echo "sudo systemctl disable firewalld.service" >> /etc/rc.d/rc.local

# Set virtual memory area count
echo "sysctl -w vm.max_map_count=2000000" >> /etc/rc.d/rc.local

# Disable swap
echo "swapoff -a" >> /etc/rc.d/rc.local

# Set file handle limit
current_limit=$(ulimit -n)
desired_limit=1000000
config_file="/etc/security/limits.conf"
if [ "$current_limit" -ne "$desired_limit" ]; then
   echo "* soft nofile 1000000" >> "$config_file"
   echo "* hard nofile 1000000" >> "$config_file"
fi
```

После запуска кластера перезагрузите узлы, чтобы изменения вступили в силу.

## Развертывание в ACS {#acs-deployment}

ACS предоставляет сервис облачных вычислений с интерфейсом K8s и эластичными вычислительными ресурсами с оплатой по мере использования. Управлять базовыми экземплярами ECS не требуется, однако для запуска узлов BE необходим привилегированный режим, позволяющий изменять системные параметры, например `vm.max_map_count`.

:::tip Совет
Если в текущем кластере нельзя использовать привилегированный режим, запустить узлы BE не удастся. В этом случае рассмотрите вариант развертывания с ACK и хостами.
:::

### Шаг 1: настройка реестра образов {#step-1-configure-image-registry}

Для ACS рекомендуется использовать соответствующий реестр образов Alibaba Cloud [Container Registry (ACR)](https://www.alibabacloud.com/en/product/container-registry), доступный в редакциях Personal Edition и Enterprise Edition.

После переноса официальных образов Doris в реестр образов Alibaba Cloud создайте секрет, если используются приватные образы:

```bash
kubectl create secret docker-registry image-hub-secret \
  --docker-server={your-server} \
  --docker-username={your-username} \
  --docker-password={your-pwd}
```

### Шаг 2: настройка DCR для использования приватных образов {#step-2-configure-dcr-to-use-private-images}

Настройте `imagePullSecrets` в DorisCluster CR:

```yaml
spec:
  feSpec:
    replicas: 1
    image: <your-acr-registry>/selectdb-test/doris.fe-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
  beSpec:
    replicas: 3
    image: <your-acr-registry>/selectdb-test/doris.be-ubuntu:3.0.3
    imagePullSecrets:
    - name: image-hub-secret
    systemInitialization:
      initImage: <your-acr-registry>/selectdb-test/alpine:latest
```

### Шаг 3: настройка Service {#step-3-configure-service}

В ACS нет привычного понятия Node, поэтому для Service нельзя использовать режим NodePort. Доступны следующие режимы:

#### Режим ClusterIP (по умолчанию) {#clusterip-mode-default}

Сетевой режим Operator по умолчанию. См. [документацию Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/#type-clusterip).

#### Режим Load Balancer {#load-balancer-mode}

**Способ 1: настройка аннотаций через DCR**

```yaml
feSpec:
  replicas: 3
  image: <your-image>
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/alibaba-cloud-loadbalancer-address-type: "intranet"
```

**Способ 2: управление через консоль ACS**

1. Задайте для serviceType значение ClusterIP (по умолчанию) в DCR.
2. В консоли ACS перейдите: Container Compute Service ACS → Список кластеров → Кластер → Сервисы → Создать.
3. Выберите только что созданный LB для привязки. Этот Service управляется параллельно с Doris Operator, но не контролируется Operator.

---

## Часто задаваемые вопросы {#faq}

### Вопрос: что делать, если узлы BE не запускаются? {#q-what-if-be-nodes-cannot-start}

Проверьте следующее:
1. **Привилегированный режим не включен**: в ACS для изменения `vm.max_map_count` требуется привилегированный режим. Если включить его невозможно, используйте ACK.
2. **Ошибка загрузки образа**: проверьте правильность настройки `imagePullSecrets`.
3. **Недостаточное количество областей виртуальной памяти**: выполните `sysctl vm.max_map_count` и убедитесь, что значение не ниже 262144.

### Вопрос: нормально ли, что узлы кластера отображаются как virtual-kubelet? {#q-is-it-normal-for-cluster-nodes-to-appear-as-virtual-kubelet}

Да. ACS использует виртуальные узлы для планирования размещения контейнеров. Имена узлов вида `virtual-kubelet-cn-hongkong-d` нормальны для ACS.

### Вопрос: что делать, если привилегированный режим недоступен в регионе Alibaba Cloud? {#q-what-if-privileged-mode-is-not-enabled-in-an-alibaba-cloud-region}

Создайте обращение в службу поддержки с просьбой добавить возможность использования привилегированного режима ACS в список разрешенных для вашей учетной записи.

### Вопрос: как выбрать между ACK и ACS? {#q-how-to-choose-between-ack-and-acs}

| Сценарий | Рекомендация |
|------|------|
| Требуется полный контроль над базовыми экземплярами ECS | ACK |
| Нужны эластичные ресурсы с оплатой по мере использования без управления базовой инфраструктурой | ACS |
| Узлам BE требуется привилегированный режим | ACK |
