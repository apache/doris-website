---
{
    "title": "Резервное копирование",
    "language": "ru",
    "description": "Используйте функцию резервного копирования Doris, чтобы сохранять базы данных, таблицы или партиции в виде снимков в удалённых хранилищах, таких как S3, Azure, GCP, OSS, MinIO и HDFS. В этом руководстве приведён полный порядок действий.",
    "keywords": [
        "Doris backup",
        "BACKUP SNAPSHOT",
        "CREATE REPOSITORY",
        "data backup",
        "full backup",
        "snapshot",
        "Repository",
        "S3 backup",
        "Azure backup",
        "HDFS backup",
        "OSS backup",
        "MinIO backup",
        "GCP backup",
        "partition backup",
        "database backup",
        "show backup",
        "cancel backup"
    ]
}
---

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Data backup / Disaster recovery setup / Cross-cluster migration -->

Doris позволяет создавать резервные копии баз данных, таблиц или партиций в виде снимков в удалённом хранилище и при необходимости [восстанавливать](./restore) их. Этот документ предназначен для администраторов баз данных и инженеров по эксплуатации, которым необходимо выполнять регулярное резервное копирование, проводить учения по аварийному восстановлению или переносить данные между кластерами. В нём описаны основные понятия, предварительные требования и полный порядок резервного копирования.

## Сценарии использования {#applicable-scenarios}

| Сценарий | Описание |
| --- | --- |
| Регулярное резервное копирование данных | Периодически создавайте полные резервные копии баз данных, таблиц или партиций, чтобы предотвратить потерю данных из-за случайного удаления или отказа оборудования. |
| Аварийное восстановление | Сохраняйте резервные копии в удалённом хранилище на внешней площадке (S3, HDFS и т. д.), чтобы восстановить данные при отказе всего кластера. |
| Перенос данных между кластерами | Создайте резервную копию в исходном кластере и восстановите её в целевом кластере, чтобы перенести данные между ними. |
| Подготовка данных для тестовой среды | Создайте резервную копию части таблиц или партиций рабочей среды и восстановите их в тестовом кластере. |
| Имитация инкрементального резервного копирования | Создавайте резервные копии только новых или изменённых партиций, чтобы приблизиться к поведению инкрементального резервного копирования (Doris пока не поддерживает встроенное инкрементальное резервное копирование). |

## Предварительные требования {#prerequisites}

Перед выполнением резервного копирования убедитесь, что соблюдены следующие условия:

- **Права доступа**: учётная запись, от имени которой выполняется операция, имеет права **ADMIN** (они необходимы как для резервного копирования, так и для восстановления).
- **Режим развёртывания**: текущий кластер работает в режиме с объединёнными вычислениями и хранением (**режим с разделением вычислений и хранения не поддерживает** резервное копирование и восстановление).
- **Удалённое хранилище**: подготовлено доступное удалённое хранилище (S3, Azure, GCP, OSS, COS, MinIO, HDFS или другое S3-совместимое объектное хранилище) и получены соответствующие учётные данные для доступа.
- **Сетевая доступность**: узлы FE и BE могут обращаться к конечной точке удалённого хранилища.
- **Ограничения для объектов**: объекты, для которых создаются резервные копии, не относятся к следующим неподдерживаемым типам:
    - Асинхронные материализованные представления (MTMV)
    - Таблицы, использующие [политику хранения](../../../table-design/tiered-storage/remote-storage)

## Основные понятия {#key-concepts}

| Понятие | Определение |
| --- | --- |
| Снимок | Зафиксированное состояние данных базы данных, таблицы или партиции на определённый момент времени. При создании снимка необходимо указать его Label, а после завершения создания формируется временная метка. Снимок однозначно определяется сочетанием Repository, Label снимка и временной метки. |
| Repository | Удалённое расположение для хранения файлов резервных копий. Поддерживаются S3, Azure, GCP, OSS, COS, MinIO, HDFS и другие S3-совместимые объектные хранилища. |
| Операция резервного копирования | Создаёт снимок базы данных, таблицы или партиции, загружает файлы снимка в удалённый Repository и сохраняет метаданные резервной копии. |
| Операция восстановления | Скачивает снимок из удалённого Repository и восстанавливает его в кластере Doris. |

