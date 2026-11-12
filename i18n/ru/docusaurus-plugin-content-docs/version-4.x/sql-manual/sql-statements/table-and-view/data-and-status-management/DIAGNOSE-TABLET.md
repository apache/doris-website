---
{
    "title": "DIAGNOSE TABLET",
    "language": "ru",
    "description": "В режиме совмещённых вычислений и хранения этот оператор используется для диагностики указанного tablet."
}
---

## Описание {#description}

В режиме совмещённых вычислений и хранения этот оператор используется для диагностики указанного tablet. Результат содержит сведения о tablet и возможных проблемах.

Эта команда не поддерживается в режиме разделения хранения и вычислений.

## Синтаксис {#syntax}

```sql
SHOW TABLET DIAGNOSIS <tablet_id>;
```

## Обязательные параметры {#required-parameters}

<tablet_id>

> ID диагностируемого tablet

## Возвращаемое значение (Возвращаемое значение) {#return-value-return-value}

Возвращает сведения о tablet

- TabletExist

  > Существует ли tablet

- TabletId

    > ID tablet

- Database

  > База данных, к которой относится tablet, и её ID

- Table

  > Таблица, к которой относится tablet, и её ID

- Partition

  > Секция, к которой относится tablet, и её ID

- MaterializedIndex

  > Материализованное представление, к которому относится tablet, и его ID

- Replicas

  > Реплики tablet и соответствующие им узлы BE

- ReplicasNum

  > Корректно ли количество реплик

- ReplicaBackendStatus

  > Исправны ли узлы BE, на которых расположены реплики

- ReplicaVersionStatus

  > Корректны ли номера версий реплик

- ReplicaStatus

  > В норме ли состояние реплик

- ReplicaCompactionStatus

  > В норме ли состояние compaction реплик

## Примеры {#examples}

1. Диагностика tablet с указанным ID 10078

  ```sql
  show tablet diagnosis 10078;
  +----------------------------------+---------------------------------------------+------------+
  | Item                             | Info                                        | Suggestion |
  +----------------------------------+---------------------------------------------+------------+
  | TabletExist                      | Yes                                         |            |
  | TabletId                         | 10078                                       |            |
  | Database                         | __internal_schema: 10005                    |            |
  | Table                            | audit_log: 10058                            |            |
  | Partition                        | p20241109: 10075                            |            |
  | MaterializedIndex                | audit_log: 10059                            |            |
  | Replicas(ReplicaId -> BackendId) | {"10099":10003,"10116":10002,"10079":10004} |            |
  | ReplicasNum                      | OK                                          |            |
  | ReplicaBackendStatus             | OK                                          |            |
  | ReplicaVersionStatus             | OK                                          |            |
  | ReplicaStatus                    | OK                                          |            |
  | ReplicaCompactionStatus          | OK                                          |            |
  +----------------------------------+---------------------------------------------+------------+
  ```

## Требования к управлению доступом (Требования к управлению доступом) {#access-control-requirements-access-control-requirements}

Для успешного выполнения этой команды SQL необходима привилегия ADMIN_PRIV. Подробнее см. в документации по привилегиям.

| Привилегия (Привилегия) | Объект (Объект)                      | Примечания (Примечания)                   |
| :-------------------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV            | Права управления всем кластером | Все привилегии, кроме NODE_PRIV |

## Примечание по использованию (Примечание по использованию) {#usage-note-usage-note}

1. Эта команда не поддерживается в режиме разделения хранения и вычислений. Её выполнение в этом режиме приведёт к ошибке, например:

  ```sql
  show tablet diagnosis 15177;
  ```

  Сообщение об ошибке:

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```
