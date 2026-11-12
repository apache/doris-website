---
{
    "title": "Быстрый старт",
    "language": "ru",
    "description": "Разверните кластер Flink и используйте Flink Doris Connector для чтения данных из таблицы Doris и записи в неё с помощью FlinkSQL."
}
---

# Быстрый старт {#quick-start}

На этой странице приведён полный пример: от развёртывания кластера Flink до чтения и записи данных Doris с помощью FlinkSQL. Прежде чем начать, выберите выпуск Connector, совместимый с вашими версиями Flink и Doris, согласно [примечаниям к версиям](./overview.md#version-notes), и получите пакет Jar, как описано в разделе [Установка](./overview.md#installation).

## 1. Развёртывание кластера Flink {#1-deploy-a-flink-cluster}

Рассмотрим на примере кластера Standalone:

1. Скачайте установочный пакет [Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz).
2. После распаковки поместите пакет Jar Flink Doris Connector в `<FLINK_HOME>/lib`.
3. Перейдите в каталог `<FLINK_HOME>` и выполните `bin/start-cluster.sh`, чтобы запустить кластер Flink.
4. Используйте команду `jps`, чтобы убедиться, что кластер Flink успешно запущен.

## 2. Инициализация таблицы Doris {#2-initialize-the-doris-table}

Выполните следующий SQL-код, чтобы создать таблицы Doris и записать тестовые данные:

```sql
CREATE DATABASE test;

CREATE TABLE test.student (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

INSERT INTO test.student values(1, "James", 18);
INSERT INTO test.student values(2, "Emily", 28);

CREATE TABLE test.student_trans (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## 3. Запуск задания FlinkSQL {#3-run-a-flinksql-job}

Запустите клиент FlinkSQL:

```shell
bin/sql-client.sh
```

Выполните следующий код FlinkSQL:

```sql
CREATE TABLE Student (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

CREATE TABLE StudentTrans (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_trans',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'doris_label'
);

INSERT INTO StudentTrans SELECT id, concat('prefix_', name), age + 1 FROM Student;
```

## 4. Запрос результата {#4-query-the-result}

```text
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```

## Дальнейшие шаги {#next-steps}

- [Чтение данных из Doris](./read.md) и [Запись данных в Doris](./write.md): протоколы чтения, режимы записи и их параметры.
- [Синхронизация всей базы данных](./cdc-sync.md): синхронизация баз данных MySQL и других СУБД с Doris одной командой.
