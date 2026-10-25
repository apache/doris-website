---
{
    "title": "Doris Spark Connector",
    "language": "ru",
    "description": "Примечания к выпускам Doris Spark Connector."
}
---

# Doris Spark Connector {#doris-spark-connector}

В этом документе перечислены выпуски Doris Spark Connector в обратном хронологическом порядке.

## 26.1.0 {#2610}

Источник: [Spark Doris Connector 26.1.0](https://github.com/apache/doris-spark-connector/issues/372)

### Spark Connector {#spark-connector}

#### Новые возможности и улучшения {#features-and-improvements}

- Добавлена поддержка представления столбцов Doris типа `ARRAY` в Spark как `Array[String]`. [#362](https://github.com/apache/doris-spark-connector/pull/362)
- Добавлена поддержка Spark 4.1. [#365](https://github.com/apache/doris-spark-connector/pull/365)
- Добавлена поддержка подключений к Doris с односторонним TLS. [#369](https://github.com/apache/doris-spark-connector/pull/369)
- Добавлены программы для регрессионного тестирования Doris. [#370](https://github.com/apache/doris-spark-connector/pull/370)
- Добавлена поддержка режима пакетной записи через S3 TVF. [#371](https://github.com/apache/doris-spark-connector/pull/371)
- Arrow Flight SQL стал режимом чтения по умолчанию. Если он недоступен, используется Thrift. [#367](https://github.com/apache/doris-spark-connector/pull/367)

#### Исправления ошибок {#bug-fixes}

- Исправлен поиск узлов BE указанной вычислительной группы в облачном режиме. [#361](https://github.com/apache/doris-spark-connector/pull/361)
- Исправлено преобразование временных меток Arrow для типов Doris `DATETIME` и `TIMESTAMPTZ`. [#366](https://github.com/apache/doris-spark-connector/pull/366)

### Благодарности {#thanks}

- @addu390
- @gnehil
- @JNSimba
- @LuciferYang

## 26.0.0 {#2600}

Источник: [Spark Doris Connector 26.0.0](https://github.com/apache/doris-spark-connector/issues/358)

### Spark Connector {#spark-connector-1}

#### Новые возможности и улучшения {#features-and-improvements-1}

- При записи через Stream Load по умолчанию включено сжатие gzip. [#356](https://github.com/apache/doris-spark-connector/pull/356)
- Добавлено журналирование чтения через Arrow Flight. [#354](https://github.com/apache/doris-spark-connector/pull/354)
- Добавлена поддержка HTTP-запросов с кодировкой UTF-8. [#347](https://github.com/apache/doris-spark-connector/pull/347)

#### Исправления ошибок {#bug-fixes-1}

- Исправлены проблемы с выборкой столбцов в Spark 3.3, 3.4 и 3.5. [#353](https://github.com/apache/doris-spark-connector/pull/353)

### Благодарности {#thanks-1}

- @JNSimba
- @gnehil

## 25.2.0 {#2520}

Источник: [Spark Doris Connector 25.2.0](https://github.com/apache/doris-spark-connector/issues/342)

### Spark Connector {#spark-connector-2}

#### Новые возможности и улучшения {#features-and-improvements-2}

- Для Doris Flight SQL Reader добавлены повторные попытки подключения к FE и стратегия балансировки нагрузки. [#318](https://github.com/apache/doris-spark-connector/pull/318)
- Добавлена стратегия балансировки нагрузки между узлами FE и BE. [#329](https://github.com/apache/doris-spark-connector/pull/329)
- Добавлен параметр для работы без схемы. [#332](https://github.com/apache/doris-spark-connector/pull/332)

#### Исправления ошибок {#bug-fixes-2}

- Исправлены проблемы с проталкиванием фильтров, содержащих `OR` в SQL. [#317](https://github.com/apache/doris-spark-connector/pull/317)
- Исправлена ошибка, из-за которой повторные попытки могли зависнуть при зависании FE. [#331](https://github.com/apache/doris-spark-connector/pull/331)
- Улучшена обработка параметра `accept_any_schema`. [#326](https://github.com/apache/doris-spark-connector/pull/326)
- Исправлены ошибки построения V2Expression. [#339](https://github.com/apache/doris-spark-connector/pull/339)
- Исправлена ошибка, из-за которой параметр `doris.benodes` не применялся. [#346](https://github.com/apache/doris-spark-connector/pull/346)

### Благодарности {#thanks-2}

- @JNSimba
- @wanggx
- @wary

## 25.1.0 {#2510}

Источник: [Примечания к выпуску Spark Doris Connector 25.1.0](https://github.com/apache/doris-spark-connector/issues/319)

### Spark Connector {#spark-connector-3}

#### Новые возможности и улучшения {#features-and-improvements-3}

- Добавлена поддержка перезаписи для DataSource V2. [#281](https://github.com/apache/doris-spark-connector/pull/281)
- Добавлена поддержка чтения типа `DECIMAL128`. [#290](https://github.com/apache/doris-spark-connector/pull/290)
- Добавлена совместимость при чтении типа данных IP. [#289](https://github.com/apache/doris-spark-connector/pull/289)
- Улучшено журналирование чтения через BE Thrift и загрузки через Stream Load. [#279](https://github.com/apache/doris-spark-connector/pull/279) [#313](https://github.com/apache/doris-spark-connector/pull/313)
- Добавлены интеграционные тесты для источника и приёмника Doris, а также проверки в CI для Spark 3.2, 3.4 и 3.5. [#296](https://github.com/apache/doris-spark-connector/pull/296) [#297](https://github.com/apache/doris-spark-connector/pull/297) [#302](https://github.com/apache/doris-spark-connector/pull/302) [#312](https://github.com/apache/doris-spark-connector/pull/312)
- Улучшена проверка портов узлов FE и повышена производительность записи. [#303](https://github.com/apache/doris-spark-connector/pull/303)
- Добавлены интервалы между повторными попытками при сбое загрузки. [#307](https://github.com/apache/doris-spark-connector/pull/307)
- Добавлены проверки кодов для запросов к FE. [#309](https://github.com/apache/doris-spark-connector/pull/309)
- После рефакторинга удалён неиспользуемый код. [#295](https://github.com/apache/doris-spark-connector/pull/295)

#### Исправления ошибок {#bug-fixes-3}

- Исправлена компиляция условий фильтрации с `IN`. [#277](https://github.com/apache/doris-spark-connector/pull/277)
- Исправлены модульные тесты преобразователей строк и схем. [#278](https://github.com/apache/doris-spark-connector/pull/278)
- Исправлено исключение из-за ссылки со значением NULL при фиксации транзакции для пустой партиции. [#286](https://github.com/apache/doris-spark-connector/pull/286)
- Исправлена ошибка, из-за которой результаты отсечения столбцов не передавались на нижний уровень. [#287](https://github.com/apache/doris-spark-connector/pull/287)
- Исправлено снижение производительности из-за ошибки в настройке интервала. [#294](https://github.com/apache/doris-spark-connector/pull/294)
- Исправлены проблемы при проталкивании выражений `CASE WHEN` из Spark. [#300](https://github.com/apache/doris-spark-connector/pull/300)
- Исправлена ошибка, из-за которой задачи загрузки зависали при неожиданном завершении Stream Load. [#305](https://github.com/apache/doris-spark-connector/pull/305)
- Исправлена ошибка, из-за которой запросы не выполнялись при проталкивании кодировки UTF-8. [#311](https://github.com/apache/doris-spark-connector/pull/311)
- Исправлены конфликты при переименовании `ArrowWriter` и `ArrowUtil`. [#315](https://github.com/apache/doris-spark-connector/pull/315)

### Spark Load {#spark-load}

#### Новые возможности и улучшения {#features-and-improvements-4}

- Добавлена поддержка загрузки конфигурации Hadoop из ресурсов. [#280](https://github.com/apache/doris-spark-connector/pull/280)

### Благодарности {#thanks-3}

- @aoyuEra
- @gnehil
- @JNSimba
- @IsmailTosunTnyl
- @qg-lin
- @vinlee19
- @wary

## 25.0.1 {#2501}

Источник: [Примечания к выпуску Spark Doris Connector 25.0.1](https://github.com/apache/doris-spark-connector/issues/276)

### Spark Connector {#spark-connector-4}

#### Новые возможности и улучшения {#features-and-improvements-5}

- Добавлена поддержка таблиц с произвольной схемой. [#269](https://github.com/apache/doris-spark-connector/pull/269)
- Добавлено журналирование ответов Stream Load. [#271](https://github.com/apache/doris-spark-connector/pull/271)
- Улучшены сообщения журнала. [#274](https://github.com/apache/doris-spark-connector/pull/274)
- Добавлены скрипты для выпуска версий. [#275](https://github.com/apache/doris-spark-connector/pull/275)

#### Исправления ошибок {#bug-fixes-4}

- Исправлены проблемы с записью в формате Arrow. [#270](https://github.com/apache/doris-spark-connector/pull/270)
- Исправлены проблемы с чтением, вызванные проталкиванием отсечения столбцов. [#273](https://github.com/apache/doris-spark-connector/pull/273)

### Spark Load {#spark-load-1}

#### Исправления ошибок {#bug-fixes-5}

- Исправлены модульные тесты и добавлены проверки сборки в CI. [#272](https://github.com/apache/doris-spark-connector/pull/272)

### Благодарности {#thanks-4}

- @gnehil
- @JNSimba

## 25.0.0 {#2500}

Источник: [Примечания к выпуску Spark Doris Connector 25.0.0](https://github.com/apache/doris-spark-connector/issues/268)

### Spark Connector {#spark-connector-5}

#### Новые возможности и улучшения {#features-and-improvements-6}

- Добавлена поддержка проталкивания операций через Spark DataSource V2 API. [#250](https://github.com/apache/doris-spark-connector/pull/250)
- Добавлена поддержка частичного проталкивания ограничения числа строк для Spark 3.2 и более поздних версий. [#257](https://github.com/apache/doris-spark-connector/pull/257)
- Добавлена совместимость с изменениями FE API. [#260](https://github.com/apache/doris-spark-connector/pull/260)
- Добавлена поддержка операторов `CREATE TABLE` для Spark 3.3 и более поздних версий. [#264](https://github.com/apache/doris-spark-connector/pull/264)

#### Исправления ошибок {#bug-fixes-6}

- Исправлено исключение драйвера при получении JDBC-подключения через Spark Catalog. [#251](https://github.com/apache/doris-spark-connector/pull/251)
- Исправлено исключение при преобразовании данных во время чтения типа date. [#253](https://github.com/apache/doris-spark-connector/pull/253)
- Исправлено исключение, возникавшее из-за загрузки драйвера Arrow JDBC при загрузке драйвера MySQL. [#254](https://github.com/apache/doris-spark-connector/pull/254)
- Исправлено несоответствие порядка столбцов схемы порядку столбцов данных. [#256](https://github.com/apache/doris-spark-connector/pull/256)
- Исправлено исключение при чтении данных типа JSON через Flight SQL. [#263](https://github.com/apache/doris-spark-connector/pull/263)
- Исправлено исключение при чтении данных типа date с включённым параметром `spark.sql.datetime.java8API.enabled`. [#265](https://github.com/apache/doris-spark-connector/pull/265)

### Spark Load {#spark-load-2}

#### Новые возможности и улучшения {#features-and-improvements-7}

- Добавлена поддержка выполнения заданий с использованием объектного хранилища. [#266](https://github.com/apache/doris-spark-connector/pull/266)

### Благодарности {#thanks-5}

- @gnehil
- @JNSimba
