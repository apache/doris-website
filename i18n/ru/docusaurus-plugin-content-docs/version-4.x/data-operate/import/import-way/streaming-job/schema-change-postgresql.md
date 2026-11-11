---
{
    "title": "Синхронизация изменений схемы PostgreSQL",
    "language": "ru",
    "sidebar_label": "Синхронизация изменений схемы",
    "description": "Описывает поддерживаемые изменения схемы и поведение синхронизации в режиме PostgreSQL CDC Auto Table Creation Sync.",
    "keywords": [
        "PostgreSQL Schema Change",
        "PostgreSQL CDC",
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
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL Schema Change Sync автоматически применяет изменения столбцов исходной базы PostgreSQL к Doris во время непрерывной загрузки. Эта возможность применяется только к [PostgreSQL CDC с Auto Table Creation](./continuous-load-postgresql-database.md). Она не поддерживается в [PostgreSQL CDC с SQL Mapping](./continuous-load-postgresql-table.md).

## Поддерживаемые изменения схемы {#supported-schema-changes}

| Операция PostgreSQL | Поведение Doris |
| --- | --- |
| `ADD COLUMN` | Добавляет столбец с тем же именем и типом, определённым согласно [сопоставлению типов данных PostgreSQL](./data-type-mapping-postgresql.md). Ограничения DEFAULT и `NOT NULL` не копируются, а исторические строки не заполняются задним числом. Для последующих строк используются фактические значения, записанные PostgreSQL в WAL. |
| `DROP COLUMN` | Удаляет столбец с тем же именем. |

## Особенности {#considerations}

- Изменение схемы PostgreSQL не распространяется немедленно, если выполнена только DDL-команда. Doris обнаруживает и применяет новую схему после того, как изменённая таблица получает последующую операцию INSERT, UPDATE или DELETE.
- Автоматическая синхронизация изменений схемы не поддерживается на этапе полного снимка. Выполняйте изменения схемы в источнике после завершения полного снимка и перехода задания в инкрементальную фазу.
- Если добавляемый столбец уже существует или удаляемый столбец отсутствует, Doris пропускает операцию, чтобы повторная попытка не привела к сбою задания.
- Если одно изменение схемы одновременно добавляет и удаляет столбцы, Doris считает это возможным переименованием столбца и не изменяет целевую таблицу автоматически. Это предотвращает случайную потерю данных.
- Переименования столбцов, изменения типов столбцов, изменения DEFAULT и изменения ограничений `NULL` / `NOT NULL` автоматически не синхронизируются. Приостановите задание непрерывной загрузки, вручную измените целевую таблицу Doris, убедитесь в совместимости обеих схем, а затем возобновите задание.
- Auto Table Creation Sync включает Schema Change Sync по умолчанию. В Doris 4.1 нет свойства SQL для его отключения. Табличная функция `cdc_stream()` (SQL Mapping Sync) внутренне отключает Schema Change Sync.

:::caution Поведение при изменении схемы

Обнаружение изменений схемы PostgreSQL основано на событиях Relation:

- Распознаются только `ADD COLUMN` и `DROP COLUMN`.
- Изменение, одновременно добавляющее и удаляющее столбцы (возможно, `RENAME`), пропускается, а целевая таблица остаётся без изменений.
- Изменения типов столбцов пропускаются.
- Добавляемый столбец **не получает значение `DEFAULT` исходного столбца**.
- Эта возможность применяется только к пути Auto Table Creation Sync (at-least-once). Путь SQL Mapping (TVF / exactly-once) её не поддерживает.

:::

## Связанная документация {#related-docs}

- [PostgreSQL CDC с Auto Table Creation](./continuous-load-postgresql-database.md)
- [Сопоставление типов данных PostgreSQL](./data-type-mapping-postgresql.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
