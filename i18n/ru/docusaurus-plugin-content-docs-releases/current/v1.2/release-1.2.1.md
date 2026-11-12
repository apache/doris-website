---
{
    "title": "Выпуск 1.2.1",
    "language": "ru",
    "description": "DecimalV3 поддерживает более высокую точность и обеспечивает лучшую производительность. По сравнению с предыдущими версиями он имеет следующие преимущества."
}
---

# Улучшения {#improvement}

### Поддержка нового типа DecimalV3 {#supports-new-type-decimalv3}

DecimalV3 поддерживает более высокую точность и обеспечивает лучшую производительность. По сравнению с предыдущими версиями он имеет следующие преимущества.

- Более широкий диапазон представимых значений: диапазон значений значительно расширен, допустимый числовой диапазон — [1,38].

- Более высокая производительность: объём занимаемого пространства хранения адаптивно меняется в зависимости от точности.

- Более полная поддержка вывода точности: для разных выражений применяются разные правила определения точности результата.

[DecimalV3](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Types/DECIMALV3/)

### Поддержка Iceberg V2 {#support-iceberg-v2}

Добавлена поддержка Iceberg V2 (пока поддерживается только Position Delete; поддержка Equality Delete появится в следующих версиях).

Доступ к таблицам в формате Iceberg V2 можно получить через Multi-Catalog.

### Поддержка преобразования условия OR в IN {#support-or-condition-to-in}

Добавлена поддержка преобразования условия OR в условие IN, что в некоторых сценариях повышает эффективность выполнения. [#15437](https://github.com/apache/doris/pull/15437) [#12872](https://github.com/apache/doris/pull/12872)

### Оптимизация производительности загрузки и запросов для типа JSONB {#optimize-the-import-and-query-performance-of-jsonb-type}

Оптимизирована производительность загрузки и запросов для типа JSONB. [#15219](https://github.com/apache/doris/pull/15219)  [#15219](https://github.com/apache/doris/pull/15219)

### Stream Load поддерживает данные CSV в кавычках {#stream-load-supports-quoted-csv-data}

Найдите параметр trim_double_quotes в документации: [https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD)

### Broker поддерживает Tencent Cloud CHDFS, Baidu Cloud BOS и AFS {#broker-supports-tencent-cloud-chdfs-and-baidu-cloud-bos-afs}

Доступ к данным в CHDFS, BOS и AFS возможен через Broker. [#15297](https://github.com/apache/doris/pull/15297) [#15448](https://github.com/apache/doris/pull/15448)

### Новая функция {#new-function}

Добавлена функция `substring_index`. [#15373](https://github.com/apache/doris/pull/15373)

# Исправления ошибок {#bug-fix}

- Исправлена ошибка, из-за которой при обновлении с версии 1.1 до 1.2 в некоторых случаях терялась информация о правах пользователей. [#15144](https://github.com/apache/doris/pull/15144)

- Исправлена ошибка, из-за которой значение партиции определялось неверно при секционировании по типам datev2/datetimev2. [#15094](https://github.com/apache/doris/pull/15094)

- Исправлены ошибки во многих ранее выпущенных функциях. Полный список: [список PR](https://github.com/apache/doris/pulls?q=is%3Apr+label%3Adev%2F1.2.1-merged+is%3Aclosed)

# Примечания к обновлению {#upgrade-notice}

### Известные проблемы {#known-issues}

- Не используйте JDK11 в качестве среды выполнения для BE: это приведёт к аварийному завершению BE.
- В этой версии снизилась производительность чтения данных в формате CSV, что повлияет на эффективность загрузки и чтения таких данных. Мы исправим это как можно скорее в следующей версии с трёхзначным номером.

### Изменения в поведении {#behavior-changed}

- Значение параметра конфигурации BE `high_priority_flush_thread_num_per_store` по умолчанию изменено с 1 на 6 для повышения эффективности записи при использовании Routine Load. (https://github.com/apache/doris/pull/14775)

- Значение параметра конфигурации FE `enable_new_load_scan_node` по умолчанию изменено на true. Задачи загрузки будут выполняться с использованием нового File Scan Node. На пользователей это не повлияет. [#14808](https://github.com/apache/doris/pull/14808)

- Параметр конфигурации FE `enable_multi_catalog` удалён. Функция Multi-Catalog включена по умолчанию.

- Векторизованный движок выполнения принудительно включён по умолчанию. [#15213](https://github.com/apache/doris/pull/15213)

Сеансовая переменная enable_vectorized_engine больше не действует. Векторизованный движок включён по умолчанию.

Чтобы переменная снова действовала, установите для параметра конфигурации FE `disable_enable_vectorized_engine` значение false и перезапустите FE. После этого `enable_vectorized_engine` снова будет действовать.


# Большое спасибо {#big-thanks}

Спасибо ВСЕМ, кто участвовал в подготовке этого выпуска!


@adonis0147

@AshinGau

@BePPPower

@BiteTheDDDDt

@ByteYue

@caiconghui

@cambyzju

@chenlinzhong

@dataroaring

@Doris-Extras

@dutyu

@eldenmoon

@englefly

@freemandealer

@Gabriel39

@HappenLee

@Henry2SS

@hf200012

@jacktengg

@Jibing-Li

@Kikyou1997

@liaoxin01

@luozenglin

@morningman

@morrySnow

@mrhhsg

@nextdreamblue

@qidaye

@spaces-X

@starocean999

@wangshuo128

@weizuo93

@wsjz

@xiaokang

@xinyiZzz

@xutaoustc

@yangzhg

@yiguolei

@yixiutt

@Yulei-Yang

@yuxuan-luo

@zenoyang

@zhangstar333

@zhannngchen

@zhengshengjun
