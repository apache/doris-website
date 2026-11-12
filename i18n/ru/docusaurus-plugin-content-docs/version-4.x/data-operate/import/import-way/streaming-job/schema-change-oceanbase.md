---
{
    "title": "Синхронизация изменений схемы OceanBase",
    "language": "ru",
    "sidebar_label": "Синхронизация изменений схемы",
    "description": "Узнайте, какие изменения схемы OceanBase поддерживаются функцией CDC Auto Table Creation Sync, как Doris их применяет и какие существуют ограничения.",
    "keywords": [
        "OceanBase Schema Change",
        "OceanBase CDC",
        "Auto Table Creation Sync",
        "continuous load",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution Экспериментальная функция

Непрерывная загрузка Doris является экспериментальной функцией и поддерживается начиная с Doris 4.1.5.

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

Синхронизация изменений схемы OceanBase автоматически применяет изменения столбцов в источнике к целевым таблицам Doris во время непрерывной загрузки. Эта возможность применяется только к [OceanBase CDC с Auto Table Creation](./continuous-load-oceanbase-database.md).

Синхронизация изменений схемы OceanBase поддерживает только режим совместимости MySQL.

OceanBase использует путь обработки изменений схемы MySQL CDC, поэтому поддерживаемые изменения и поведение такие же, как для MySQL.

## Поддерживаемые изменения схемы {#supported-schema-changes}

| Операция OceanBase | Поведение Doris |
| --- | --- |
| `ADD COLUMN` | Добавляется столбец с тем же именем и типом, определяемым в [Сопоставлении типов данных OceanBase](./data-type-mapping-oceanbase.md), и копируется комментарий столбца. Ограничения DEFAULT и `NOT NULL` не копируются, а исторические строки не заполняются задним числом. Для последующих строк используются фактические значения, записанные OceanBase в binlog. |
| `DROP COLUMN` | Удаляется столбец с тем же именем. |

## Особенности {#considerations}

- Если добавляемый столбец уже существует или удаляемый столбец отсутствует, Doris пропускает операцию, чтобы повторные попытки не приводили к сбою задания.
- Позиции столбцов, указанные с помощью `FIRST` и `AFTER`, в Doris не синхронизируются. Новые столбцы добавляются после существующих столбцов Doris.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, изменения DEFAULT и изменения ограничений `NULL` / `NOT NULL` автоматически не синхронизируются.
- Изменения первичного ключа, индексов, партиционирования, имени таблицы и другие изменения схемы на уровне таблицы автоматически не синхронизируются.
- Перед неподдерживаемым изменением схемы приостановите задание непрерывной загрузки, вручную измените целевую таблицу Doris, убедитесь в совместимости обеих схем, затем возобновите задание.
- Auto Table Creation Sync по умолчанию включает синхронизацию изменений схемы. В настоящее время Doris не предоставляет свойства SQL для ее отключения.

## Пример {#example}

Добавьте столбец в исходную таблицу OceanBase:

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

После обработки заданием инкрементальных данных в целевой таблице Doris появляется столбец `city`:

```sql
DESC target_db.users;
```

```text
+-------+--------------+------+-------+---------+-------+
| Field | Type         | Null | Key   | Default | Extra |
+-------+--------------+------+-------+---------+-------+
| id    | int          | No   | true  | NULL    |       |
| name  | varchar(100) | Yes  | false | NULL    | NONE  |
| city  | varchar(50)  | Yes  | false | NULL    | NONE  |
+-------+--------------+------+-------+---------+-------+
```

## Связанные документы {#related-documents}

- [OceanBase CDC с Auto Table Creation](./continuous-load-oceanbase-database.md)
- [Сопоставление типов данных OceanBase](./data-type-mapping-oceanbase.md)
- [Обзор непрерывной загрузки](./continuous-load-overview.md)
