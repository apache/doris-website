---
{
    "title": "Синхронизация Schema Change в PostgreSQL",
    "language": "ru",
    "sidebar_label": "Синхронизация Schema Change",
    "description": "Описывает поддерживаемые изменения схемы и поведение синхронизации PostgreSQL CDC Auto Table Creation Sync.",
    "keywords": [
        "PostgreSQL Schema Change",
        "PostgreSQL CDC",
        "Auto Table Creation Sync",
        "Непрерывная загрузка",
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
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

Синхронизация Schema Change в PostgreSQL автоматически применяет изменения столбцов в исходной системе PostgreSQL к Doris во время непрерывной загрузки. Эта возможность доступна только в [PostgreSQL CDC с Auto Table Creation](./continuous-load-postgresql-database.md). В [PostgreSQL CDC с SQL Mapping](./continuous-load-postgresql-table.md) она не поддерживается.

## Поддерживаемые изменения схемы {#supported-schema-changes}

| Операция PostgreSQL | Поведение Doris |
| --- | --- |
| `ADD COLUMN` | Добавляет столбец с тем же именем и типом, определённым в [сопоставлении типов данных PostgreSQL](./data-type-mapping-postgresql.md). Ограничения DEFAULT и `NOT NULL` не копируются, а исторические строки не заполняются задним числом. Для последующих строк используются фактические значения, записанные PostgreSQL в WAL. |
| `DROP COLUMN` | Удаляет столбец с тем же именем. |

## Особенности {#considerations}

- Изменение схемы PostgreSQL не распространяется немедленно, если выполняется только DDL. Doris обнаруживает и применяет новую схему после того, как в изменённую таблицу поступит следующая операция INSERT, UPDATE или DELETE.
- Автоматическая синхронизация изменений схемы не поддерживается на этапе полного снимка. Выполняйте изменения схемы в исходной системе после завершения полного снимка и перехода задания в инкрементальную фазу.
- Если добавляемый столбец уже существует или удаляемый столбец отсутствует, Doris пропускает операцию, чтобы повторная попытка не привела к сбою задания.
- Если одно изменение схемы одновременно добавляет и удаляет столбцы, Doris рассматривает его как возможное переименование столбца и не изменяет целевую таблицу автоматически. Это предотвращает случайную потерю данных.
- Переименования столбцов, изменения типов столбцов, изменения DEFAULT и ограничений `NULL` / `NOT NULL` автоматически не синхронизируются. Приостановите задание непрерывной загрузки, вручную измените целевую таблицу Doris, убедитесь в совместимости обеих схем, затем возобновите задание.
- Auto Table Creation Sync включает Schema Change Sync по умолчанию. В настоящее время Doris не предоставляет свойства SQL для его отключения. Табличная функция `cdc_stream()` (SQL Mapping Sync) внутренне отключает Schema Change Sync.

:::caution Поведение при изменении схемы

Обнаружение изменений схемы PostgreSQL выполняется по событиям Relation:

- Распознаются только `ADD COLUMN` и `DROP COLUMN`.
- Изменение, одновременно добавляющее и удаляющее столбцы (возможно, это `RENAME`), пропускается, а целевая таблица остаётся без изменений.
- Изменения типов столбцов пропускаются.
- Добавленный столбец **не получает значение `DEFAULT` исходного столбца**.
- Эта возможность применяется только в пути Auto Table Creation Sync (at-least-once). Путь SQL Mapping (TVF / exactly-once) её не поддерживает.

:::

## Связанная документация {#related-docs}

- [PostgreSQL CDC с Auto Table Creation](./continuous-load-postgresql-database.md)
- [Сопоставление типов данных PostgreSQL](./data-type-mapping-postgresql.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
