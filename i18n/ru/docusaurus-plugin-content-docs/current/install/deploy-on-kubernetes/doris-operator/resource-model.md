---
{
    "title": "Модель ресурсов Doris Operator",
    "sidebar_label": "Модель ресурсов",
    "language": "ru",
    "description": "Описывает модели ресурсов DorisCluster и DorisDisaggregatedCluster и сопоставление компонентов Doris с StatefulSet, Service, PVC, ConfigMap, Secret и HPA.",
    "keywords": ["Doris Operator resource model", "DorisCluster", "DorisDisaggregatedCluster", "StatefulSet", "Service", "PVC"]
}
---

Модель ресурсов Doris Operator описывает, как компоненты кластера Doris сопоставляются со стандартными ресурсами Kubernetes. Понимание этого сопоставления помогает определить, какие поля влияют на те или иные базовые ресурсы, и упрощает диагностику проблем.

Этот документ не содержит полного перечня полей. Настройка отдельных полей описана в соответствующей документации по развёртыванию и конфигурации.

## Минимальный пример {#minimal-example}

Следующий пример показывает минимальный `DorisCluster`. FE и BE сопоставляются с соответствующими ресурсами `StatefulSet`, `Service`, PVC и другими связанными ресурсами.

```yaml
apiVersion: doris.apache.com/v1
kind: DorisCluster
metadata:
  name: demo
  namespace: doris
spec:
  feSpec:
    replicas: 3
    image: apache/doris:fe-2.1.8
  beSpec:
    replicas: 3
    image: apache/doris:be-2.1.8
```

## Обзор {#overview}

Независимо от режима развёртывания пользователь напрямую управляет пользовательским ресурсом Doris. Operator использует этот ресурс для создания стандартных ресурсов Kubernetes, в которых запускаются компоненты Doris.

![Обзор модели ресурсов Doris Operator](/images/doris-operator/mermaid/06-resource-model-overview.jpg)

## DorisCluster {#doriscluster}

`DorisCluster` используется для развёртывания с совмещёнными вычислениями и хранением. Обычно он содержит компоненты FE, BE, CN и Broker.

![Модель ресурсов DorisCluster](/images/doris-operator/mermaid/07-resource-model-doriscluster.jpg)

| Компонент | Описание | Основные ресурсы Kubernetes |
| --- | --- | --- |
| FE | Управление метаданными, доступ по SQL и координация запросов | `StatefulSet`, внутренний Service, внешний Service, PVC |
| BE | Хранение данных и выполнение операций | `StatefulSet`, внутренний Service, внешний Service, PVC |
| CN | Выполнение вычислений в сценариях с эластичными вычислительными ресурсами | `StatefulSet`, внутренний Service, внешний Service, PVC, HPA |
| Broker | Прокси для доступа к внешнему хранилищу; необходимость его использования зависит от версии Doris и рабочей нагрузки | `StatefulSet`, внутренний Service |

## DorisDisaggregatedCluster {#dorisdisaggregatedcluster}

`DorisDisaggregatedCluster` используется для развёртывания с разделением вычислений и хранения. Обычно он содержит MetaService, FE и одну или несколько ComputeGroups.

![Модель ресурсов DorisDisaggregatedCluster](/images/doris-operator/mermaid/08-resource-model-disaggregatedcluster.jpg)

| Компонент | Описание | Основные ресурсы Kubernetes |
| --- | --- | --- |
| MetaService | Сервис метаданных для кластеров с разделением вычислений и хранения | `StatefulSet`, Service, PVC |
| FE | Доступ по SQL, координация запросов и точка доступа к метаданным | `StatefulSet`, внутренний Service, внешний Service, PVC |
| ComputeGroup | Независимая группа вычислительных ресурсов для выполнения вычислительных задач | `StatefulSet`, внутренний Service, внешний Service, PVC |
| FoundationDB | Зависимость для хранения метаданных в кластерах с разделением вычислений и хранения | Внешний сервис или ресурс под управлением `fdb-kubernetes-operator` |

## Типы Service {#service-types}

Doris Operator создаёт ресурсы Service для разных целей.

