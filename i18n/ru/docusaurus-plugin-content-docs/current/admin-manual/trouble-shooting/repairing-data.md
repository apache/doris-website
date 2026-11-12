---
{
    "title": "Восстановление данных",
    "language": "ru",
    "description": "В некоторых версиях Doris есть ошибки, из-за которых система может неправильно вычислять delete bitmap для таблиц Unique Key Merge on Write,"
}
---

# Восстановление данных {#repairing-data}

В некоторых версиях Doris есть ошибки, из-за которых система может неправильно вычислять delete bitmap для таблиц Unique Key Merge on Write, что приводит к дублированию первичных ключей. В таком случае данные можно восстановить с помощью функции full compaction. Эта функция не работает для таблиц, отличных от Unique Key Merge on Write.

Для использования этой функции требуется Doris версии 2.0+.

Перед использованием этой функции следует по возможности приостановить загрузку данных, иначе могут возникнуть такие проблемы, как превышение времени ожидания загрузки.

## Краткое объяснение принципа работы {#brief-principle-explanation}

После выполнения full compaction delete bitmap пересчитывается, а ошибочные данные delete bitmap удаляются, что обеспечивает восстановление данных.

## Инструкции по использованию {#instructions-for-use}

`POST /api/compaction/run?tablet_id={int}&compact_type=full`

или

`POST /api/compaction/run?table_id={int}&compact_type=full`

Обратите внимание: можно указать только один из параметров tablet_id и table_id; указывать их одновременно нельзя. При указании table_id full_compaction автоматически выполняется для всех tablets этой таблицы.

## Пример использования {#example-of-use}

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=full"
curl -X POST "http://127.0.0.1:8040/api/compaction/run?table_id=10104&compact_type=full"
```
