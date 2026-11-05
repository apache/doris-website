---
{
    "title": "Синхронизация изменений схемы MySQL",
    "language": "ru",
    "sidebar_label": "Синхронизация изменений схемы",
    "description": "Описывает поддерживаемые изменения схемы и поведение синхронизации MySQL CDC с автоматическим созданием таблиц.",
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

MySQL Schema Change Sync автоматически применяет изменения столбцов в вышестоящей системе MySQL к Doris во время непрерывной загрузки. Эта возможность применяется только к [MySQL CDC с автоматическим созданием таблиц](./continuous-load-mysql-database.md). Она не поддерживается в [MySQL CDC с сопоставлением SQL](./continuous-load-mysql-table.md).

## Поддерживаемые изменения схемы {#supported-schema-changes}

| Операция MySQL | Поведение Doris |
| --- | --- |
| `ADD COLUMN` | Добавляет столбец с тем же именем и типом, определённым в [сопоставлении типов данных MySQL](./data-type-mapping-mysql.md), и копирует комментарий столбца. Ограничения DEFAULT и `NOT NULL` не копируются, а исторические строки не заполняются задним числом. Для последующих строк используются фактические значения, записанные MySQL в binlog. |
| `DROP COLUMN` | Удаляет столбец с тем же именем. |

## Особенности {#considerations}

- Если добавляемый столбец уже существует или удаляемый столбец отсутствует, Doris пропускает операцию, чтобы повторная попытка не привела к сбою задания.
- Позиции столбцов, указанные с помощью `FIRST` и `AFTER`, в Doris не синхронизируются. Новые столбцы добавляются после существующих столбцов Doris.
- Операции `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, изменения DEFAULT и изменения ограничений `NULL` / `NOT NULL` автоматически не синхронизируются. Перед выполнением этих операций приостановите задание непрерывной загрузки, вручную измените целевую таблицу Doris, проверьте совместимость обеих схем, а затем возобновите задание.
- Изменения первичного ключа, индексов, партиций, имени таблицы и другие изменения схемы на уровне таблицы автоматически не синхронизируются.
- В Auto Table Creation Sync Schema Change Sync включён по умолчанию. В Doris 4.1 нет SQL-свойства для отключения этой функции. Табличная функция `cdc_stream()` (SQL Mapping Sync) внутренне отключает Schema Change Sync.

## Связанные документы {#related-docs}

- [MySQL CDC с автоматическим созданием таблиц](./continuous-load-mysql-database.md)
- [Сопоставление типов данных MySQL](./data-type-mapping-mysql.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
