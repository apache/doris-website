---
{
    "title": "Интеграция с SeaweedFS",
    "language": "ru"
}
---

[SeaweedFS](https://seaweedfs.com/) — распределённая система хранения, которая предоставляет как объектный API, совместимый с S3, так и Apache Iceberg REST Catalog в рамках одного процесса `weed`. Данные Parquet и метаданные Iceberg обслуживаются одним исполняемым файлом, а для аутентификации используется одна пара учётных данных S3.

На этой странице приведена минимальная конфигурация для построения lakehouse на базе Iceberg с использованием SeaweedFS и Doris. Тот же сквозной сценарий проверяется интеграционным тестом [`TestDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris) в репозитории SeaweedFS: он запускает мини-кластер SeaweedFS, регистрирует в Doris каталог Iceberg для подключения к этому кластеру, записывает строки с помощью PyIceberg и считывает их через `apache/doris:doris-all-in-one-2.1.0`.

## Почему SeaweedFS подходит для lakehouse на базе Iceberg {#why-seaweedfs-for-an-iceberg-lakehouse}

Типичный современный стек lakehouse объединяет три уровня:

* Объектное хранилище (S3 или совместимое с ним)
* Отдельный каталог Iceberg (Hive Metastore, Glue, Polaris, Lakekeeper, Nessie, ...)
* Движок выполнения запросов (Doris, Spark, Trino, ...)

SeaweedFS объединяет первые два уровня в одном процессе. Один и тот же исполняемый файл `weed` выполняет обе функции:

* объектного хранилища, совместимого с S3, в котором находятся файлы parquet;
* Iceberg REST Catalog, в котором хранятся метаданные таблиц.

Таким образом, Doris взаимодействует с одной системой вместо двух. На практике это даёт следующие преимущества:

* **Меньше компонентов.** Не нужны Hive Metastore, Glue, Postgres для хранения данных отдельного каталога или настройка роли STS.
* **Простое развёртывание.** Один исполняемый файл, одна конфигурация IAM и одна пара учётных данных S3, которую совместно используют клиент Iceberg REST в Doris и его компонент чтения S3.
* **Удобство локального развёртывания и размещения на собственной инфраструктуре.** Ни один компонент не требует облачного сервиса. Одна и та же конфигурация работает на ноутбуке, отдельной виртуальной машине или в кластере Kubernetes.
* **Меньше задержек при работе с метаданными.** Состояние каталога хранится в том же компоненте filer SeaweedFS, который обслуживает данные, поэтому поиск пространств имён и таблиц не требует обращения к отдельному сервису.
* **Хранение на диске в стандартном формате S3.** Таблицы хранятся в виде стандартных директорий Iceberg в бакетах S3. Любой клиент S3 (rclone, `aws s3`, Spark, Trino, Dremio, RisingWave) может читать или реплицировать их наряду с Doris.

Архитектура:

```text
Doris
  |
  v
Iceberg tables
  |
  v
SeaweedFS  (S3 storage + REST catalog)
```

Для небольших команд или внутренних платформ это простой способ построить lakehouse без зависимости от отдельного сервиса метаданных.

## 1. Запуск SeaweedFS {#1-start-seaweedfs}

Соберите или установите `weed` из [github.com/seaweedfs/seaweedfs](https://github.com/seaweedfs/seaweedfs).

Создайте конфигурацию IAM, предоставляющую ключу доступа полные права на S3. Этот же ключ используется в качестве клиента OAuth2 для конечной точки Iceberg REST:

```json
{
  "identities": [
    {
      "name": "doris",
      "credentials": [
        {
          "accessKey": "AKIAIOSFODNN7EXAMPLE",
          "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
      ],
      "actions": ["Admin"]
    }
  ]
}
```

Запустите кластер в одном процессе с конечной точкой Iceberg REST и предварительно созданным бакетом таблиц:

```bash
weed mini \
  -ip $(hostname -I | awk '{print $1}') \
  -dir /var/lib/seaweedfs \
  -s3.config /etc/seaweedfs/iam_config.json \
  -tableBucket iceberg-tables
```

`weed mini` запускает master, volume, filer, S3 и каталог Iceberg REST в одном процессе. Порты по умолчанию:

| Компонент | Порт | Флаг переопределения |
| --------- | ---- | ------------- |
| Master HTTP | 9333 | `-master.port` |
| Filer HTTP | 8888 | `-filer.port` |
| S3 | 8333 | `-s3.port` |
| Iceberg REST | 8181 | `-s3.port.iceberg` |

`-tableBucket iceberg-tables` создаёт при запуске бакет S3 Tables — бакет с поддержкой Iceberg, в который Doris будет записывать данные.

Чтобы проверить доступность каталога:

```bash
curl -s http://SEAWEED_HOST:8181/v1/config | jq .
```

## 2. Регистрация каталога Iceberg в Doris {#2-register-the-iceberg-catalog-in-doris}

```sql
CREATE CATALOG seaweedfs PROPERTIES (
    "type" = "iceberg",
    "iceberg.catalog.type" = "rest",
    "uri" = "http://SEAWEED_HOST:8181",
    "warehouse" = "s3://iceberg-tables",
    "credential" = "AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.endpoint" = "http://SEAWEED_HOST:8333",
    "s3.access_key" = "AKIAIOSFODNN7EXAMPLE",
    "s3.secret_key" = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.region" = "us-west-2",
    "use_path_style" = "true"
);
```

Примечания:

* `credential = "<access_key>:<secret_key>"` передаётся клиентом Iceberg REST в Doris в качестве учётных данных клиента OAuth2. SeaweedFS проверяет их по той же конфигурации IAM, которая защищает конечную точку S3.
* Свойства `s3.*` используются собственными компонентами Doris для чтения и записи parquet. Они указывают на тот же процесс `weed`, с тем же хостом и той же парой ключей.
* `use_path_style = "true"` обязателен, поскольку SeaweedFS по умолчанию обслуживает S3 в режиме path-style.
* Интеграционный тест использует именно эти свойства; эталонный вариант см. в [`createDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/blob/master/test/s3tables/catalog_doris/doris_catalog_test.go).

Если до регистрации каталога вы создали пространства имён или таблицы вне Doris (например, с помощью PyIceberg), обновите кеш метаданных:

```sql
REFRESH CATALOG seaweedfs;
```

## 3. Работа с каталогом {#3-use-the-catalog}

```sql
USE seaweedfs;

CREATE DATABASE IF NOT EXISTS demo;

USE seaweedfs.demo;

CREATE TABLE iceberg_smoke (
  id BIGINT,
  label STRING
);

INSERT INTO iceberg_smoke VALUES (1, 'one'), (2, 'two'), (3, 'three');

SELECT id, label FROM iceberg_smoke ORDER BY id;
```

Ожидаемый результат:

```text
+----+-------+
| id | label |
+----+-------+
|  1 | one   |
|  2 | two   |
|  3 | three |
+----+-------+
```

Этот же сценарий проверяет интеграционный тест SeaweedFS: пространство имён и таблица создаются через каталог Iceberg REST, строки добавляются с помощью PyIceberg, а Doris читает их стандартным способом через S3 с использованием метаданных Iceberg.

## Примечания для промышленной эксплуатации {#production-notes}

* Для промышленного кластера замените `weed mini` на `weed master`, `weed volume`, `weed filer` и `weed s3 -iceberg.port=8181` (или используйте Helm chart SeaweedFS). Конфигурация на стороне Doris остаётся той же, меняются только хост и порты.
* Учётные данные OAuth2 — это ключ доступа S3. Чтобы сменить учётные данные доступа Doris к каталогу, смените их у соответствующей учётной записи IAM, как и для любого пользователя S3.
* Обслуживание таблиц Iceberg (компакция, удаление устаревших снимков, удаление файлов без ссылок, перезапись манифестов) встроено в SeaweedFS и выполняется в том же бакете. Подробности см. в [вики SeaweedFS Iceberg Catalog](https://github.com/seaweedfs/seaweedfs/wiki/SeaweedFS-Iceberg-Catalog).

## Ссылки {#references}

* [SeaweedFS](https://github.com/seaweedfs/seaweedfs)
* [Интеграционный тест Doris Iceberg в SeaweedFS](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris)
* [Справочник по Doris Iceberg Catalog](https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog)
