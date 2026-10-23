---
{
    "title": "Модель ресурсов Doris Operator",
    "sidebar_label": "Модель ресурсов",
    "language": "ru",
    "description": "Описание моделей ресурсов DorisCluster и DorisDisaggregatedCluster и сопоставления компонентов Doris с StatefulSet, Service, PVC, ConfigMap, Secret и HPA.",
    "keywords": ["Модель ресурсов Doris Operator", "DorisCluster", "DorisDisaggregatedCluster", "StatefulSet", "Service", "PVC"]
}
---

Модель ресурсов Doris Operator описывает, как компоненты кластера Doris сопоставляются с нативными ресурсами Kubernetes. Понимание этого сопоставления помогает определить, какие поля влияют на какие ресурсы, и упрощает диагностику неполадок.

В этом документе перечислены не все поля. Настройка отдельных полей описана в соответствующих документах по развёртыванию и конфигурации.

## Минимальный пример {#minimal-example}

Следующий пример показывает минимальную конфигурацию `DorisCluster`. FE и BE сопоставляются с соответствующими ресурсами `StatefulSet`, `Service`, PVC и связанными ресурсами.

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

Независимо от режима развёртывания пользователь напрямую управляет пользовательским ресурсом Doris. На его основе Operator создаёт нативные ресурсы Kubernetes, в которых запускаются компоненты Doris.

![Обзор модели ресурсов Doris Operator](/images/doris-operator/mermaid/06-resource-model-overview.jpg)

## DorisCluster {#doriscluster}

`DorisCluster` используется для развёртываний с совмещёнными вычислениями и хранением. В его состав обычно входят компоненты FE, BE, CN и Broker.

![Модель ресурсов DorisCluster](/images/doris-operator/mermaid/07-resource-model-doriscluster.jpg)

| Компонент | Описание | Основные ресурсы Kubernetes |
| --- | --- | --- |
| FE | Управление метаданными, доступ по SQL и координация запросов | `StatefulSet`, внутренний Service, внешний Service, PVC |
| BE | Хранение данных и выполнение операций | `StatefulSet`, внутренний Service, внешний Service, PVC |
| CN | Выполнение вычислений в сценариях с эластичным масштабированием вычислительных ресурсов | `StatefulSet`, внутренний Service, внешний Service, PVC, HPA |
| Broker | Прокси для доступа к внешним хранилищам; его необходимость зависит от версии Doris и рабочей нагрузки | `StatefulSet`, внутренний Service |

## DorisDisaggregatedCluster {#dorisdisaggregatedcluster}

`DorisDisaggregatedCluster` используется для развёртываний с разделением вычислений и хранения. В его состав обычно входят MetaService, FE и одна или несколько групп ComputeGroup.

![Модель ресурсов DorisDisaggregatedCluster](/images/doris-operator/mermaid/08-resource-model-disaggregatedcluster.jpg)

| Компонент | Описание | Основные ресурсы Kubernetes |
| --- | --- | --- |
| MetaService | Сервис метаданных для кластеров с разделением вычислений и хранения | `StatefulSet`, Service, PVC |
| FE | Доступ по SQL, координация запросов и точка входа для доступа к метаданным | `StatefulSet`, внутренний Service, внешний Service, PVC |
| ComputeGroup | Независимая группа вычислительных ресурсов для выполнения вычислительных задач | `StatefulSet`, внутренний Service, внешний Service, PVC |
| FoundationDB | Система метаданных, необходимая для кластеров с разделением вычислений и хранения | Внешний сервис или сервис под управлением `fdb-kubernetes-operator` |

## Типы Service {#service-types}

Doris Operator создаёт ресурсы Service для разных целей.

| Тип Service | Назначение | Типичное использование |
| --- | --- | --- |
| внутренний Service | Стабильный сетевой идентификатор и внутренняя связь | DNS для StatefulSet, обнаружение компонентов, доступ Pod-to-Pod |
| внешний Service | Точка входа для внешнего доступа | Подключения клиентов и доступ внешних систем |

Внутренний Service обычно не служит точкой входа для доступа кластера со стороны приложений. В зависимости от сценария внешний Service можно настроить как `ClusterIP`, `NodePort` или `LoadBalancer`.

## Хранение {#storage}

Doris хранит состояние. FE, BE, CN, MetaService и группам ComputeGroup могут потребоваться каталоги с постоянным хранением данных. Operator привязывает постоянное хранилище с помощью шаблонов PVC.

Обратите внимание на следующее:

- Есть ли в кластере Kubernetes доступный StorageClass.
- Достаточно ли ёмкости PVC для роста объёма данных и журналов.
- Подходит ли режим доступа для рабочей нагрузки.
- Соответствуют ли настроенные каталоги Doris путям монтирования PVC.

Если привязать PVC не удаётся, Operator продолжает ожидать, а соответствующие Pod не могут запуститься.

## Ресурсы конфигурации и аутентификации {#configuration-and-authentication-resources}

Doris Operator поддерживает `ConfigMap` и `Secret` для хранения конфигурации и конфиденциальных данных.

| Ресурс | Типичное использование |
| --- | --- |
| `ConfigMap` | Конфигурация запуска FE, BE, CN, Broker, MetaService и групп ComputeGroup |
| `Secret` | Пароли, учётные данные для доступа и файлы keytab |
| `authSecret` | Учётные данные, которые Doris Operator использует для регистрации узлов, вывода их из эксплуатации и связанных операций управления |
| `kerberosInfo` | Конфигурация Kerberos и монтирование файлов keytab |
| `serviceAccount` | Kubernetes ServiceAccount, используемый, когда компонентам нужен доступ к облачным или внешним сервисам |

Приводит ли обновление конфигурации к перезапуску, зависит от поля и настроек Operator. Например, в режиме с совмещёнными вычислениями и хранением `enableRestartWhenConfigChange` определяет, вызывают ли изменения основных ConfigMap последовательный перезапуск.

## Именование {#naming}

Имена ресурсов под управлением Operator обычно содержат имя кластера и имя компонента в качестве префиксов, что позволяет легко определить их принадлежность.

Если кластер с совмещёнными вычислениями и хранением называется `demo`, типичные имена ресурсов выглядят так:

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

Если кластер с разделением вычислений и хранения называется `demo`, а группа ComputeGroup называется `adhoc-query`, типичные имена ресурсов выглядят так:

```text
demo-ms
demo-fe
demo-fe-internal
demo-adhoc-query
demo-adhoc-query-external
```

Фактические имена могут немного различаться в зависимости от версии или конфигурации. Считайте вывод `kubectl get` достоверным источником.

## Зависимости между компонентами {#dependencies-between-components}

Модель ресурсов также отражает зависимости между компонентами.

В кластере с совмещёнными вычислениями и хранением FE служит точкой входа, через которую другие компоненты регистрируются и получают доступ к метаданным Doris:

![Зависимости между компонентами в DorisCluster](/images/doris-operator/mermaid/09-resource-model-integrated-dependencies.jpg)

В кластере с разделением вычислений и хранения MetaService переходит в состояние готовности первым, FE зависит от него, а группы ComputeGroup зависят от FE:

![Зависимости между компонентами в DorisDisaggregatedCluster](/images/doris-operator/mermaid/10-resource-model-decoupled-dependencies.jpg)

Если компонент, от которого зависят другие компоненты, ещё не готов, зависимые компоненты могут продолжать ожидание или согласование состояния. Это ожидаемое поведение. Порядок создания ресурсов и применения изменений описан в разделе [Управление жизненным циклом Doris Operator](./lifecycle).
