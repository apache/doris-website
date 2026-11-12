---
{
    "title": "Ручное развёртывание кластера с разделением хранения и вычислений",
    "language": "ru",
    "description": "Подробное руководство по ручному развёртыванию кластера Doris с разделением хранения и вычислений в Linux, включая этапы развёртывания FoundationDB, S3/HDFS, Meta Service и FE/BE, а также ответы на часто задаваемые вопросы.",
    "keywords": [
        "развёртывание Doris с разделением хранения и вычислений",
        "установка кластера с разделением хранения и вычислений",
        "развёртывание FoundationDB",
        "облачное развёртывание Doris",
        "настройка хранилища S3",
        "развёртывание Meta Service"
    ]
}
---

Развёртывание кластера с разделением хранения и вычислений включает восемь шагов:

1. **Подготовьте кластер FoundationDB**: используйте существующий кластер FoundationDB или создайте новый.

2. **Разверните сервис S3 или HDFS**: используйте существующее общее хранилище или настройте новое.

3. **Разверните Meta Service**: разверните Meta Service для кластера Doris.

4. **Разверните процесс очистки данных**: разверните отдельный процесс очистки данных для кластера Doris. Этот шаг необязателен.

5. **Запустите узел FE Master**: запустите первый узел FE в качестве узла Master FE.

6. **Сформируйте кластер FE Master**: добавьте узлы FE Follower/Observer, чтобы сформировать кластер FE.

7. **Добавьте узлы BE**: добавьте узлы BE и зарегистрируйте их в кластере.

8. **Добавьте Storage Vault**: создайте одно или несколько хранилищ Storage Vault на основе общего хранилища.

