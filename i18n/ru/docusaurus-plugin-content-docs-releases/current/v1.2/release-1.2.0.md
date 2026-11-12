---
{
    "title": "Релиз 1.2.0",
    "language": "ru",
    "description": "В стандартном тесте ssb-100-flat версия 1.2 работает в 2 раза быстрее версии 1.1; в сложном тесте TPCH 100,"
}
---

# Возможности {#feature}
## Основные изменения {#highlight}

1. Полная поддержка векторизованного движка и значительное повышение производительности

	В стандартном тесте ssb-100-flat версия 1.2 работает в 2 раза быстрее версии 1.1; в сложном тесте TPCH 100 версия 1.2 работает в 3 раза быстрее версии 1.1.

2. Merge-on-Write для модели Unique Key

	Модель Unique Key поддерживает Merge-on-Write. В этом режиме данные, которые нужно удалить или обновить, помечаются при записи. Это позволяет избежать затрат на Merge-on-Read при выполнении запросов и значительно повышает эффективность чтения в модели данных с возможностью обновления.

3. Multi Catalog

	Функция Multi Catalog позволяет Doris быстро подключаться к внешним источникам данных. Пользователи могут подключить внешний источник с помощью команды `CREATE CATALOG`. Doris автоматически сопоставит информацию о базах данных и таблицах внешнего источника. После этого пользователи смогут обращаться к его данным так же, как к обычным таблицам. Больше не нужно вручную создавать внешнее сопоставление для каждой таблицы.

    Сейчас поддерживаются следующие источники данных:

    1. Hive Metastore: доступ к таблицам данных Hive, Iceberg и Hudi. Также возможно подключение к источникам, совместимым с Hive Metastore, например к Alibaba Cloud DataLake Formation. Поддерживается доступ к данным как в HDFS, так и в объектном хранилище.
    2. Elasticsearch: доступ к источникам данных ES.
    3. JDBC: доступ к MySQL по протоколу JDBC.

    Документация: https://doris.apache.org//docs/dev/lakehouse/multi-catalog)

    > Примечание: соответствующий уровень разрешений также изменится автоматически. Подробности см. в разделе «Примечания к обновлению».

4. Быстрое изменение структуры таблицы

В новой версии при добавлении и удалении столбцов таблицы больше не требуется синхронно изменять файл данных: достаточно обновить метаданные в FE. Благодаря этому операция Schema Change выполняется за миллисекунды. Эта функция позволяет синхронизировать DDL из вышестоящего источника CDC. Например, с помощью Flink CDC пользователи могут синхронизировать DML и DDL из вышестоящей базы данных с Doris.

Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

При создании таблицы задайте в свойствах `"light_schema_change"="true"`.

