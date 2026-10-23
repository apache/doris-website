---
{
    "title": "Развёртывание в Kubernetes",
    "sidebar_label": "Развёртывание в Kubernetes",
    "language": "ru",
    "description": "Как развернуть DOG Stack в Kubernetes и собирать журналы контейнеров, метрики и события кластера? В этой статье описана установка серверной части DOG Stack (шлюз OpenTelemetry, Apache Doris, Grafana) и сборщика Kubernetes с помощью Helm, а также проверка работы, правила разбора журналов, настройки для промышленной эксплуатации и устранение неполадок.",
    "keywords": [
        "DOG Stack",
        "Kubernetes",
        "Helm",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "сбор журналов Kubernetes",
        "наблюдаемость"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack Kubernetes deployment and cluster collection -->

В этой статье описано, как развернуть DOG Stack в Kubernetes с помощью Helm и настроить сбор журналов контейнеров, метрик kubelet, узлов и кластера, а также событий Kubernetes. После выполнения этих шагов вы сможете запрашивать данные в Doris и просматривать их на дашбордах Grafana. О развёртывании на одном хосте см. [Развёртывание с помощью Docker Compose](./docker.md).

DOG Stack в Kubernetes состоит из двух независимых чартов Helm:

| Чарт | Назначение | Рабочие нагрузки |
| --- | --- | --- |
| `ai-observe-stack` | Серверная часть DOG Stack. Устанавливается один раз. Принимает данные OTLP, записывает их в Doris и отображает в Grafana. Самостоятельно ничего не собирает. | Шлюз OpenTelemetry (StatefulSet), Grafana с плагином Doris App (Deployment) и, при необходимости, кластер Doris под управлением Doris Operator |
| `dog-k8s-collector` | Сборщик Kubernetes. Устанавливается один раз в каждом кластере, из которого нужно собирать данные, и настраивается на отправку данных в шлюз. | agent (DaemonSet, по одному на узел): журналы контейнеров, метрики kubelet и узлов, локальная точка приёма OTLP на узле; cluster (Deployment, по одному на кластер): метрики кластера и события Kubernetes |

Поток данных выглядит так:

```text
applications (OTLP SDK) ───────┐
                               │ OTLP
dog-k8s-collector ─────────────┤
  agent   (DaemonSet)          │
  cluster (Deployment)         ▼
ai-observe-stack
  gateway  OpenTelemetry Collector  receives OTLP, writes Doris
  doris    Apache Doris             stores logs, metrics, traces
  grafana  Grafana + Doris App      shows them
```

Между этими чартами нет зависимости Helm: они устанавливаются и обновляются отдельно. Несколько кластеров Kubernetes могут отправлять данные в один DOG Stack; данные различаются по имени кластера.

:::tip
Если DOG Stack уже работает (установлен с помощью этого чарта, развёрнут другим способом или в другом кластере), перейдите к [шагу 2: установка сборщика Kubernetes](#step-2-install-the-kubernetes-collector). Вам понадобится только адрес OTLP gRPC его шлюза.
:::

Это руководство проверено для коммита AI Observe Stack [`2c1fbee83170`](https://github.com/ai-observe/ai-observe-stack/tree/2c1fbee831701178c7dddba857e88130ef292949). Приведённые ниже команды переключают репозиторий на эту ревизию, чтобы последующие изменения в ветке main не повлияли на параметры. Версия чарта Helm — `0.2.0`, а образы Doris по умолчанию используют версию `4.0.3`.

## Предварительные требования {#prerequisites}

- Kubernetes 1.24 или новее, Helm 3.8 или новее и `kubectl`, настроенный для доступа к кластеру.
- Разрешения RBAC на уровне кластера: сборщик создаёт ClusterRole и ClusterRoleBinding.
- Средство выделения PersistentVolume для очередей отправки шлюза по умолчанию, в том числе при использовании внешнего Doris. Для временного тестового развёртывания можно отключить `gateway.persistence.enabled`; в этом случае данные в очереди теряются при замене пода.
- Узлы должны иметь возможность загружать образы `otel/opentelemetry-collector-contrib`, `otel/opentelemetry-collector-k8s`, `grafana/grafana`, `velodb/doris-app-plugin` и `busybox`. Для частного реестра задайте `global.imagePullSecrets` в `ai-observe-stack` и `imagePullSecrets` в `dog-k8s-collector`, а в параметрах образов укажите своё зеркало: `gateway.image.repository`, `grafana.image.repository`, `dorisPlugin.image.repository` и `global.helperImages.busybox` / `global.helperImages.curl` в `ai-observe-stack`; `agent.image.repository` и `cluster.image.repository` в `dog-k8s-collector`.
- Doris, один из следующих вариантов:
  - Существующий кластер Doris, у которого порты FE 9030 (протокол MySQL) и 8030 (HTTP) доступны из кластера Kubernetes, и учётная запись, позволяющая создавать целевую базу данных и таблицы, загружать данные и выполнять запросы к таблицам, используемым Grafana. Шлюз записывает данные через Stream Load: FE перенаправляет каждый запрос на BE по адресу, который BE зарегистрировал в Doris (отображается командой `SHOW BACKENDS`), поэтому эти адреса BE и HTTP-порт BE (8040 по умолчанию) также должны быть доступны из подов шлюза.
  - Либо развёртывание Doris средствами чарта: средство выделения PersistentVolume и как минимум по 2 ядра CPU и 4 GiB памяти для FE и BE.

В командах этой статьи используются имя релиза `dog` и пространство имён `dog`. Приведённые ниже имена объектов формируются на их основе; если вы используете другие имена, замените их соответствующим образом.

| Объект | Имя |
| --- | --- |
| StatefulSet и Service шлюза | `dog-ai-observe-stack-otel-gateway` |
| Deployment и Service Grafana | `dog-ai-observe-stack-grafana` |
| Secret администратора Grafana | `dog-ai-observe-stack-grafana-admin` |
| DorisCluster (при развёртывании Doris средствами чарта) | `dog-ai-observe-stack-doris` |
| DaemonSet агента сборщика | `dog-k8s-collector-agent` |
| Deployment сборщика кластера | `dog-k8s-collector-cluster` |

## Получение чартов {#get-the-charts}

Клонируйте репозиторий и загрузите зависимость чарта. Подчарт Doris Operator указан в зависимостях чарта, поэтому этот шаг обязателен даже при подключении к существующему Doris. Используйте `helm dependency update`: эта команда не требует выполнения `helm repo add`.

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe-stack
git checkout 2c1fbee831701178c7dddba857e88130ef292949
cd helm-charts
helm dependency update ./ai-observe-stack
```

Все последующие команды выполняются из каталога `helm-charts`.

## Шаг 1: установка серверной части DOG Stack {#step-1-install-the-dog-stack-backend}

Выберите, где будет работать Doris:

| | Вариант A: использовать существующий Doris | Вариант B: развернуть Doris средствами чарта |
| --- | --- | --- |
| Подходит для | Существующего кластера Doris или SelectDB; промышленной эксплуатации | Тестирования и разработки, когда Doris ещё не развёрнут |
| Расположение данных | Ваш кластер Doris | PVC внутри кластера Kubernetes |

### Вариант A: использование существующего Doris {#option-a-use-an-existing-doris}

1. Создайте пространство имён и сохраните учётные данные Doris в Secret. Secret должен содержать ключи `username` и `password`.

   ```Bash
   kubectl create namespace dog
   kubectl create secret generic doris-credentials -n dog \
     --from-literal=username='<DORIS_USER>' --from-literal=password='<DORIS_PASSWORD>'
   ```

2. Создайте файл значений `dog-values.yaml`:

   ```yaml
   doris:
     mode: external
     database: otel                  # the gateway creates this database and its tables
     external:
       host: <DORIS_FE_HOST>         # FE address reachable from the cluster
       port: 9030                    # MySQL protocol port
       feHttpPort: 8030              # HTTP port, used by Stream Load
       existingSecret: doris-credentials
     internal:
       operator:
         enabled: false              # do not install the Doris Operator
   ```

   Этот же файл доступен в репозитории по пути `examples/ai-observe-stack/minimal-external-doris.yaml`.

3. Выполните установку:

   ```Bash
   helm install dog ./ai-observe-stack -n dog -f dog-values.yaml
   ```

### Вариант B: развёртывание Doris средствами чарта {#option-b-the-chart-deploys-doris}

В репозитории представлены две конфигурации:

- `examples/ai-observe-stack/dev.yaml`: один FE и один BE, без постоянного хранения, один шлюз, включён отладочный вывод. Только для тестирования.
- `examples/ai-observe-stack/prod.yaml`: три FE и три BE, постоянное хранение, три шлюза и Ingress. Отправная точка для промышленной эксплуатации. Перед использованием настройте параметры своей среды: `storageClass` (задан AWS `gp3`), класс Ingress, хосты и издателя сертификатов TLS, а также пароль Grafana (`CHANGE_ME`).

```Bash
cp examples/ai-observe-stack/dev.yaml dog-values.yaml
helm install dog ./ai-observe-stack -n dog --create-namespace -f dog-values.yaml
```

Сохраните `dog-values.yaml` для последующих обновлений. Для промышленной эксплуатации скопируйте вместо него `prod.yaml` и перед установкой настройте перечисленные выше параметры своей среды.

Загрузка образов и инициализация Doris FE и BE занимают от двух до пяти минут. Перед запуском шлюз ожидает, пока порты FE 9030 и 8030 станут доступны и хотя бы один BE перейдёт в рабочее состояние.

:::caution
Doris Operator действует на уровне всего кластера, и в кластере Kubernetes может работать только один его экземпляр. При установке второго DOG Stack в том же кластере задайте `doris.internal.operator.enabled: false`.
:::

### Проверка серверной части {#verify-the-backend}

После завершения установки Helm выводит NOTES с адресом OTLP gRPC шлюза: `dog-ai-observe-stack-otel-gateway.dog.svc:4317`. Сохраните его для шага 2.

1. Убедитесь, что поды работают. Вы должны увидеть поды шлюза (`dog-ai-observe-stack-otel-gateway-0` и `-1` при двух репликах по умолчанию; `dev.yaml` запускает одну), под Grafana, а при использовании варианта B — также поды Doris FE и BE. Все они должны находиться в состоянии `Running`.

   ```Bash
   kubectl get pods -n dog
   ```

2. Запустите встроенный тест конвейера. Он отправляет запись журнала через шлюз и проверяет, что она поступила в Doris.

   ```Bash
   helm test dog -n dog --logs
   ```

   Вывод завершается сообщением `OK: record found in Doris`.

3. Получите пароль администратора Grafana (по умолчанию `admin`):

   ```Bash
   kubectl get secret -n dog dog-ai-observe-stack-grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d; echo
   ```

4. Откройте доступ к Grafana:

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-grafana 3000:3000
   ```

   Откройте http://localhost:3000 и войдите под именем `admin` с полученным выше паролем. На этом этапе дашборды пусты, поскольку данные в шлюз ещё не отправляются.

## Шаг 2: установка сборщика Kubernetes {#step-2-install-the-kubernetes-collector}

Серверная часть, установленная на шаге 1, только принимает данные. Сборщик собирает данные из кластера Kubernetes и отправляет их в шлюз: на каждом узле агент читает stdout и stderr всех контейнеров и собирает метрики kubelet и узла; сборщик кластера собирает метрики уровня кластера и события Kubernetes. Каждая запись содержит имя пода, пространства имён, рабочей нагрузки и кластера. Без сборщика в DOG Stack поступают данные только от приложений, отправляющих OTLP непосредственно в шлюз, а журналы контейнеров, метрики узлов и кластера, а также события отсутствуют. Установите один релиз сборщика в каждом кластере Kubernetes, за которым нужно наблюдать.

Подготовьте пространство имён в кластере, из которого будут собираться данные. Выполните эту идемпотентную команду, даже если вы пропустили шаг 1:

```Bash
kubectl create namespace dog --dry-run=client -o yaml | kubectl apply -f -
```

1. Убедитесь, что шлюз доступен из кластера, из которого будут собираться данные. Замените адрес своим.

   ```Bash
   kubectl run -it --rm otlp-check --image=busybox:1.36 --restart=Never -- \
     sh -c 'sleep 2; nc -zv dog-ai-observe-stack-otel-gateway.dog.svc 4317'
   ```

   Сообщение `open` в выводе означает, что шлюз доступен. Адрес шлюза зависит от того, где работает DOG Stack:

   | Расположение DOG Stack | Адрес шлюза (`host:port`, без `http://`) |
   | --- | --- |
   | Установлен этим чартом в том же кластере | `<release>-ai-observe-stack-otel-gateway.<namespace>.svc:4317` |
   | Ваш собственный OpenTelemetry Collector с экспортёром Doris | Его Service OTLP gRPC, обычно `<service>.<namespace>.svc:4317` |
   | Другой кластер Kubernetes | Адрес gRPC шлюза, доступ к которому открыт через LoadBalancer (`gateway.service.type: LoadBalancer`) или отдельно настроенный Ingress для gRPC. Ingress этого чарта предоставляет доступ к OTLP/HTTP, а не к OTLP/gRPC. Выбранный порт должен быть доступен между кластерами |

2. Агент работает от имени root и монтирует с узла `/var/log/pods`, `/` (только для чтения) и `/var/lib/otelcol`. Если пространство имён применяет стандарт Pod Security Standard уровня `restricted`, ослабьте ограничение:

   ```Bash
   kubectl label namespace dog pod-security.kubernetes.io/enforce=privileged --overwrite
   ```

3. Создайте файл значений `collector-values.yaml`:

   ```yaml
   gateway:
     endpoint: dog-ai-observe-stack-otel-gateway.dog.svc:4317
   clusterName: my-cluster
   platform: generic
   ```

   | Параметр | Обязательный | Значение по умолчанию | Описание |
   | --- | --- | --- | --- |
   | `gateway.endpoint` | Да | Нет | Адрес OTLP gRPC шлюза в формате `host:port`. |
   | `clusterName` | Нет | Имя релиза | Записывается в каждую запись как `k8s.cluster.name`, чтобы различать кластеры. |
   | `platform` | Нет | `generic` | Одно из значений: `generic`, `k3s`, `eks`, `gke`, `aks`, `ack`, `openshift`. Определяет детекторы облачных ресурсов и имена служб journald. Если не уверены, используйте `generic`. |
   | `timezone` | Нет | `UTC` | Часовой пояс IANA, используемый для строк журнала, в метке времени которых не указан часовой пояс. Правило разбора может переопределить его с помощью `timestamp.timezone`. |

4. Выполните установку:

   ```Bash
   helm install dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
   ```

По умолчанию сборщик включает следующие предустановки сбора:

| Предустановка | По умолчанию | Что собирает | Где работает |
| --- | --- | --- | --- |
| `logsCollection` | Включена | stdout и stderr каждого контейнера во всех пространствах имён | agent |
| `kubeletMetrics` | Включена | Метрики CPU, памяти, сети и файловой системы узлов, подов, контейнеров и томов, включая использование относительно лимитов | agent |
| `hostMetrics` | Включена | Метрики CPU, памяти, нагрузки, дисков, файловой системы и сети узла | agent |
| `otlp` | Включена | Локальная точка приёма OTLP на узле для SDK приложений | agent |
| `clusterMetrics` | Включена | Доступность Deployment, состояния узлов, фазы подов, квоты | cluster |
| `kubernetesEvents` | Включена | События Kubernetes, сохраняемые как журналы | cluster |
| `prometheusScrape` | Выключена | Поды с аннотацией `prometheus.io/scrape` | agent |
| `journald` | Выключена | Системный журнал узла. Требуется образ, содержащий `journalctl` | agent |

:::caution
`examples/ai-observe-stack/dev.yaml` включает отладочный вывод шлюза: в журнал шлюза выводится выборка записей. Если сборщик работает в том же кластере, исключите файлы журналов шлюза, иначе каждая запись будет собираться повторно:

```yaml
logs:
  excludePaths:
    - /var/log/pods/dog_dog-ai-observe-stack-otel-gateway-*/*/*.log
```
:::

## Шаг 3: проверка сбора данных {#step-3-verify-collection}

1. Проверьте поды сборщика. На каждом узле должен быть один под агента, а на весь кластер — один под сборщика кластера:

   ```Bash
   kubectl get pods -n dog -l app.kubernetes.io/instance=dog-k8s-collector -o wide
   ```

   ```text
   NAME                                         READY   STATUS    NODE
   dog-k8s-collector-agent-7x2kq                1/1     Running   node-1
   dog-k8s-collector-agent-p9m4c                1/1     Running   node-2
   dog-k8s-collector-cluster-6f5d9c8b7d-hq2xn   1/1     Running   node-1
   ```

2. Убедитесь, что агент не сообщает об ошибках. Следующая команда не должна ничего выводить:

   ```Bash
   kubectl logs -n dog ds/dog-k8s-collector-agent | grep '"level":"error"'
   ```

3. Выполните запрос к данным в Doris. При использовании варианта A подключите клиент MySQL к порту 9030 вашего Doris FE. При использовании варианта B сначала настройте перенаправление порта FE, затем подключитесь клиентом MySQL:

   ```Bash
   kubectl port-forward -n dog svc/dog-ai-observe-stack-doris-fe-service 9030:9030
   mysql -h127.0.0.1 -P9030 -uroot
   ```

   ```sql
   SELECT service_name, count(*) AS records
   FROM otel.otel_logs
   WHERE timestamp > now() - interval 5 minute
     AND cast(resource_attributes['k8s.cluster.name'] as string) = 'my-cluster'
   GROUP BY 1 ORDER BY 2 DESC;
   ```

   Первые записи поступают в течение 30 секунд после запуска агента. `service_name` — имя рабочей нагрузки, которой принадлежит под; поиск выполняется в порядке Deployment, StatefulSet, DaemonSet, CronJob и Job. Для самостоятельного пода используется его имя. События Kubernetes отображаются как `kubernetes-events`. Собираются только строки журналов, записанные после установки; существующие файлы журналов на узлах повторно не читаются.

4. Откройте Grafana и проверьте дашборды:

   - **Обзор журналов**: фильтрация журналов по пространству имён, сервису, уровню важности и тексту.
   - **События Kubernetes**: количество предупреждений, наиболее частые причины и таблица событий.
   - **Наблюдаемость K8s**: CPU и память узлов и подов.
   - **Самомониторинг сборщика**: длина очередей, сбои и отказы в приёме данных у агента, сборщика кластера и шлюза.

### Сквозной пример {#end-to-end-example}

Следующий под выводит одну строку журнала в формате JSON в секунду, что позволяет проверить весь путь от журналов контейнера до Doris:

```Bash
kubectl create namespace demo
kubectl run json-app -n demo --image=busybox:1.36 --restart=Never -- sh -c \
  'i=0; while true; do i=$((i+1)); echo "{\"time\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"level\":\"info\",\"msg\":\"tick $i\"}"; sleep 1; done'
```

Примерно через 30 секунд выполните запрос в Doris:

```sql
SELECT timestamp, severity_text, body, cast(resource_attributes['k8s.pod.name'] as string) AS pod
FROM otel.otel_logs
WHERE cast(resource_attributes['k8s.namespace.name'] as string) = 'demo'
ORDER BY timestamp DESC LIMIT 5;
```

Строки, в которых `severity_text` имеет значение `INFO`, а `body` содержит текст вида `tick 42`, показывают, что журнал контейнера собран, строка JSON разобрана и метаданные Kubernetes добавлены. Удалите тестовые ресурсы командой `kubectl delete namespace demo`.

## Настройка сбора данных {#configure-collection}

Чтобы изменить настройки сбора, отредактируйте `collector-values.yaml` и выполните:

```Bash
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

Перезапустится только тот компонент, которого коснулись изменения: агент или сборщик кластера. При `agent.storage.enabled=true` позиции чтения файлов сохраняются на том же узле и по тому же пути хранения. Это сокращает повторное чтение, но не гарантирует доставку строго один раз: повторные попытки могут приводить к дублированию записей, а потеря узла или хранилища либо переполнение очереди — к потере данных.

### Выбор пространств имён и контейнеров {#select-namespaces-and-containers}

```yaml
logs:
  namespaces:
    include: ["*"]                          # or a list, such as [shop, payment]
    exclude: [kube-system, monitoring]
  containers:
    exclude: [istio-proxy, linkerd-proxy]   # container names, excluded in every namespace
```

Исключения имеют приоритет над включениями. Данные из собственных подов сборщика никогда не собираются.

### Разбор журналов {#parse-logs}

- **Журналы JSON**: строки, начинающиеся с `{`, разбираются автоматически. `level` или `severity` преобразуется в `severity_text`, `message` или `msg` — в `body`, а остальные ключи сохраняются в `log_attributes`. Для других имён полей задайте `logs.json.severityFields` и `logs.json.messageFields`.
- **Распространённые текстовые форматы**: используйте в правиле встроенную предустановку. `selector.container` сопоставляется с именем контейнера, а не пода или Deployment.

  ```yaml
  logs:
    rules:
      - name: shop-api
        selector: {namespace: "^shop$", container: "^api$"}
        preset: java-spring
  ```

  | Предустановка | Формат |
  | --- | --- |
  | `java-spring` | Стандартный формат консольного вывода Spring Boot 3 с объединением строк трассировок стека |
  | `python-logging` | Стандартный формат Python `logging.basicConfig` |
  | `go-zap-console` | Консольный кодировщик zap |
  | `glog` | glog для C++ и Go |
  | `nginx-access`, `nginx-error` | Журнал доступа nginx в формате combined и журнал ошибок |
  | `mysql`, `postgres`, `redis` | Форматы по умолчанию в официальных образах |
  | `doris-fe`, `doris-fe-audit`, `doris-be` | Журналы FE, аудита FE и BE Apache Doris |
  | `json-generic` | Однострочный JSON |

  Doris FE записывает рабочие журналы и журналы аудита в один и тот же контейнер. Чтобы разбирать оба вида журналов, добавьте два правила с одинаковым селектором: одно с `preset: doris-fe`, другое с `preset: doris-fe-audit`.

- **Пользовательские форматы**: напишите регулярное выражение с именованными группами `ts` (метка времени), `level` (уровень важности) и `msg` (сообщение):

  ```yaml
  logs:
    rules:
      - name: shop-worker
        selector: {namespace: "^shop$", container: "^worker$"}
        regex: '^(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(?P<level>[a-z]+)\s+(?P<msg>(?s:.*))$'
        timestamp: {layout: "%Y-%m-%dT%H:%M:%S.%L%z"}
        severity: {field: level}
        multiline: {firstLinePattern: '^\d{4}-\d{2}-\d{2}T'}   # stack trace lines join the previous record
        drop: ['GET /healthz']                             # dropped on the node
  ```

  Если метка времени в строке журнала не содержит часового пояса, а контейнер работает не в UTC, добавьте `timezone` в `timestamp`, например `timestamp: {layout: "...", timezone: Asia/Shanghai}`. Правила проверяются по порядку, и применяется первое совпавшее правило. Атрибут `dog.log.rule` каждой записи показывает, каким правилом она была разобрана.

  Перед развёртыванием правила его можно проверить на примерах журналов с помощью `hack/test-rule.sh` из репозитория. Для этого нужны helm, yq и Docker:

  ```Bash
  kubectl logs -n shop -l app=worker -c worker --tail=30 > worker.log
  hack/test-rule.sh -f collector-values.yaml -n shop -c worker worker.log
  ```

### Приём OTLP от приложений {#receive-otlp-from-applications}

Приложения, инструментированные с помощью OpenTelemetry SDK, могут отправлять трассировки, метрики и журналы агенту на своём узле, который добавляет метаданные пода, пространства имён и рабочей нагрузки. Откройте порты агента на узле:

```yaml
presets:
  otlp:
    hostPortHttp: 4318
    hostPortGrpc: 4317
```

Затем задайте адрес приёма данных в шаблоне пода приложения:

```yaml
env:
  - name: HOST_IP
    valueFrom: {fieldRef: {fieldPath: status.hostIP}}
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(HOST_IP):4318
  - name: OTEL_EXPORTER_OTLP_PROTOCOL
    value: http/protobuf
  - name: OTEL_SERVICE_NAME
    value: checkout
```

### Сбор метрик Prometheus {#scrape-prometheus-metrics}

Задайте `presets.prometheusScrape.enabled: true`, затем добавьте подам приложения аннотации `prometheus.io/scrape: "true"`, `prometheus.io/port` и `prometheus.io/path`. Метрики записываются в таблицы `otel_metrics_*`, а `service_name` содержит имя рабочей нагрузки.

### Сбор данных из нескольких кластеров {#collect-multiple-clusters}

Установите один релиз сборщика в каждом кластере. В `gateway.endpoint` укажите один и тот же шлюз (для доступа между кластерами используйте LoadBalancer или отдельно настроенный Ingress для gRPC) и задайте каждому кластеру своё значение `clusterName`. В запросах и на дашбордах данные фильтруются по `k8s.cluster.name`.

## Рекомендации для промышленной эксплуатации {#production-recommendations}

| Пункт | Параметр | Описание |
| --- | --- | --- |
| Реплики и диски Doris | `doris.internal.cluster.fe.replicas`, `doris.internal.cluster.be.replicas`, `doris.internal.cluster.persistence` | Как минимум три FE и три BE, с `gateway.dorisExporter.replicationNum: 3`. |
| Реплики и очередь шлюза | `gateway.replicas`, `gateway.persistence.size`, `gateway.dorisExporter.sendingQueue` | Каждая реплика шлюза хранит свою очередь отправки на отдельном PVC. Если запись данных отстаёт, следите за `otelcol_exporter_queue_size` на дашборде «Самомониторинг сборщика». |
| Срок хранения данных | `gateway.dorisExporter.historyDays` | По умолчанию 7 дней. |
| Пароль Grafana | `grafana.adminPassword` или `grafana.existingSecret` | Пароль по умолчанию — `admin`. |
| Внешний доступ | `ingress`, `gateway.service.type` | Ingress для Grafana; приложения за пределами кластера используют путь Ingress для OTLP/HTTP или LoadBalancer. |
| Отладочный вывод | `gateway.debug.enabled: false` | Включён в `dev.yaml`. |
| Область сбора | `logs.namespaces.exclude` | Обычно исключает `kube-system`. |
| Ресурсы сборщика | `agent.resources`, `agent.queueSize` | Каждый агент запрашивает 100m CPU и 128 MiB памяти; лимиты составляют 1 CPU и 512 MiB. Пока шлюз недоступен, каждый узел буферизует на локальном диске до `agent.queueSize` записей (20,000 по умолчанию). |

`examples/ai-observe-stack/prod.yaml` в репозитории — файл значений, который можно взять за основу для промышленной эксплуатации.

По умолчанию `gateway.timeGuard.enabled=true` заменяет метки времени записей за пределами доступного для записи окна партиций временем приёма. В журналах исходное время сохраняется в `log.original_time_unix_nano`, в трассировках — в `span.original_start_time_unix_nano`, а метки времени метрик перезаписываются непосредственно. Для загрузки исторических данных рассмотрите `gateway.dorisExporter.createHistoryDays` вместе с настройками защиты по времени. По умолчанию повторные попытки экспорта в Doris ограничены 10 минутами (`gateway.dorisExporter.retryMaxElapsedTime`); если к этому моменту пакет по-прежнему не удаётся отправить, ошибка записывается в журнал, а пакет отбрасывается.

## Обновление и удаление {#upgrade-and-uninstall}

Обновление или изменение конфигурации:

```Bash
helm upgrade dog ./ai-observe-stack -n dog -f dog-values.yaml
helm upgrade dog-k8s-collector ./dog-k8s-collector -n dog -f collector-values.yaml
```

Удаление:

```Bash
helm uninstall dog-k8s-collector -n dog
helm uninstall dog -n dog
```

Удаление сборщика не влияет на DOG Stack и данные в Doris. Позиции чтения файлов в `/var/lib/otelcol` на узлах сохраняются, и после повторной установки чтение продолжается с последней позиции. При использовании варианта A удаление DOG Stack не удаляет базу данных в вашем Doris.

Helm не удаляет PersistentVolumeClaims шлюза, PersistentVolumeClaims Doris (вариант B с включённым постоянным хранением) и завершённый под `helm test`. Чтобы удалить их, выполните:

```Bash
kubectl delete pvc -n dog -l app.kubernetes.io/instance=dog
kubectl delete pvc -n dog -l 'app.doris.ownerreference/name in (dog-ai-observe-stack-doris-fe,dog-ai-observe-stack-doris-be)'
kubectl delete pod -n dog dog-ai-observe-stack-test-pipeline --ignore-not-found
```

При использовании варианта B Helm также сохраняет CustomResourceDefinition `dorisclusters.doris.selectdb.com`, установленное вместе с Doris Operator, поскольку Helm никогда не удаляет CRD. Удаление CRD удаляет все DorisCluster в кластере Kubernetes, поэтому удаляйте его только тогда, когда под управлением Doris Operator не осталось других кластеров Doris:

```Bash
kubectl delete crd dorisclusters.doris.selectdb.com
```

## Устранение неполадок {#troubleshooting}

| Симптом | Причина и решение |
| --- | --- |
| `helm install` сообщает `missing in charts/ directory: doris-operator` | Зависимость чарта не загружена. Выполните `helm dependency update ./ai-observe-stack`. |
| `helm dependency build` сообщает `no repository definition for https://charts.selectdb.com` | `helm dependency build` использует только репозитории, добавленные с помощью `helm repo add`. Вместо этого выполните `helm dependency update ./ai-observe-stack`. |
| `helm install` сообщает `gateway.endpoint is required` | Задайте адрес шлюза в параметре сборщика `gateway.endpoint`. |
| `helm install` сообщает `additional properties 'xxx' not allowed` | В ключе верхнего уровня файла значений допущена опечатка. |
| `helm test` завершается с ошибкой или журнал шлюза содержит ошибки Doris | Убедитесь, что порты Doris FE 9030 и 8030 доступны, а учётная запись позволяет создавать целевую базу данных и таблицы, загружать в них данные и выполнять запросы к ним. Просмотрите журнал шлюза командой `kubectl logs -n dog dog-ai-observe-stack-otel-gateway-0`. |
| Под агента сообщает `CreateContainerConfigError`, отклоняется механизмом Pod Security или записывает `permission denied` для `/var/log/pods` | В пространстве имён применяется `restricted`. Добавьте метку `privileged`, см. шаг 2. |
| Журнал агента содержит `connection refused` или `Unavailable` | Адрес шлюза неверен, шлюз не работает или сетевая политика блокирует порт 4317. Записи буферизуются на узле и отправляются после устранения проблемы. |
| Под агента остаётся в состоянии `ContainerCreating`, а в его событиях указано `MountVolume.SetUp failed for volume "zoneinfo"` | На узле нет базы данных часовых поясов (встречается в некоторых минимальных образах операционных систем). Задайте `agent.tzdata.hostPath: ""` и оставьте `timezone` и `timestamp.timezone` каждого правила равными UTC. |
| Из пространства имён не поступают журналы | Оно исключено параметром `logs.namespaces.exclude` или `logs.containers.exclude`, либо после установки не было записано новых строк. |
| Журналы поступают, но `service_name` пуст | Агент не может прочитать метаданные подов. Проверьте журнал агента на наличие ошибок RBAC `forbidden`. |
| Правило разбора не действует (`dog.log.rule` пуст) | `selector.container` содержит имя пода вместо имени контейнера либо ранее совпало другое правило. Проверьте с помощью `hack/test-rule.sh`. |
| Время в журналах смещено на несколько часов | Строка журнала не содержит часового пояса, контейнер работает не в UTC, а `timestamp.timezone` не задан. |

Чтобы просмотреть конфигурацию, с которой фактически работает агент, выполните:

```Bash
kubectl get cm -n dog dog-k8s-collector-agent-config -o jsonpath='{.data.config\.yaml}'
```

Все параметры двух чартов описаны в файлах `USER_GUIDE.md` и `values.yaml` каждого чарта в каталоге [helm-charts](https://github.com/ai-observe/ai-observe-stack/tree/main/helm-charts) репозитория.