## Ограничения использования {#usage-limitations}

| Ограничение | Описание |
| --- | --- |
| Режим с разделением вычислений и хранения не поддерживается | Функции резервного копирования и восстановления недоступны в режиме развёртывания с разделением вычислений и хранения. |
| Асинхронные материализованные представления (MTMV) не поддерживаются | Операции резервного копирования и восстановления не включают асинхронные материализованные представления. |
| Таблицы с политикой хранения не поддерживаются | Таблицы, использующие [политику хранения](../../../table-design/tiered-storage/remote-storage), не поддерживают операции резервного копирования и восстановления. |
| Поддерживаются только полные резервные копии | В настоящее время Doris поддерживает только полное резервное копирование. Инкрементальное резервное копирование (сохранение только данных, изменившихся с момента последнего резервного копирования) пока не поддерживается. Можно имитировать его поведение, создавая резервные копии отдельных партиций. |
| Свойство `colocate_with` не сохраняется | При резервном копировании или восстановлении Doris не сохраняет свойство таблицы `colocate_with`. После восстановления может потребоваться повторно настроить таблицы colocate. |
| Динамическое партиционирование необходимо включить повторно | После восстановления таблицы необходимо вручную включить свойство динамического партиционирования с помощью команды `ALTER TABLE`. |
| Ограничение на одновременное выполнение | В пределах одной базы данных одновременно может выполняться только одна задача резервного копирования или восстановления. |

## Обзор процесса резервного копирования {#backup-workflow-overview}

Полный процесс резервного копирования состоит из следующих 5 шагов:

1. **Создайте Repository**: зарегистрируйте в Doris расположение в удалённом хранилище.
2. **Выполните резервное копирование**: запустите задачу резервного копирования с помощью `BACKUP SNAPSHOT`.
3. **Проверьте ход резервного копирования**: используйте `SHOW BACKUP`, чтобы проверить состояние выполнения задачи.
4. **Просмотрите существующие снимки в Repository**: используйте `SHOW SNAPSHOT`, чтобы получить список доступных резервных копий.
5. **(Необязательно) Отмените резервное копирование**: при возникновении ошибки завершите задачу с помощью `CANCEL BACKUP`.

В следующих разделах каждый шаг описан в указанном порядке.

## Шаг 1: создание Repository {#step-1-create-a-repository}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Remote storage integration / Backup preparation -->

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

Выберите команду создания Repository в зависимости от типа используемого удалённого хранилища. Подробности см. в разделе [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY).

:::tip
Если для резервного копирования из разных кластеров используются Repository с одинаковым путём, обязательно задавайте разные значения Label, чтобы избежать конфликтов путей и повреждения данных.
:::

Ниже приведены способы создания Repository для каждого типа удалённого хранилища:

| Способ | Удалённое хранилище | Примечания |
| --- | --- | --- |
| Способ 1 | S3 | AWS S3 или S3-совместимое объектное хранилище |
| Способ 2 | Azure Blob Storage | Поддерживается начиная с Doris 3.1.3 |
| Способ 3 | GCP (Google Cloud Storage) | Необходимо указать фиктивное значение `s3.region` |
| Способ 4 | OSS (Alibaba Cloud Object Storage) | Нет |
| Способ 5 | MinIO | Если Virtual Host-style не включён, требуется `use_path_style=true` |
| Способ 6 | HDFS | Нет |

### Способ 1: создание Repository в S3 {#method-1-create-a-repository-on-s3}

Создайте Repository в AWS S3:

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://bucket_name/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

Примечания:

- Замените `bucket_name` именем вашего бакета S3.
- Укажите соответствующие значения `endpoint`, `access key`, `secret key` и `region` для настройки S3.

### Способ 2: создание Repository в Azure {#method-2-create-a-repository-on-azure}

**Поддерживается начиная с Doris 3.1.3.**

