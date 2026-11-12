---
{
    "title": "Kyuubi",
    "language": "ru",
    "description": "Полное руководство по настройке интеграции Apache Doris с Apache Kyuubi: настройка JDBC Engine, установка драйвера MySQL и выполнение запросов по протоколу Thrift."
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Integrating Apache Kyuubi with Apache Doris as a JDBC data source -->

[Apache Kyuubi](https://kyuubi.apache.org/) — распределённый шлюз с поддержкой нескольких арендаторов, предоставляющий Serverless SQL для Lakehouse. Он может подключаться к таким движкам, как Spark, Flink, Hive и JDBC, и предоставлять доступ по таким протоколам, как Thrift и Trino, что позволяет клиентским приложениям гибко интегрироваться с ним. Apache Kyuubi реализует JDBC Engine и поддерживает диалект Doris, благодаря чему может служить единым шлюзом доступа к Doris и обеспечивать высокую доступность, обнаружение сервисов, изоляцию арендаторов, единую аутентификацию и управление жизненным циклом.

## Сценарии использования {#use-cases}

- Вам нужен единый шлюз доступа к Doris с обнаружением сервисов и высокой доступностью.
- Вам нужны изоляция арендаторов и единая аутентификация в среде с несколькими арендаторами.
- Вам нужен доступ к Doris по протоколу Thrift, совместимому с HiveServer2.
- Вам нужно объединить Doris с такими движками, как Spark, Flink и Hive, через единый шлюз Lakehouse.

## Требования к среде {#environment-requirements}

| Параметр               | Требование                                        |
| ---------------------- | ------------------------------------------------- |
| Версия Apache Kyuubi   | 1.6.0 или выше                                    |
| Порт доступа к Doris   | Порт протокола MySQL на FE (по умолчанию `9030`)   |
| Порт прослушивания Kyuubi | Порт протокола Thrift (по умолчанию `10009`)     |
| Необходимый драйвер    | Драйвер MySQL JDBC `mysql-connector-j-8.x.x.jar`    |

## Этапы развёртывания {#deployment-steps}

Общий порядок действий:

1. Загрузите и распакуйте Apache Kyuubi.
2. Настройте Doris как источник данных JDBC для Kyuubi.
3. Добавьте драйвер MySQL JDBC.
4. Запустите сервис Kyuubi.

### 1. Загрузка Apache Kyuubi {#1-download-apache-kyuubi}

Загрузите установочный пакет Apache Kyuubi версии 1.6.0 или выше с официального сайта и распакуйте его в каталог развёртывания.

Ссылка для загрузки: <https://kyuubi.apache.org/releases.html>

### 2. Настройка Doris как источника данных для Kyuubi {#2-configure-doris-as-a-kyuubi-data-source}

Измените файл конфигурации `$KYUUBI_HOME/conf/kyuubi-defaults.conf`, добавив следующие настройки:

```properties
kyuubi.engine.type=jdbc
kyuubi.engine.jdbc.type=doris
kyuubi.engine.jdbc.driver.class=com.mysql.cj.jdbc.Driver
kyuubi.engine.jdbc.connection.url=jdbc:mysql://xxx:xxx
kyuubi.engine.jdbc.connection.user=***
kyuubi.engine.jdbc.connection.password=***
```

Описание параметров конфигурации:

| Параметр конфигурации                    | Описание                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `kyuubi.engine.type`                     | Тип движка. Используйте `jdbc`.                                                              |
| `kyuubi.engine.jdbc.type`                | Тип сервиса JDBC. Укажите `doris`.                                                           |
| `kyuubi.engine.jdbc.driver.class`        | Имя класса драйвера для подключения к сервису JDBC. Используйте `com.mysql.cj.jdbc.Driver`.   |
| `kyuubi.engine.jdbc.connection.url`      | URL подключения к сервису JDBC. Укажите адрес MySQL Server на Doris FE.                      |
| `kyuubi.engine.jdbc.connection.user`     | Имя пользователя сервиса JDBC.                                                               |
| `kyuubi.engine.jdbc.connection.password` | Пароль сервиса JDBC.                                                                         |

Дополнительные параметры приведены в [справочнике по конфигурации Apache Kyuubi](https://kyuubi.readthedocs.io/en/master/configuration/settings.html).

### 3. Добавление драйвера MySQL {#3-add-the-mysql-driver}

Скопируйте драйвер MySQL JDBC `mysql-connector-j-8.x.x.jar` в каталог `$KYUUBI_HOME/externals/engines/jdbc`.

### 4. Запуск сервиса Kyuubi {#4-start-the-kyuubi-service}

Выполните следующую команду для запуска Kyuubi:

```shell
$KYUUBI_HOME/bin/kyuubi start
```

После успешного запуска Kyuubi по умолчанию прослушивает порт `10009` и предоставляет доступ по протоколу Thrift.

## Пример использования {#usage-example}

Следующий пример показывает, как выполнять запросы к данным Doris по протоколу Thrift с помощью инструмента beeline, входящего в состав Apache Kyuubi.

### 1. Установка соединения {#1-establish-a-connection}

Используйте beeline для подключения к сервису Kyuubi:

```shell
$KYUUBI_HOME/bin/beeline -u "jdbc:hive2://xxxx:10009/"
```

### 2. Выполнение запроса {#2-execute-a-query}

Выполните запрос `select * from demo.example_tbl;`. Ожидаемый вывод:

```shell
0: jdbc:hive2://xxxx:10009/> select * from demo.example_tbl;

2023-03-07 09:29:14.771 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: PENDING_STATE -> RUNNING_STATE, statement:
select * from demo.example_tbl
2023-03-07 09:29:14.786 INFO org.apache.kyuubi.operation.ExecuteStatement: Query[bdc59dd0-ceea-4c02-8c3a-23424323f5db] in FINISHED_STATE
2023-03-07 09:29:14.787 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: RUNNING_STATE -> FINISHED_STATE, time taken: 0.015 seconds
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| user_id  |    date     |   city    | age  | sex  |    last_visit_date     | cost  | max_dwell_time  | min_dwell_time  |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| 10000    | 2017-10-01  | Beijing   | 20   | 0    | 2017-10-01 07:00:00.0  | 70    | 10              | 2               |
| 10001    | 2017-10-01  | Beijing   | 30   | 1    | 2017-10-01 17:05:45.0  | 4     | 22              | 22              |
| 10002    | 2017-10-02  | Shanghai  | 20   | 1    | 2017-10-02 12:59:12.0  | 400   | 5               | 5               |
| 10003    | 2017-10-02  | Guangzhou | 32   | 0    | 2017-10-02 11:20:00.0  | 60    | 11              | 11              |
| 10004    | 2017-10-01  | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15.0  | 200   | 3               | 3               |
| 10004    | 2017-10-03  | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22.0  | 22    | 6               | 6               |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
6 rows selected (0.068 seconds)
```