Перед началом развёртывания можно [скачать](https://doris.apache.org/download) подходящую версию Doris.

## Предварительные требования {#prerequisites}

<!-- Knowledge type: Hardware and software requirements -->
<!-- Applicable scenario: Pre-deployment checks -->

| Тип | Требование |
|------|------|
| **Операционная система** | Linux (CentOS 7+, Ubuntu 20.04+) |
| **JDK** | OpenJDK 17 (необходимо задать JAVA_HOME) |
| **FoundationDB** | Версия из серии 7.1.x |
| **Сеть** | Порты должны быть доступны между узлами (по умолчанию: FE 8030, BE 9050, Meta Service 5000) |
| **Диск** | Рекомендуется SSD (особенно для каталога данных FDB) |

## Шаг 1: Подготовка FoundationDB {#step-1-prepare-foundationdb}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

В этом разделе приведено пошаговое руководство по настройке, развёртыванию и запуску сервиса FDB (FoundationDB) с помощью скриптов `fdb_vars.sh` и `fdb_ctl.sh`. Вы можете скачать [инструменты Doris](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz) и найти `fdb_vars.sh` и `fdb_ctl.sh` в каталоге `fdb`.

:::tip
По умолчанию для Doris требуется FDB серии 7.1.x. Если FDB уже установлен, убедитесь, что его версия относится к серии 7.1.x; иначе Meta Service не запустится.
:::

### Требования к машинам {#machine-requirements}

Как правило, для создания кластера FoundationDB с двумя репликами и устойчивостью к отказу одной машины требуются как минимум три машины с SSD. Для тестовой среды или среды разработки достаточно одной машины.

### Настройка скрипта fdb_vars.sh {#configuring-the-fdb_varssh-script}

При настройке скрипта `fdb_vars.sh` необходимо указать следующие параметры:

   | Параметр         | Описание                                  | Тип                                       | Пример                                                      | Примечания                                                        |
   | ---------------- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
   | DATA_DIRS        | Каталоги данных, используемые FoundationDB    | Список абсолютных путей через запятую   | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | Перед запуском скрипта убедитесь, что каталоги существуют. Для производственной среды рекомендуются SSD и отдельные каталоги. |
   | FDB_CLUSTER_IPS  | IP-адреса кластера                              | Строка с IP-адресами через запятую   | 172.200.0.2,172.200.0.3,172.200.0.4                          | В производственном кластере должно быть не менее 3 IP-адресов. Первый IP-адрес используется для координатора. Для высокой доступности разместите машины в разных стойках. |
   | FDB_HOME         | Домашний каталог FoundationDB              | Абсолютный путь                           | /fdbhome                                                     | Путь по умолчанию: /fdbhome. Убедитесь, что путь абсолютный. |
   | FDB_CLUSTER_ID   | Идентификатор кластера                               | Строка                                   | SAQESzbh                                                     | Идентификатор каждого кластера должен быть уникальным. Для его генерации можно использовать mktemp -u XXXXXXXX. |
   | FDB_CLUSTER_DESC | Описание кластера FDB           | Строка                                   | dorisfdb                                                     | Рекомендуется заменить это значение на описание, отражающее назначение вашего развёртывания. |


   При необходимости можно указать следующие дополнительные параметры:

   | Параметр        | Описание                                          | Тип    | Пример            | Примечания                                                                       |
   | --------------- | ---------------------------------------------------- | ------- | ------------------ | --------------------------------------------------------------------------- |
   | MEMORY_LIMIT_GB | Ограничение памяти для процесса FDB, в ГБ          | Целое число | MEMORY_LIMIT_GB=16 | Настройте это значение с учётом доступной памяти и требований процесса FDB. |
   | CPU_CORES_LIMIT | Ограничение числа ядер CPU для процесса FDB               | Целое число | CPU_CORES_LIMIT=8  | Задайте это значение с учётом числа доступных ядер CPU и требований процесса FDB. |

### Развёртывание кластера FDB {#deploying-the-fdb-cluster}

После настройки окружения с помощью `fdb_vars.sh` используйте скрипт `fdb_ctl.sh` на каждом узле для развёртывания кластера FDB.

```bash
./fdb_ctl.sh deploy
```

### Запуск сервиса FDB {#starting-the-fdb-service}

После развёртывания кластера FDB используйте скрипт `fdb_ctl.sh` для запуска сервиса FDB.

   ```bash
   ./fdb_ctl.sh start
   ```

   Эта команда запускает сервис FDB, переводит кластер в рабочее состояние и получает строку подключения к кластеру FDB, которую затем можно использовать для настройки MetaService.

   :::warning
   Команда clean в скрипте fdb_ctl.sh удаляет все метаданные FDB, что может привести к потере данных. Никогда не используйте её в производственной среде.
   :::

## Шаг 2: Установка сервиса S3 или HDFS (необязательно) {#step-2-install-s3-or-hdfs-service-optional}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Режим разделения хранения и вычислений в Doris использует сервис S3 или HDFS для хранения данных. Если у вас уже есть такой сервис, его можно использовать напрямую.
Если такого сервиса нет, ниже приведена простая инструкция по развёртыванию MinIO:

1. На [странице загрузки](https://min.io/download?license=agpl&platform=linux) MinIO выберите подходящую версию и операционную систему, затем скачайте соответствующие исполняемые файлы или установочные пакеты Server и Client.
2. Запустите MinIO Server.

   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # In older versions, this setting is MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # In older versions, this setting is MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```

3. Настройте MinIO Client.

   ```bash
   # If you installed the client from an installation package, the client is named mcli. If you downloaded the client binary directly, it is named mc.
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```

4. Создайте бакет.

   ```bash
   ./mc mb myminio/doris
   ```

5. Проверьте работоспособность.

   ```bash
   # Upload a file
   ./mc mv test_file myminio/doris
   # View the file
   ./mc ls myminio/doris
   ```

## Шаг 3: Развёртывание Meta Service {#step-3-deploy-meta-service}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. Настройка

   В файле `./conf/doris_cloud.conf` необходимо изменить прежде всего следующие два параметра:

   - `brpc_listen_port`: порт, который прослушивает Meta Service. По умолчанию: 5000.
   - `fdb_cluster`: информация для подключения к кластеру FoundationDB, полученная при развёртывании FoundationDB. (Если вы развернули FDB с помощью скрипта `fdb_ctl.sh`, предоставляемого Doris, это значение можно найти в файле `$FDB_HOME/conf/fdb.cluster`.)

   Пример конфигурации:

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```

   Примечание: значение `fdb_cluster` должно совпадать с содержимым файла `/etc/foundationdb/fdb.cluster` на машине с FoundationDB. (Если вы развернули FDB с помощью скрипта `fdb_ctl.sh`, предоставляемого Doris, это значение можно найти в файле `$FDB_HOME/conf/fdb.cluster`.)

   В следующем примере последняя строка файла содержит значение, которое нужно указать в поле `fdb_cluster` файла `doris_cloud.conf`:

   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```

2. Запуск и остановка

   Перед запуском убедитесь, что переменная окружения `JAVA_HOME` задана правильно и указывает на OpenJDK 17. Затем перейдите в каталог `ms`.

   Команда запуска:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```

   Код возврата 0 у скрипта запуска означает успешный запуск; любое другое значение означает ошибку запуска. При успешном запуске последняя строка стандартного вывода содержит "doris_cloud start successfully".

   Команда остановки:

   ```shell
   bin/stop.sh
   ```

   В производственной среде должно быть не менее 3 узлов Meta Service.

3. Использование нескольких конфигурационных файлов (необязательно, 4.0.8+)

   Начиная с версии 4.0.8, `bin/start.sh` принимает несколько конфигурационных файлов через переменную окружения `CONF_FILES`. Это позволяет удобнее отделять общую конфигурацию от настроек отдельных узлов:

   ```shell
   export CONF_FILES="common.conf,doris_cloud.conf"
   bin/start.sh --daemon
   ```

   Правила:

   - Разделяйте имена файлов запятыми. Файлы загружаются **слева направо**.
   - Относительные пути отсчитываются от `${DORIS_HOME}/conf/`; абсолютные пути также поддерживаются. Можно использовать шаблоны с подстановочными символами (например, `conf.d/*.conf`).
   - Если переменная определена несколько раз, используется **первое** определение; последующие файлы его не переопределяют.
   - Переменные окружения, уже экспортированные в оболочке, имеют наивысший приоритет и никогда не переопределяются конфигурационным файлом.
   - Отсутствующие файлы пропускаются и не приводят к ошибке запуска.
   - Если `CONF_FILES` не задана, поведение соответствует предыдущим версиям: читается только `doris_cloud.conf`.

   :::info Примечание

   Этот механизм обрабатывает только **переменные окружения с именами в верхнем регистре**, записанные в конфигурационных файлах в виде `KEY=VALUE` (например, `JAVA_HOME`). Собственные параметры Meta Service по-прежнему читаются из `doris_cloud.conf`.

   :::



## Шаг 4: Отдельное развёртывание процесса очистки данных (необязательно) {#step-4-standalone-deployment-of-the-data-recycler-optional}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

:::tip

Сам Meta Service предоставляет функции управления метаданными и очистки данных. Эти функции можно развернуть отдельно друг от друга. Если вам нужно отдельно развернуть процесс очистки данных, выполните следующие шаги.

:::

1. Создайте новый рабочий каталог (например, `recycler`) и скопируйте в него содержимое каталога `ms`:

   ```shell
   cp -r ms recycler
   ```

2. В конфигурационном файле нового каталога измените порт прослушивания BRPC `brpc_listen_port` и значение `fdb_cluster`.

   Запустите процесс очистки данных:
   
   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --recycler --daemon
   ```

   Запустите только компонент для работы с метаданными:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --meta-service --daemon
   ```

## Шаг 5: Запуск узла FE Master {#step-5-start-the-fe-master-node}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. Настройте файл fe.conf

   В файле `fe.conf` необходимо настроить следующие ключевые параметры:

   - `deploy_mode`
     - Описание: задаёт режим запуска Doris.
     - Формат: `cloud` означает режим с разделением хранения и вычислений; любое другое значение означает режим с совмещением хранения и вычислений.
     - Пример: `cloud`
   - `cluster_id`
     - Описание: уникальный идентификатор кластера в архитектуре с разделением хранения и вычислений. Разные кластеры должны использовать разные значения `cluster_id`.
     - Формат: int
     - Пример: для генерации случайного идентификатора можно использовать следующий скрипт оболочки: `echo $(($((RANDOM << 15)) | $RANDOM))`.
     - Примечание: разные кластеры должны использовать разные значения `cluster_id`.
   - `meta_service_endpoint`
     - Описание: адрес и порт Meta Service.
     - Формат: `IP:Port`
     - Пример: `127.0.0.1:5000`. Можно указать несколько адресов Meta Service через запятую.

2. Запустите узел FE Master

   Команда запуска:

   ```bash
   bin/start_fe.sh --daemon
   ```

   Первый процесс FE инициализирует кластер и работает в роли FOLLOWER. Подключитесь к FE с помощью клиента MySQL и выполните `show frontends`, чтобы убедиться, что только что запущенный FE является master.

## Шаг 6: Регистрация узлов FE Follower/Observer {#step-6-register-fe-followerobserver-nodes}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Для остальных узлов измените конфигурационные файлы и запустите их, выполнив те же шаги. Затем подключитесь с помощью клиента MySQL к FE в роли Master и выполните следующую команду SQL, чтобы добавить дополнительные узлы FE:

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```


Замените `host:port` фактическим адресом и портом edit-log узла FE. Подробнее см. [ADD FOLLOWER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER) и [ADD OBSERVER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER).

В производственной среде общее число узлов FE в роли FOLLOWER, включая первый FE, должно оставаться нечётным. Как правило, достаточно трёх узлов FOLLOWER. Число узлов FE в роли Observer может быть любым.

## Шаг 7: Добавление узлов BE {#step-7-add-be-nodes}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Чтобы добавить узлы Backend в кластер, выполните следующие шаги для каждого Backend:

1. Настройте be.conf

   В файле `be.conf` необходимо настроить следующие ключевые параметры:
    - deploy_mode
      - Описание: задаёт режим запуска Doris.
      - Формат: `cloud` означает режим с разделением хранения и вычислений; любое другое значение означает режим с совмещением хранения и вычислений.
      - Пример: cloud
    - file_cache_path
      - Описание: пути к дискам и другие параметры файлового кеша, представленные в виде массива с одной записью на диск. `path` задаёт путь к диску, а `total_size` ограничивает размер кеша; -1 или 0 означает использование всего дискового пространства.
      - Формат: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - Пример: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - По умолчанию: [{"path":"${DORIS_HOME}/file_cache"}]

2. Запустите процесс BE

   Для запуска Backend используйте следующую команду:

   ```bash
   bin/start_be.sh --daemon
   ```

3. Добавьте BE в кластер

   С помощью клиента MySQL подключитесь к любому узлу FE:

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```

   Замените `<ip>` IP-адресом нового Backend, а `<heartbeat_service_port>` настроенным портом службы heartbeat (по умолчанию: 9050).

   С помощью PROPERTIES можно задать вычислительную группу, к которой относится BE.

   Подробнее об использовании см. [ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) и [REMOVE BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND).

4. Проверьте состояние BE

   Проверьте файл журнала Backend (`be.log`), чтобы убедиться, что он успешно запустился и присоединился к кластеру.

   Для проверки состояния Backend также можно выполнить следующую команду SQL:

   ```sql
   SHOW BACKENDS;
   ```

   Она показывает все узлы Backend в кластере и их текущее состояние.

## Шаг 8: Добавление Storage Vault {#step-8-add-storage-vault}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Хранилища Storage Vault являются важным компонентом архитектуры Doris с разделением хранения и вычислений. Они представляют общий слой хранения, в котором размещаются данные. Можно создать одно или несколько хранилищ Storage Vault на основе HDFS или объектного хранилища, совместимого с S3. Одно из хранилищ Storage Vault можно назначить хранилищем по умолчанию. В этом Storage Vault хранятся системные таблицы и таблицы, для которых Storage Vault явно не указан. Storage Vault по умолчанию нельзя удалить. Ниже описано, как создать Storage Vault для кластера Doris:

1. Создайте Storage Vault на основе HDFS

   Чтобы создать Storage Vault с помощью SQL, подключитесь к кластеру Doris через клиент MySQL.

   ```sql
   CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```

2. Создайте Storage Vault на основе S3

   Чтобы создать Storage Vault на основе объектного хранилища, совместимого с S3, выполните следующие шаги:

   - Подключитесь к кластеру Doris через клиент MySQL.
   - Выполните следующую команду SQL, чтобы создать Storage Vault на основе S3:

   ```sql
   CREATE STORAGE VAULT IF NOT EXISTS s3_vault
       PROPERTIES (
       "type"="S3",
       "s3.endpoint"="https://s3.us-east-1.amazonaws.com",
       "s3.access_key" = "ak",
       "s3.secret_key" = "sk",
       "s3.region" = "us-east-1",
       "s3.root.path" = "ssb_sf1_p2_s3",
       "s3.bucket" = "doris-build-1308700295",
       "provider" = "S3"
   );
   ```

   О создании Storage Vault в других сервисах объектного хранения см. [Создание Storage Vault](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT).

3. Назначьте Storage Vault по умолчанию

   Чтобы назначить Storage Vault по умолчанию, выполните следующий оператор SQL.

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```

## Часто задаваемые вопросы {#faq}

### Вопрос: Meta Service не запускается с ошибкой "FDB version mismatch"? {#q-meta-service-fails-to-start-with-the-error-fdb-version-mismatch}

По умолчанию для Doris требуется FDB серии 7.1.x. Выполните `fdbserver --version`, чтобы проверить установленную версию FoundationDB. Если версия не соответствует требуемой, переустановите FDB, выбрав правильную версию.

### Вопрос: Как убедиться, что узел FE успешно запустился и стал Master? {#q-how-do-i-confirm-that-an-fe-node-has-started-successfully-and-become-the-master}

Для проверки выполните следующую команду:
```bash
mysql -h <fe_host> -P 9030 -u root -e "SHOW FRONTENDS;"
```
Проверьте, что в выводе столбец `Role` для соответствующего FE содержит значение `MASTER`.

### Вопрос: Как устранить неполадку, если узел BE после запуска остаётся в состоянии "Starting"? {#q-how-do-i-troubleshoot-a-be-node-that-stays-in-the-starting-state-after-startup}

Выполните следующие действия:
1. Проверьте журнал BE `be.log` на наличие сообщений об ошибках.
2. Убедитесь, что `meta_service_endpoint` настроен правильно и Meta Service доступен.
3. Убедитесь, что для `deploy_mode` задано значение `cloud`.
4. Выполните `SHOW BACKENDS;`, чтобы просмотреть подробное описание ошибки.

### Вопрос: Как убедиться, что Storage Vault успешно создан? {#q-how-do-i-confirm-that-a-storage-vault-was-created-successfully}

Для проверки выполните следующую команду SQL:
```sql
SHOW STORAGE VAULT;
```
Убедитесь, что созданное хранилище имеет состояние `OK`.

### Вопрос: При добавлении узла BE возвращается ошибка "backend already exists"? {#q-adding-a-be-node-returns-the-error-backend-already-exists}

Возможно, узел BE уже существует или предыдущая запись не была полностью удалена. Выполните следующую команду, чтобы удалить старую запись, и повторите попытку:
```sql
ALTER SYSTEM DROP BACKEND "<ip>:<port>";
```

## Устранение неполадок {#troubleshooting}

### FE не удаётся подключиться к Meta Service {#fe-cannot-connect-to-meta-service}

- **Признак**: в журнале FE отображается "connect to meta service failed".
- **Действия по устранению неполадок**:
  1. Убедитесь, что процесс Meta Service работает: `ps aux | grep doris_cloud`.
  2. Проверьте формат `meta_service_endpoint` (он должен быть `IP:Port`).
  3. Убедитесь, что узлы доступны друг другу по сети (порт по умолчанию: 5000).

### BE не запускается с ошибкой "Too many open files" {#be-fails-to-start-with-too-many-open-files}

- **Действия по устранению неполадок**:
  1. Выполните `ulimit -n`, чтобы проверить текущее ограничение.
  2. Добавьте `max_open_files = 65535` в `be.conf`.
  3. Либо выполните `ulimit -n 65535`, а затем перезапустите BE.

### Кластер FDB не запускается {#fdb-cluster-fails-to-start}

- **Действия по устранению неполадок**:
  1. Проверьте, что каталоги, заданные параметром `DATA_DIRS` в `fdb_vars.sh`, существуют и имеют необходимые права доступа.
  2. Убедитесь, что `FDB_CLUSTER_IPS` настроен одинаково на всех узлах.
  3. Проверьте журнал FDB по пути `/var/log/foundationdb/fdbserver.log`.

## Примечания {#notes}

- В качестве адресата в настройке `meta_service_endpoint` для FE и BE следует указывать только процесс Meta Service, отвечающий за операции с метаданными.
- Процесс очистки данных не следует указывать в качестве адресата в настройке `meta_service_endpoint`.
