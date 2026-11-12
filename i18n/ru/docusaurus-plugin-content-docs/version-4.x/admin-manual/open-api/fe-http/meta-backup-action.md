---
{
    "title": "Операция резервного копирования метаданных",
    "language": "ru",
    "description": "HTTP API для резервного копирования метаданных FE в режиме разделения вычислений и хранения: создание точки синхронизации метаданных и экспорт образа и журналов BDBJE.",
    "keywords": [
        "Doris metadata backup",
        "compute-storage decoupled metadata",
        "sync_cloud_meta",
        "export_meta",
        "meta sync point",
        "BDBJE backup",
        "FE image export",
        "FDB backup",
        "cloud meta backup"
    ]
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Decoupled metadata backup / Disaster recovery drill / Consistent FE and FDB snapshot -->

В режиме разделения вычислений и хранения метаданные кластера хранятся в двух местах: в образе и журнале изменений BDBJE на стороне FE и в FoundationDB (FDB) на стороне Meta Service. При независимом резервном копировании эти данные фиксируются в разные моменты времени, из-за чего при восстановлении они могут оказаться несогласованными.

Эти API решают эту проблему: сначала создаётся **точка синхронизации метаданных** между FE и FDB, затем на её основе экспортируются метаданные FE. Это позволяет согласовать обе резервные копии по одному моменту времени.

:::info Примечание о версии

Эта функция поддерживается начиная с версии 4.0.8 и **доступна только в режиме разделения вычислений и хранения**. При вызове в режиме совмещённых вычислений и хранения возвращается ошибка.

:::

## Обзор API {#api-overview}

| API | Метод | Назначение |
| --- | --- | --- |
| `/rest/v2/manager/backup/sync_cloud_meta` | POST | Создаёт точку синхронизации метаданных между FE и FDB и возвращает её идентификатор журнала, зафиксированную версию и versionstamp |
| `/rest/v2/manager/backup/export_meta` | POST | Экспортирует образ FE, файлы метаданных и журналы BDBJE в указанный каталог |

## Предварительные требования {#prerequisites}

- Кластер работает в режиме разделения вычислений и хранения (параметр конфигурации FE `deploy_mode = cloud`).
- Учётная запись, от имени которой выполняется вызов, имеет привилегию `ADMIN`.
- Оба API необходимо вызывать на **Master FE**. При вызове на FE, не являющемся ведущим, по умолчанию в ответе возвращается адрес ведущего FE; для автоматического перенаправления добавьте к URL `allow_redirect=true`.
- Для `export_meta` требуется параметр конфигурации FE `edit_log_type = bdb` (значение по умолчанию).

## Создание точки синхронизации метаданных {#create-a-meta-sync-point}

<!-- Knowledge Type: Operational Steps -->

**Назначение**: Зафиксировать точку синхронизации в Meta Service и записать её в журнал изменений FE, чтобы использовать её как опорную точку для согласования резервных копий FE и FDB.

```shell
curl -u <user>:<passwd> -X POST \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/sync_cloud_meta"
```

**Пример ответа:**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "journal_id": 1024,
        "committed_version": 20250811000000,
        "versionstamp": "0000000000000001"
    },
    "count": 0
}
```

**Поля ответа:**

| Поле | Описание |
| --- | --- |
| `journal_id` | Идентификатор этой точки синхронизации в журнале изменений FE |
| `committed_version` | Зафиксированная версия, возвращённая Meta Service |
| `versionstamp` | Соответствующий versionstamp FDB, используемый для согласования с резервной копией FDB |

## Экспорт метаданных FE {#export-fe-metadata}

<!-- Knowledge Type: Operational Steps -->

**Назначение**: Экспортировать текущий образ FE и журналы BDBJE в локальный каталог для создания резервной копии метаданных FE, пригодной для восстановления.

```shell
curl -u <user>:<passwd> -X POST \
    -H "Content-Type: application/json" \
    -d '{"target_dir": "/path/to/backup/dir"}' \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/export_meta"
```

**Параметры тела запроса:**

| Параметр | Тип | Обязательный | Описание |
| --- | --- | --- | --- |
| `target_dir` | String | Да | Абсолютный путь к целевому каталогу экспорта. Если каталог не существует, он создаётся; **если он уже существует, сначала удаляется всё его содержимое** |

**Пример ответа:**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "target_dir": "/path/to/backup/dir",
        "bdb_dir": "/path/to/backup/dir/bdb",
        "bdb_file_count": 12,
        "image_file": "image.1024",
        "image_version": 1024,
        "image_exported": true,
        "journal_upper_bound": 2048
    },
    "count": 0
}
```

**Поля ответа:**

| Поле | Описание |
| --- | --- |
| `target_dir` | Абсолютный путь к каталогу, фактически использованному для экспорта |
| `bdb_dir` | Подкаталог с экспортированными файлами журналов BDBJE |
| `bdb_file_count` | Количество экспортированных файлов журналов BDBJE |
| `image_file` | Имя экспортированного файла образа; `null`, если образ отсутствует |
| `image_version` | Версия экспортированного образа |
| `image_exported` | Признак успешного экспорта файла образа |
| `journal_upper_bound` | Наибольший идентификатор журнала в BDBJE на момент экспорта |

**Структура каталога экспорта:**

```text
<target_dir>/
├── image/
│   ├── image.<version>     # The latest image file
│   ├── MODE                # Deployment mode file
│   ├── ROLE                # FE role file
│   └── VERSION             # Cluster version file
└── bdb/
    └── *.jdb               # BDBJE log files
```

Во время экспорта FE удерживает блокировку checkpoint в режиме чтения, поэтому образ нельзя заменить, пока он копируется. Для образа и файлов метаданных по возможности создаются жёсткие ссылки; если жёсткие ссылки недоступны, файлы копируются.

## Полная процедура резервного копирования {#full-backup-procedure}

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Scheduled metadata backup / Disaster recovery drill -->

1. Вызовите `sync_cloud_meta` и сохраните возвращённые `versionstamp` и `committed_version`.
2. Создайте резервную копию метаданных на стороне FDB на основе этого `versionstamp`.
3. Вызовите `export_meta`, чтобы экспортировать метаданные FE в каталог резервного копирования.
4. Заархивируйте вместе `versionstamp`, `committed_version` и каталог экспорта, чтобы при восстановлении можно было проверить, что обе резервные копии относятся к одному моменту времени.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge Type: Troubleshooting -->

| Симптом | Причина | Решение |
| --- | --- | --- |
| Возвращается `only works on the cloud mode` | Кластер работает не в режиме разделения вычислений и хранения | Эти API поддерживают только режим разделения вычислений и хранения |
| Возвращается `current fe is not master, master is <host>:<port>` | Запрос был отправлен на FE, не являющийся ведущим | Отправьте запрос на ведущий FE или добавьте к URL `allow_redirect=true` |
| Возвращается `target_dir is required` | В теле запроса отсутствует `target_dir` | Укажите `target_dir` в теле запроса JSON |
| Возвращается `only bdb edit_log_type supports bdbje export` | Параметр FE `edit_log_type` имеет значение, отличное от `bdb` | Этот API поддерживает только журнал изменений BDBJE |
| Возвращается `export failed: bdb min journal id ... is greater than image_version + 1` | Самая ранняя запись журнала BDBJE находится за пределами диапазона, охватываемого образом, поэтому экспортированную резервную копию нельзя восстановить непрерывным воспроизведением журнала | Инициируйте checkpoint, чтобы создать более новый образ, затем повторите экспорт |
| Возвращается `target_dir exists but is not a directory` | `target_dir` указывает на файл | Укажите путь к каталогу |
