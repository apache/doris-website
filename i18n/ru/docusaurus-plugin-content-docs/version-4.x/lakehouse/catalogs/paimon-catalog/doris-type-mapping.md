---
{
    "title": "Сопоставление типов данных Paimon с типами Doris",
    "sidebar_label": "Сопоставление типов данных Doris",
    "description": "Справочник по сопоставлению типов Paimon в Doris 4.2: типы данных, точность, вложенные типы и неподдерживаемые типы."
}
---

В следующей таблице описано, как Doris 4.2 (`branch-4.2`) сопоставляет типы данных в схемах внешних таблиц Paimon при чтении. Запись также зависит от целевой схемы и поддерживаемых операций записи; сопоставление при чтении не задаёт автоматически обратное сопоставление для записи.

| Тип Paimon                         | Тип Doris     | Комментарий                                                             |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------- |
| boolean                            | boolean       |                                                                         |
| tinyint                            | tinyint       |                                                                         |
| smallint                           | smallint      |                                                                         |
| integer                            | int           |                                                                         |
| bigint                             | bigint        |                                                                         |
| float                              | float         |                                                                         |
| double                             | double        |                                                                         |
| decimal(P, S)                      | decimal(P, S) |                                                                         |
| varchar(N) | VARCHAR(N) / STRING | `VARCHAR(N)` при `N <= 65533`; в остальных случаях `STRING`. |
| char(N) | CHAR(N) / STRING | `CHAR(N)` при `N <= 255`; в остальных случаях `STRING`. |
| binary(N), varbinary(N) | VARBINARY(N) | Сохраняется объявленная длина в байтах. |
| date                               | date          |                                                                         |
| timestamp_without_time_zone(P) | DATETIME(P) / TIMESTAMP_NS | `DATETIME(P)` при `P <= 6`; в версии 4.2 при `P > 6` используется `TIMESTAMP_NS`, что позволяет сохранить доли микросекунды. |
| timestamp\_with\_local\_time\_zone | TIMESTAMPTZ(N) | Начиная с версии 4.1.5 этот тип всегда сопоставляется с `TIMESTAMPTZ(N)`. Точность ограничена 6 знаками, поэтому более высокая точность теряется. |
| array                              | array         |                                                                         |
| map                                | map           |                                                                         |
| row                                | struct        |                                                                         |
| variant | VARIANT | Для чтения требуется настройка FE `enable_variant_v2=true`. |
| time_without_time_zone | UNSUPPORTED | |
| other                              | UNSUPPORTED   |                                                                         |

## Примечания по использованию {#usage-notes}

Для вложенных полей сложных типов рекурсивно применяются те же правила сопоставления. `TIMESTAMPTZ` представляет момент времени, отображаемый с учётом часового пояса сеанса, заданного в `time_zone`.

Обработка точности различается для временных меток без часового пояса и временных меток с локальным часовым поясом: версия 4.2 позволяет сохранять наносекунды для первых, тогда как точность вторых ограничена шестью знаками дробной части. Диапазон `TIMESTAMP_NS`: от `1677-09-21 00:12:43.145224192` до `2262-04-11 23:47:16.854775807`.

В выводе `DESCRIBE table_name` значение `WITH_TIMEZONE` в столбце Extra указывает на поле источника, учитывающее часовой пояс.

Ссылка на реализацию: [PaimonUtil.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/paimon/PaimonUtil.java) (`branch-4.2`).