5. JDBC facade

	Пользователи могут подключаться к внешним источникам данных через JDBC. Сейчас поддерживаются:

	  - MySQL
	  - PostgreSQL
	  - Oracle
	  - SQL Server
	  - Clickhouse

	Документация: [https://doris.apache.org/en/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/)

	> Примечание: поддержка ODBC будет удалена в одной из следующих версий. По возможности перейдите на JDBC.

6. JAVA UDF

	Поддерживается написание UDF/UDAF на Java, что позволяет пользователям применять пользовательские функции из экосистемы Java. При этом такие технологии, как вне JVM управляемая память и Zero Copy, значительно повысили эффективность доступа к данным между языками.

	Документация: https://doris.apache.org//docs/dev/ecosystem/udf/java-user-defined-function

	Пример: https://github.com/apache/doris/tree/master/samples/doris-demo

7. Remote UDF

	Поддерживается доступ к удалённым сервисам пользовательских функций через RPC. Благодаря этому пользователи могут писать UDF на любом языке программирования и применять собственные функции для сложного анализа данных.

	Документация: https://doris.apache.org//docs/ecosystem/udf/remote-user-defined-function

	Пример: https://github.com/apache/doris/tree/master/samples/doris-demo

8. Поддержка дополнительных типов данных

	- Тип Array

		Поддерживаются массивы, в том числе вложенные. Тип Array помогает представлять данные в таких сценариях, как профили пользователей и теги. Кроме того, в новой версии реализовано множество функций для работы с данными, которые упрощают применение этого типа в реальных задачах.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Types/ARRAY

	Связанные функции: https://doris.apache.org//docs/dev/sql-manual/sql-functions/array-functions/array_max

	- Тип Jsonb

		Поддерживается двоичный тип данных JSON — Jsonb. Он обеспечивает более компактное кодирование JSON и позволяет обращаться к данным в закодированном виде. По сравнению с хранением JSON в строках это может дать многократное повышение эффективности.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Types/JSONB

	Связанные функции: https://doris.apache.org//docs/dev/sql-manual/sql-functions/json-functions/jsonb_parse

	- Date V2

		Область применения:

		1. При создании таблицы пользователь должен явно указать datev2 и datetimev2. Типы date и datetime в существующих таблицах не затрагиваются.
		2. Если datev2 и datetimev2 используются в вычислениях вместе с исходными типами date и datetime (например, при соединении по равенству), исходный тип будет приведён к новому типу для вычисления.
		3. Пример приведён в документации.

		Документация: https://doris.apache.org/docs/1.2/sql-manual/sql-reference/Data-Types/DATEV2


## Другие возможности {#more}

1. Новая система управления памятью

	Документация: https://doris.apache.org//docs/dev/admin-manual/maint-monitor/memory-management/memory-tracker

2. Табличные функции

	В Doris реализован набор табличных функций (Table Valued Function, TVF). TVF можно использовать как обычную таблицу в любом месте SQL, где допускается таблица.

	Например, с помощью S3 TVF можно загрузить данные из объектного хранилища:

	```
	insert into tbl select * from s3("s3://bucket/file.*", "ak" = "xx", "sk" = "xxx") where c1 > 2;
	```

	Или напрямую запросить файлы данных в HDFS:

	```
	insert into tbl select * from hdfs("hdfs://bucket/file.*") where c1 > 2;
	```

	TVF позволяют использовать выразительные возможности SQL для гибкой обработки различных данных.

    Документация:

    https://doris.apache.org//docs/dev/sql-manual/sql-functions/table-functions/s3

    https://doris.apache.org//docs/dev/sql-manual/sql-functions/table-functions/hdfs

3. Более удобное создание разделов

	Поддерживается создание нескольких разделов в заданном временном диапазоне с помощью команды `FROM TO`.

4. Переименование столбцов

	Для таблиц с включённой функцией Light Schema Change поддерживается переименование столбцов.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-RENAME

5. Расширенное управление разрешениями

	- Поддержка разрешений на уровне строк

		Разрешения на уровне строк можно создать командой `CREATE ROW POLICY`.

		Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY

	- Поддержка настройки сложности пароля, срока его действия и других параметров.

	- Поддержка блокировки учётных записей после нескольких неудачных попыток входа.

		Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Account-Management-Statements/ALTER-USER

6. Загрузка данных

	- При загрузке CSV поддерживаются файлы с заголовком.

		Найдите `csv_with_names` в документации: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD/

	- В Stream Load добавлен параметр `hidden_columns`, позволяющий явно указать столбец с признаком удаления и столбец последовательности.

		Найдите `hidden_columns` в документации: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD

	- Spark Load поддерживает загрузку файлов Parquet и ORC.

	- Поддерживается очистка меток Label завершённых загрузок.

	  Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/CLEAN-LABEL

	- Поддерживается массовая отмена заданий загрузки по их состоянию.

		Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/CANCEL-LOAD

	- В broker load добавлена поддержка Alibaba Cloud oss, Tencent Cloud cos/chdfs и Huawei Cloud obs.

		Документация: https://doris.apache.org//docs/dev/advanced/broker

	- Поддерживается доступ к HDFS с настройкой через файл hive-site.xml.

		Документация: https://doris.apache.org//docs/dev/admin-manual/config/config-dir

7. Поддерживается просмотр содержимого корзины каталогов с помощью функции `SHOW CATALOG RECYCLE BIN`.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Show-Statements/SHOW-CATALOG-RECYCLE-BIN

8. Поддерживается синтаксис `SELECT * EXCEPT`.

	Документация: https://doris.apache.org//docs/dev/data-table/basic-usage

9. OUTFILE поддерживает экспорт в формате ORC и многобайтовые разделители.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/OUTFILE

10. Через конфигурацию можно изменять количество сохраняемых профилей запросов Query Profile.

	Найдите в документации параметр конфигурации FE: max_query_profile_num

11. Оператор DELETE поддерживает условия с предикатом IN, а также исключение ненужных разделов при выполнении запроса.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/DELETE

12. В качестве значения по умолчанию для столбца времени можно использовать `CURRENT_TIMESTAMP`.

	Найдите «CURRENT_TIMESTAMP» в документации: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

13. Добавлены две системные таблицы: backends и rowsets.

	Документация:

	https://doris.apache.org//docs/dev/admin-manual/system-table/backends

	https://doris.apache.org//docs/dev/admin-manual/system-table/rowsets

14. Резервное копирование и восстановление

	- Задание Restore поддерживает параметр `reserve_replica`, благодаря которому число реплик восстановленной таблицы совпадает с числом реплик в резервной копии.

	- Задание Restore поддерживает параметр `reserve_dynamic_partition_enable`, благодаря которому в восстановленной таблице остаётся включённым динамическое разбиение на разделы.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Backup-and-Restore/RESTORE

	- Операции резервного копирования и восстановления поддерживаются через встроенную libhdfs без зависимости от broker.

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Backup-and-Restore/CREATE-REPOSITORY

15. Поддерживается балансировка данных между несколькими дисками на одной машине.

	Документация:

	https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-REBALANCE-DISK

	https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-CANCEL-REBALANCE-DISK

16. Routine Load поддерживает подписку на сервисы Kafka с аутентификацией Kerberos.

	Найдите kerberos в документации: https://doris.apache.org//docs/dev/data-operate/import/import-way/routine-load-manual

17. Новые встроенные функции

	Добавлены следующие встроенные функции:

	- `cbrt`
	- `sequence_match/sequence_count`
	- `mask/mask_first_n/mask_last_n`
	- `elt`
	- `any/any_value`
	- `group_bitmap_xor`
	- `ntile`
	- `nvl`
	- `uuid`
	- `initcap`
	- `regexp_replace_one/regexp_extract_all`
	- `multi_search_all_positions/multi_match_any`
	- `domain/domain_without_www/protocol`
	- `running_difference`
	- `bitmap_hash64`
	- `murmur_hash3_64`
	- `to_monday`
	- `not_null_or_empty`
	- `window_funnel`
	- `group_bit_and/group_bit_or/group_bit_xor`
	- `outer combine`
	- и все функции для работы с массивами

# Примечания к обновлению {#upgrade-notice}

## Известные проблемы {#known-issues}

- Использование JDK11 приводит к сбою BE. Используйте JDK8.

## Изменения в поведении {#behavior-changed}

- Изменения уровней разрешений

	В связи с появлением уровня Catalog соответствующие уровни разрешений пользователей также изменятся автоматически. Правила следующие:

	- GlobalPrivs и ResourcePrivs остаются без изменений.
	- Добавлен уровень CatalogPrivs.
	- К исходному уровню DatabasePrivs добавляется префикс internal, указывающий на базу данных во внутреннем каталоге.
	- К исходному уровню TablePrivs добавляется префикс internal, указывающий на таблицу во внутреннем каталоге.

- В предложениях GroupBy и Having имена столбцов при сопоставлении имеют приоритет перед псевдонимами. (#14408)

- Создание столбцов с именами, начинающимися с `mv_`, больше не поддерживается. `mv_` — зарезервированный префикс для материализованных представлений. (#14361)

- Удалено ограничение по умолчанию в 65535 строк, которое добавлялось оператором order by. Для настройки этого ограничения добавлена переменная сеанса `default_order_by_limit`. (#12478)

- В таблицах, созданных с помощью «Create Table As Select», все строковые столбцы получают тип string: различия между varchar, char и string больше не сохраняются. (#14382)

- В журнале аудита из имён баз данных и пользователей удалено слово `default_cluster`. (#13499) (#11408)

- В журнал аудита добавлено поле sql digest. (#8919)

- Изменена логика сортировки при использовании предложения union. В новой версии предложение order by выполняется после union, если иное явно не задано скобками. (#9745)

- При выводе узла из эксплуатации планшеты в корзине игнорируются, чтобы операция могла завершиться. (#14028)

- Возвращаемое значение Decimal отображается с точностью, объявленной для исходного столбца или указанной в функции cast. (#13437)

- Максимальная длина имени столбца увеличена с 64 до 256 символов. (#14671)

- Изменения параметров конфигурации FE

  - Параметр `enable_vectorized_load` включён по умолчанию. (#11833)

  - Увеличено значение `create_table_timeout`. Время ожидания создания таблицы по умолчанию стало больше. (#13520)

  - Значение `stream_load_default_timeout_second` по умолчанию изменено на 3 дня.

  - Значение `alter_table_timeout_second` по умолчанию изменено на один месяц.

  - Добавлен параметр `max_replica_count_when_schema_change`, ограничивающий число реплик, задействованных в задании alter. Значение по умолчанию — 100000. (#12850)

  - Добавлен параметр `disable_iceberg_hudi_table`. Доступ к Iceberg и Hudi прежним способом по умолчанию отключён; рекомендуется использовать Multi Catalog. (#13932)

- Изменения параметров конфигурации BE

  - Удалён параметр `disable_stream_load_2pc`. Теперь Stream Load с 2PC можно использовать напрямую. (#13520)

  - Значение `tablet_rowset_stale_sweep_time_sec` изменено с 1800 на 300 секунд.

  - Переименованы параметры конфигурации, связанные с compaction. (#13495)

  - Пересмотрены параметры, связанные с оптимизацией памяти. (#13781)

- Изменения переменных сеанса

   - Значение переменной `enable_insert_strict` по умолчанию изменено на true. Из-за этого некоторые операции вставки, которые раньше выполнялись, но записывали недопустимые значения, теперь не выполняются. (11866)

   - Значение переменной `enable_local_exchange` по умолчанию изменено на true. (#13292)

   - При передаче данных по умолчанию используется сжатие lz4; этим управляет переменная `fragment_transmission_compression_codec`. (#11955)

   - Добавлена переменная `skip_storage_engine_merge` для отладки данных моделей unique и agg. (#11952)

     Документация: https://doris.apache.org//docs/dev/advanced/variables

- Скрипт запуска BE проверяет через `/proc/sys/vm/max_map_count`, превышает ли значение 200W. Если нет, запуск завершается ошибкой. (#11052)

- Удалён интерфейс mini load. (#10520)

- Версия метаданных FE

	Версия метаданных FE изменена со 107 на 114. После обновления откат невозможен.

## Во время обновления {#during-upgrade}

1. Подготовка к обновлению

   - Необходимо заменить каталог lib и каталог bin, поскольку скрипты запуска и остановки изменились.

   - Для BE также необходимо настроить JAVA_HOME; уже поддерживаются JDBC Table и Java UDF.

   - Значение параметра JVM Xmx по умолчанию в fe.conf изменено на 8GB.

2. Возможные ошибки при обновлении

   - Функция repeat может быть недоступна с ошибкой `vectorized repeat function cannot be executed`. Перед обновлением можно отключить векторизованный движок выполнения. (#13868)

   - Операция schema change может завершиться с ошибкой `desc_tbl is not set. Maybe the FE version is not equal to the BE`. (#13822)

   - Векторизованное хеш-соединение может быть недоступно с ошибкой `vectorized hash join cannot be executed`. Перед обновлением можно отключить векторизованный движок выполнения. (#13753)

	После полного обновления указанные ошибки исчезнут.

## Влияние на производительность {#performance-impact}

- В новой версии BE в качестве распределителя памяти по умолчанию используется JeMalloc вместо TcMalloc. (#13367)

- Размер пакета в tablet sink изменён: теперь он составляет не менее 8K. (#13912)

- Распределитель chunk по умолчанию отключён. (#13285)

## Изменения API {#api-change}

- Изменён формат ошибок, возвращаемых HTTP API BE: вместо `{"status": "Fail", "msg": "xxx"}` возвращается более конкретное сообщение, например ``{"status": "Not found", "msg": "Tablet not found. tablet_id=1202"}``. (#9771)

- В результате `SHOW CREATE TABLE` комментарии теперь заключаются в одинарные кавычки вместо двойных. (#10327)

- Обычные пользователи могут получать профиль запроса через HTTP-команду. (#14016)
Документация: https://doris.apache.org//docs/dev/admin-manual/http-actions/fe/manager/query-profile-action

- Упрощено указание столбца последовательности: теперь можно напрямую указать его имя. (#13872)
Документация: https://doris.apache.org//docs/dev/data-operate/update-delete/sequence-column-manual

- В результаты команд `show backends` и `show tablets` добавлена информация об использовании места в удалённом хранилище. (#11450)

- Удалён код, связанный с Num-Based Compaction. (#13409)

- Переработан механизм кодов ошибок BE; некоторые возвращаемые сообщения об ошибках изменятся. (#8855)
Прочее

- Поддерживается официальный образ Docker.

- Поддерживается сборка Doris на MacOS(x86/M1) и ubuntu-22.04.
  Документация: https://doris.apache.org//docs/dev/install/source-install/compilation-mac/

- Поддерживается проверка файлов образов.

  Документация: https://doris.apache.org//docs/dev/admin-manual/maint-monitor/metadata-operation/

- Изменения скриптов

  - Скрипты остановки FE и BE поддерживают завершение процессов FE и BE с помощью параметра `--grace` (используется сигнал kill -15 вместо kill -9).

  - Скрипт запуска FE поддерживает проверку текущей версии FE с помощью --version. (#11563)

 - Команда `ADMIN COPY TABLET` позволяет получить данные планшета и соответствующий оператор создания таблицы для локальной отладки. (#12176)

	Документация: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-COPY-TABLET

- Через HTTP API можно получить оператор создания таблицы, связанный с SQL-оператором, для локального воспроизведения проблемы. (#11979)

	Документация: https://doris.apache.org//docs/dev/admin-manual/http-actions/fe/query-schema-action

- При создании таблицы можно отключить для неё функцию compaction в целях тестирования. (#11743)

	Найдите «disble_auto_compaction» в документации: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

# Благодарности {#big-thanks}

Спасибо всем, кто участвовал в подготовке этого релиза! Список приведён в алфавитном порядке.
```
@924060929
@a19920714liou
@adonis0147
@Aiden-Dong
@aiwenmo
@AshinGau
@b19mud
@BePPPower
@BiteTheDDDDt
@bridgeDream
@ByteYue
@caiconghui
@CalvinKirs
@cambyzju
@caoliang-web
@carlvinhust2012
@catpineapple
@ccoffline
@chenlinzhong
@chovy-3012
@coderjiang
@cxzl25
@dataalive
@dataroaring
@dependabot[bot]
@dinggege1024
@DongLiang-0
@Doris-Extras
@eldenmoon
@EmmyMiao87
@englefly
@FreeOnePlus
@Gabriel39
@gaodayue
@geniusjoe
@gj-zhang
@gnehil
@GoGoWen
@HappenLee
@hello-stephen
@Henry2SS
@hf200012
@huyuanfeng2018
@jacktengg
@jackwener
@jeffreys-cat
@Jibing-Li
@JNSimba
@Kikyou1997
@Lchangliang
@LemonLiTree
@lexoning
@liaoxin01
@lide-reed
@link3280
@liutang123
@liuyaolin
@LOVEGISER
@lsy3993
@luozenglin
@luzhijing
@madongz
@morningman
@morningman-cmy
@morrySnow
@mrhhsg
@Myasuka
@myfjdthink
@nextdreamblue
@pan3793
@pangzhili
@pengxiangyu
@platoneko
@qidaye
@qzsee
@SaintBacchus
@SeekingYang
@smallhibiscus
@sohardforaname
@song7788q
@spaces-X
@ssusieee
@stalary
@starocean999
@SWJTU-ZhangLei
@TaoZex
@timelxy
@Wahno
@wangbo
@wangshuo128
@wangyf0555
@weizhengte
@weizuo93
@wsjz
@wunan1210
@xhmz
@xiaokang
@xiaokangguo
@xinyiZzz
@xy720
@yangzhg
@Yankee24
@yeyudefeng
@yiguolei
@yinzhijian
@yixiutt
@yuanyuan8983
@zbtzbtzbt
@zenoyang
@zhangboya1
@zhangstar333
@zhannngchen
@ZHbamboo
@zhengshiJ
@zhenhb
@zhqu1148980644
@zuochunwei
@zy-kkk
```