| Тип Service | Назначение | Типичное использование |
| --- | --- | --- |
| Внутренний Service | Постоянная сетевая идентификация и внутреннее взаимодействие | DNS для StatefulSet, обнаружение компонентов, доступ между Pod |
| Внешний Service | Точка внешнего доступа | Подключения клиентов и доступ из внешних систем |

Внутренний Service обычно не служит точкой доступа для бизнес-приложений. В зависимости от сценария внешний Service можно настроить как `ClusterIP`, `NodePort` или `LoadBalancer`.

## Хранение {#storage}

Doris — система с сохранением состояния. FE, BE, CN, MetaService и ComputeGroups могут нуждаться в каталогах с постоянным хранением данных. Operator привязывает постоянное хранилище с помощью шаблонов PVC.

Обратите внимание на следующее:

- Есть ли в кластере Kubernetes доступный StorageClass.
- Достаточно ли ёмкости PVC с учётом роста объёма данных и журналов.
- Соответствует ли режим доступа рабочей нагрузке.
- Совпадают ли настроенные каталоги Doris с путями монтирования PVC.

Если привязать PVC не удаётся, Operator продолжает ожидание, а затронутые Pod не могут запуститься.

## Ресурсы конфигурации и аутентификации {#configuration-and-authentication-resources}

Doris Operator поддерживает `ConfigMap` и `Secret` для хранения конфигурации и конфиденциальных данных.

| Ресурс | Типичное использование |
| --- | --- |
| `ConfigMap` | Конфигурация запуска FE, BE, CN, Broker, MetaService и ComputeGroups |
| `Secret` | Пароли, учётные данные для доступа и файлы keytab |
| `authSecret` | Учётные данные, используемые Doris Operator для регистрации узлов, вывода их из эксплуатации и связанных операций управления |
| `kerberosInfo` | Конфигурация Kerberos и монтирование keytab |
| `serviceAccount` | Kubernetes ServiceAccount, используемый, когда компонентам нужен доступ к облачным или внешним сервисам |

Приведёт ли обновление конфигурации к перезапуску, зависит от поля и настроек Operator. Например, в режиме с совмещёнными вычислениями и хранением параметр `enableRestartWhenConfigChange` определяет, вызывают ли изменения основных ConfigMap поочерёдный перезапуск.

## Именование {#naming}

В именах ресурсов под управлением Operator в качестве префиксов обычно используются имя кластера и имя компонента, что позволяет легко определить их принадлежность.

Если кластер с совмещёнными вычислениями и хранением называется `demo`, типичные имена выглядят так:

```text
demo-fe
demo-fe-internal
demo-fe-service
demo-be
demo-be-internal
demo-be-service
demo-cn
demo-cn-internal
demo-cn-service
demo-broker
demo-broker-internal
```

Если кластер с разделением вычислений и хранения называется `demo`, а ComputeGroup — `adhoc-query`, типичные имена выглядят так:

```text
demo-ms
demo-fe
demo-fe-internal
demo-adhoc-query
demo-adhoc-query-external
```

Фактические имена могут немного различаться в зависимости от версии или конфигурации. Считайте вывод `kubectl get` достоверным источником информации.

## Зависимости между компонентами {#dependencies-between-components}

Модель ресурсов также подразумевает зависимости между компонентами.

В кластере с совмещёнными вычислениями и хранением FE служит точкой входа, через которую другие компоненты регистрируются и получают доступ к метаданным Doris:

![Зависимости между компонентами в DorisCluster](/images/doris-operator/mermaid/09-resource-model-integrated-dependencies.jpg)

В кластере с разделением вычислений и хранения первым становится готов MetaService, от него зависит FE, а от FE зависят ComputeGroups:

![Зависимости между компонентами в DorisDisaggregatedCluster](/images/doris-operator/mermaid/10-resource-model-decoupled-dependencies.jpg)

Если компонент, от которого зависят другие, ещё не готов, зависимые компоненты могут продолжать ожидание или согласование состояния. Это ожидаемое поведение. Порядок создания ресурсов и внесения изменений описан в документе [Управление жизненным циклом Doris Operator](./lifecycle).