Создайте Repository в Azure Blob Storage:

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://<container_name>/azure_repo"
PROPERTIES
(
    "azure.endpoint" = "https://<account_name>.blob.core.windows.net",
    "azure.account_name" = "<account_name>",
    "azure.account_key" = "<account_key>",
    "provider" = "AZURE"
);
```

Примечания:

- Замените `<container_name>` именем вашего контейнера Azure.
- Укажите учётную запись хранилища Azure и ключ для аутентификации.
- Значение `provider` должно быть `AZURE`.

### Способ 3: создание Repository в GCP {#method-3-create-a-repository-on-gcp}

Создайте Repository в хранилище Google Cloud Platform (GCP):

```sql
CREATE REPOSITORY `gcp_repo`
WITH S3
ON LOCATION "s3://bucket_name/backup/gcp_repo"
PROPERTIES
(
    "s3.endpoint" = "storage.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

Примечания:

- Замените `bucket_name` именем вашего бакета GCP.
- Укажите значения `endpoint`, `access key` и `secret key` для GCP.
- `s3.region` задаёт лишь фиктивный регион. Можно указать любое значение, но сам параметр обязателен.

### Способ 4: создание Repository в OSS (Alibaba Cloud Object Storage Service) {#method-4-create-a-repository-on-oss-alibaba-cloud-object-storage-service}

Создайте Repository в OSS:

```sql
CREATE REPOSITORY `oss_repo`
WITH S3
ON LOCATION "s3://bucket_name/oss_repo"
PROPERTIES
(
    "s3.endpoint" = "oss.aliyuncs.com",
    "s3.region" = "cn-hangzhou",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

Примечания:

- Замените `bucket_name` именем вашего бакета OSS.
- Укажите значения `endpoint`, `region`, `access key` и `secret key` для OSS.

### Способ 5: создание Repository в MinIO {#method-5-create-a-repository-on-minio}

Создайте Repository в хранилище MinIO:

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://bucket_name/minio_repo"
PROPERTIES
(
    "s3.endpoint" = "yourminio.com",
    "s3.region" = "dummy-region",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "use_path_style" = "true"
);
```

Примечания:

- Замените `bucket_name` именем вашего бакета MinIO.
- Укажите значения `endpoint`, `access key` и `secret key` для MinIO.
- `s3.region` задаёт лишь фиктивный регион. Можно указать любое значение, но сам параметр обязателен.
- Если Virtual Host-style не включён, параметру `use_path_style` необходимо присвоить значение `true`.

### Способ 6: создание Repository в HDFS {#method-6-create-a-repository-on-hdfs}

Создайте Repository в HDFS:

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://127.0.0.1:9000/prefix_path/hdfs_repo"
PROPERTIES
(
    "fs.defaultFS" = "hdfs://127.0.0.1:9000",
    "hadoop.username" = "doris-test"
)
```

Примечания:

- Замените `prefix_path` фактическим путём.
- Укажите `endpoint` и имя пользователя для HDFS.

## Шаг 2: выполнение резервного копирования {#step-2-perform-the-backup}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Database/table/partition backup -->

Запустите задачу резервного копирования с помощью `BACKUP SNAPSHOT`. Подробности см. в разделе [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP).

:::tip
Рекомендуется выбирать осмысленное имя Label, например включать в него названия баз данных и таблиц, содержащихся в резервной копии. Это упростит последующий поиск резервных копий и управление ими.
:::

В зависимости от объектов резервного копирования можно выбрать разные варианты команды:

| Способ | Объект резервного копирования | Сценарий использования |
| --- | --- | --- |
| Способ 1 | Текущая база данных | Полное резервное копирование базы данных, выбранной командой `USE` |
| Способ 2 | Указанная база данных | Полное резервное копирование базы данных с явно заданным именем |
| Способ 3 | Указанные таблицы | Резервное копирование только определённых таблиц |
| Способ 4 | Указанные партиции | Резервное копирование отдельных партиций таблицы; можно сочетать с копированием целых таблиц |
| Способ 5 | Исключение определённых таблиц | Полное резервное копирование базы данных за исключением указанных таблиц |

### Способ 1: резервное копирование текущей базы данных {#method-1-back-up-the-current-database}

Следующая SQL-команда создаёт резервную копию текущей базы данных в Repository с именем `example_repo`, используя Label снимка `exampledb_20241225`:

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### Способ 2: резервное копирование указанной базы данных {#method-2-back-up-a-specified-database}

Следующая SQL-команда создаёт резервную копию базы данных с именем `destdb` в Repository с именем `example_repo`, используя Label снимка `destdb_20241225`:

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### Способ 3: резервное копирование указанных таблиц {#method-3-back-up-specified-tables}

Следующая SQL-команда создаёт резервную копию двух таблиц в Repository с именем `example_repo`, используя Label снимка `exampledb_tbl_tbl1_20241225`:

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### Способ 4: резервное копирование указанных партиций {#method-4-back-up-specified-partitions}

Следующая SQL-команда создаёт резервную копию таблицы с именем `example_tbl2`, а также партиций `p1` и `p2` таблицы с именем `example_tbl`, в Repository с именем `example_repo`, используя Label снимка `example_tbl_p1_p2_tbl1_20241225`:

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### Способ 5: резервное копирование текущей базы данных с исключением определённых таблиц {#method-5-back-up-the-current-database-excluding-certain-tables}

Следующая SQL-команда создаёт резервную копию текущей базы данных в Repository с именем `example_repo`, используя Label снимка `exampledb_20241225` и исключая две таблицы с именами `example_tbl` и `example_tbl1`:

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## Шаг 3: просмотр состояния выполнения последних задач резервного копирования {#step-3-view-the-execution-status-of-recent-backup-jobs}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup progress tracking / Troubleshooting -->

Используйте следующую SQL-команду для просмотра состояния выполнения последних задач резервного копирования:

```sql
mysql> show BACKUP\G;
*************************** 1. row ***************************
                  JobId: 17891847
           SnapshotName: exampledb_20241225
                 DbName: example_db
                  State: FINISHED
             BackupObjs: [example_db.example_tbl]
             CreateTime: 2022-04-08 15:52:29
   SnapshotFinishedTime: 2022-04-08 15:52:32
     UploadFinishedTime: 2022-04-08 15:52:38
           FinishedTime: 2022-04-08 15:52:44
        UnfinishedTasks:
               Progress:
             TaskErrMsg:
                 Status: [OK]
                Timeout: 86400
   1 row in set (0.01 sec)
```

Описание основных полей:

| Поле | Значение |
| --- | --- |
| `JobId` | Идентификатор задачи резервного копирования. |
| `SnapshotName` | Label снимка, соответствующий имени, указанному в `BACKUP SNAPSHOT`. |
| `DbName` | База данных, к которой относится резервная копия. |
| `State` | Состояние задачи. Например, `FINISHED` означает, что задача завершена. |
| `BackupObjs` | Список объектов, для которых фактически созданы резервные копии. |
| `CreateTime` / `SnapshotFinishedTime` / `UploadFinishedTime` / `FinishedTime` | Временные метки создания задачи, завершения создания снимка, завершения загрузки и завершения всей задачи. |
| `Status` | Статус результата выполнения задачи. `[OK]` означает успешное выполнение; в противном случае поле содержит сведения об ошибке. |
| `Timeout` | Время ожидания выполнения задачи (в секундах). |

## Шаг 4: просмотр существующих резервных копий в Repository {#step-4-view-existing-backups-in-the-repository}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup inventory / Pre-restore verification -->

Используйте следующую SQL-команду для просмотра существующих резервных копий в Repository с именем `example_repo`. Столбец `Snapshot` содержит Label снимка, а `Timestamp` — временную метку:

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

При выполнении операции [восстановления](./restore) необходимо использовать сочетание `Snapshot` и `Timestamp`, чтобы однозначно определить версию резервной копии.

## Шаг 5: отмена резервного копирования (при необходимости) {#step-5-cancel-a-backup-if-needed}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Abnormal termination / Rolling back accidental operations -->

Если при выполнении задачи резервного копирования возникла ошибка или её необходимо прервать, используйте следующую SQL-команду, чтобы отменить выполняющуюся задачу резервного копирования в базе данных:

```sql
CANCEL BACKUP FROM db_name;
```

Более подробные сведения см. в разделе [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP).

## Часто задаваемые вопросы {#faq}

### Вопрос: что делать, если не удаётся создать Repository? {#q-what-should-i-do-if-creating-a-repository-fails}

Обычно это связано с неверными учётными данными удалённого хранилища, недоступной конечной точкой или отсутствующим бакетом либо контейнером. Проверьте правильность значений `endpoint`, `access key`, `secret key` и имени бакета, а также убедитесь, что узлы FE/BE могут обращаться к удалённому хранилищу.

### Вопрос: что делать, если резервное копирование в MinIO завершается ошибкой? {#q-what-should-i-do-if-backups-to-minio-fail}

Обычно это происходит, когда Virtual Host-style не включён, а параметр `use_path_style` отсутствует. Добавьте `"use_path_style" = "true"` в `PROPERTIES`.

### Вопрос: что делать, если GCP/MinIO сообщает об отсутствии региона? {#q-what-should-i-do-if-gcpminio-reports-a-missing-region-error}

`s3.region` необходимо указать, даже если используется фиктивное значение, например `dummy-region`.

### Вопрос: что делать, если не удаётся создать Repository в Azure? {#q-what-should-i-do-if-creating-an-azure-repository-fails}

Версии Doris до 3.1.3 не поддерживают Azure Blob Storage. Обновите Doris до версии 3.1.3 или более поздней и убедитесь, что задано `provider = AZURE`.

### Вопрос: что делать, если в одной базе данных возникает конфликт резервного копирования и восстановления? {#q-what-should-i-do-if-a-backuprestore-conflict-is-reported-within-the-same-database}

В пределах одной базы данных одновременно может выполняться только одна задача резервного копирования или восстановления. Дождитесь завершения текущей задачи или отмените её с помощью `CANCEL BACKUP FROM db_name;`, прежде чем запускать новую.

### Вопрос: что делать, если кластер с разделением вычислений и хранения не может выполнять резервное копирование? {#q-what-should-i-do-if-a-compute-storage-decoupled-cluster-cannot-perform-backups}

Резервное копирование и восстановление не поддерживаются в режиме с разделением вычислений и хранения. Переключитесь в режим с объединёнными вычислениями и хранением или используйте другой способ экспорта данных.

### Вопрос: почему материализованное представление не попало в резервную копию? {#q-why-was-the-materialized-view-not-backed-up}

Асинхронные материализованные представления (MTMV) не включаются в резервные копии. После восстановления необходимо заново создать соответствующие материализованные представления в целевом кластере.

### Вопрос: как устранить повреждение данных, возникающее при резервном копировании из разных кластеров по одному и тому же пути? {#q-how-do-i-resolve-data-corruption-when-different-clusters-back-up-to-the-same-path}

Причина заключается в использовании одинакового значения Label снимка, что приводит к конфликтам путей. Если разные кластеры сохраняют резервные копии по одному и тому же пути Repository, используйте разные значения Label.

### Вопрос: почему динамическое партиционирование не работает после восстановления? {#q-why-is-dynamic-partitioning-not-effective-after-restoration}

Резервное копирование и восстановление не включают динамическое партиционирование автоматически. После восстановления вручную включите свойство динамического партиционирования с помощью `ALTER TABLE`.

### Вопрос: что делать, если таблицы colocate работают некорректно после восстановления? {#q-what-should-i-do-if-colocate-tables-behave-abnormally-after-restoration}

Резервное копирование и восстановление не сохраняют свойство `colocate_with`. После восстановления повторно настройте свойство `colocate_with` для таблиц colocate.

## Связанные документы {#related-documents}

- [Восстановление](./restore)
- [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)
- [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)
- [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)
- [SHOW SNAPSHOT](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT)
- [SHOW REPOSITORIES](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES)
- [Политика хранения](../../../table-design/tiered-storage/remote-storage)
