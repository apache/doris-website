---
{
    "title": "Синхронизация изменений схемы MySQL",
    "language": "ru",
    "sidebar_label": "Синхронизация изменений схемы",
    "description": "Описывает поддерживаемые изменения схемы и поведение синхронизации при использовании MySQL CDC Auto Table Creation Sync.",
    "keywords": [
        "MySQL Schema Change",
        "MySQL CDC",
        "Auto Table Creation Sync",
        "Continuous Load",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris является экспериментальной функцией и поддерживается начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during MySQL Auto Table Creation Sync -->

Синхронизация изменений схемы MySQL автоматически применяет изменения столбцов в исходной базе данных MySQL к Doris во время непрерывной загрузки. Эта возможность применяется только к [MySQL CDC с автоматическим созданием таблиц](./continuous-load-mysql-database.md). Она не поддерживается [MySQL CDC с сопоставлением SQL](./continuous-load-mysql-table.md).

## Поддерживаемые изменения схемы {#supported-schema-changes}

| Операция MySQL | Поведение Doris |
| --- | --- |
| `ADD COLUMN` | Добавляет столбец с тем же именем и типом, определённым в [Сопоставлении типов данных MySQL](./data-type-mapping-mysql.md), и копирует комментарий столбца. Ограничения DEFAULT и `NOT NULL` не копируются, а исторические строки не заполняются задним числом. Для последующих строк используются фактические значения, записанные MySQL в binlog. |
| `DROP COLUMN` | Удаляет столбец с тем же именем. |

## Особенности {#considerations}

- Если добавляемый столбец уже существует или удаляемый столбец отсутствует, Doris пропускает операцию, чтобы повторная попытка не привела к сбою задания.
- Позиции столбцов, заданные с помощью `FIRST` и `AFTER`, в Doris не синхронизируются. Новые столбцы добавляются после существующих столбцов Doris.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, изменения DEFAULT и изменения ограничений `NULL` / `NOT NULL` автоматически не синхронизируются. Перед выполнением этих операций приостановите задание непрерывной загрузки, вручную измените целевую таблицу Doris, убедитесь, что обе схемы совместимы, а затем возобновите задание.
- Первичный ключ, индексы, разделы, имя таблицы и другие изменения схемы на уровне таблицы автоматически не синхронизируются.
- Auto Table Creation Sync по умолчанию включает Schema Change Sync. В настоящее время Doris не предоставляет свойство SQL для его отключения. Табличная функция `cdc_stream()` (SQL Mapping Sync) внутренне отключает Schema Change Sync.

## Связанные документы {#related-docs}

- [MySQL CDC с автоматическим созданием таблиц](./continuous-load-mysql-database.md)
- [Сопоставление типов данных MySQL](./data-type-mapping-mysql.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
