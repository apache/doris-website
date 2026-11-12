---
{
    "title": "Doris Flink Connector",
    "language": "ru",
    "description": "Примечания к выпускам Doris Flink Connector."
}
---

# Doris Flink Connector {#doris-flink-connector}

В этом документе перечислены выпуски Doris Flink Connector в обратном хронологическом порядке.

## 26.3.0 {#2630}

Источник: [Примечания к выпуску 26.3.0](https://github.com/apache/doris-flink-connector/issues/699)

### Функции и улучшения {#features-and-improvements}

- Улучшены журналирование Doris Source и проверка смещений. [#692](https://github.com/apache/doris-flink-connector/pull/692)
- Добавлена поддержка Flink 2.3. [#696](https://github.com/apache/doris-flink-connector/pull/696)
- Улучшены обработка CDC TSO и эффективность загрузки через S3 TVF. [#694](https://github.com/apache/doris-flink-connector/pull/694)
- Добавлены повторные попытки инкрементального чтения при истечении времени ожидания видимости данных. [#697](https://github.com/apache/doris-flink-connector/pull/697)
- Добавлена поддержка ролей IAM и сжатия gzip для приёмника S3 TVF. [#698](https://github.com/apache/doris-flink-connector/pull/698)

### Благодарности {#thanks}

- @JNSimba

## 26.2.0 {#2620}

Источник: [Примечания к выпуску 26.2.0](https://github.com/apache/doris-flink-connector/issues/691)

### Функции и улучшения {#features-and-improvements-1}

- Добавлена поддержка режимов сканирования snapshot, incremental и initial для Doris Source. [#679](https://github.com/apache/doris-flink-connector/pull/679)
- Добавлена поддержка односторонних TLS-соединений с Doris через HTTP, MySQL/JDBC, Thrift и Arrow Flight SQL. [#686](https://github.com/apache/doris-flink-connector/pull/686)
- Добавлена поддержка режима записи через приёмник S3 TVF. [#688](https://github.com/apache/doris-flink-connector/pull/688)
- Добавлены сборка с JDK 21 и проверка в CI для Flink 2.x. [#678](https://github.com/apache/doris-flink-connector/pull/678)
- Добавлена передача стандартных метрик приёмника FLIP-33 `numRecordsSend` и `numBytesSend`. [#681](https://github.com/apache/doris-flink-connector/pull/681)
- Добавлена поддержка типа PostgreSQL `regclass` при синхронизации CDC. [#658](https://github.com/apache/doris-flink-connector/pull/658)
- Добавлены программы регрессионного тестирования Doris. [#687](https://github.com/apache/doris-flink-connector/pull/687)

### Исправления ошибок {#bug-fixes}

- Исправлен чрезмерный размер состояния контрольных точек при создании начальных снимков больших таблиц. [#690](https://github.com/apache/doris-flink-connector/pull/690)
- Исправлена ошибка, из-за которой `DorisWriter` прерывал не ту транзакцию. [#683](https://github.com/apache/doris-flink-connector/pull/683)
- Исправлен разбор данных MongoDB CDC, когда `fullDocument` возвращается как строка JSON. [#671](https://github.com/apache/doris-flink-connector/pull/671)
- Исправлено преобразование временных меток Arrow для типов Doris `DATETIME` и `TIMESTAMPTZ`. [#676](https://github.com/apache/doris-flink-connector/pull/676)

### Благодарности {#thanks-1}

- @Cq-study
- @JNSimba
- @liujiwen-up
- @Sbaia
- @Tan-JiaLiang
- @ziyanTOP

## 26.1.1 {#2611}

Источник: [Примечания к выпуску 26.1.1](https://github.com/apache/doris-flink-connector/issues/654)

### Исправления ошибок {#bug-fixes-1}

- Исправлена ошибка, из-за которой при включённом сжатии приёмники пакетной записи могли зависать после длительной работы. [#653](https://github.com/apache/doris-flink-connector/pull/653)

### Благодарности {#thanks-2}

- @addu390

## 26.1.0 {#2610}

Источник: [Примечания к выпуску 26.1.0](https://github.com/apache/doris-flink-connector/issues/649)

### Функции и улучшения {#features-and-improvements-2}

- Для Stream Load по умолчанию включено сжатие gzip. [#648](https://github.com/apache/doris-flink-connector/pull/648)

### Благодарности {#thanks-3}

- @JNSimba

## 26.0.0 {#2600}

Источник: [Примечания к выпуску 26.0.0](https://github.com/apache/doris-flink-connector/issues/637)

### Функции и улучшения {#features-and-improvements-3}

- Добавлена поддержка типа Doris `DECIMAL256`. [#628](https://github.com/apache/doris-flink-connector/pull/628)
- Добавлена поддержка полей вложенных типов в `ArrayData`. [#606](https://github.com/apache/doris-flink-connector/pull/606)
- Добавлена поддержка HTTP-запросов в кодировке UTF-8. [#623](https://github.com/apache/doris-flink-connector/pull/623)
- Добавлена возможность настройки максимального размера сообщения Thrift. [#593](https://github.com/apache/doris-flink-connector/pull/593)
- Оптимизировано определение типов в MongoDB CDC, чтобы избежать ненужного преобразования в десятичный тип. [#596](https://github.com/apache/doris-flink-connector/pull/596)
- Улучшено сообщение об ошибке при неверном имени хоста FE. [#629](https://github.com/apache/doris-flink-connector/pull/629)
- Добавлена поддержка Flink 2.x. [#636](https://github.com/apache/doris-flink-connector/pull/636)

### Исправления ошибок {#bug-fixes-2}

- Исправлена обработка меток при повторных попытках group commit. [#635](https://github.com/apache/doris-flink-connector/pull/635)
- Исправлена пакетная обработка Stream Load для типов данных без разделителей строк. [#619](https://github.com/apache/doris-flink-connector/pull/619)
- Исправлена генерация DDL для полей Doris, у которых значением по умолчанию является пустая строка. [#600](https://github.com/apache/doris-flink-connector/pull/600)
- Исправлена опечатка в `BackendClient`, которая могла влиять на чтение через Arrow Flight. [#622](https://github.com/apache/doris-flink-connector/pull/622)

### Благодарности {#thanks-4}

- @QuakeWang
- @JNSimba
- @jqcc
- @potterhe
- @kwonder0926
- @gnehil
- @keytouch
- @AlexRiedler

## 25.1.0 {#2510}

Источник: [Примечания к выпуску 25.1.0](https://github.com/apache/doris-flink-connector/issues/590)

### Функции и улучшения {#features-and-improvements-4}

- Добавлено автоматическое создание новых таблиц синхронизации в сценариях шардинга. [#564](https://github.com/apache/doris-flink-connector/pull/564)
- Arrow Flight SQL стал способом чтения по умолчанию для Doris Source. [#574](https://github.com/apache/doris-flink-connector/pull/574)
- Добавлены интеграционные и сквозные тесты. [#569](https://github.com/apache/doris-flink-connector/pull/569) [#577](https://github.com/apache/doris-flink-connector/pull/577) [#580](https://github.com/apache/doris-flink-connector/pull/580)
- Добавлена совместимость с чтением типа IP в Doris 2.1.3 и более поздних версиях. [#576](https://github.com/apache/doris-flink-connector/pull/576)
- Добавлены скрипты выпуска. [#567](https://github.com/apache/doris-flink-connector/pull/567)
- Увеличен интервал между повторными попытками в пакетном режиме. [#579](https://github.com/apache/doris-flink-connector/pull/579)
- Добавлено автоматическое создание новых таблиц при синхронизации MongoDB CDC. [#573](https://github.com/apache/doris-flink-connector/pull/573)
- Добавлены примеры использования. [#589](https://github.com/apache/doris-flink-connector/pull/589)

### Исправления ошибок {#bug-fixes-3}

- Исправлена ошибка, из-за которой задача Flink могла зависнуть после аварийного завершения потока Stream Load. [#578](https://github.com/apache/doris-flink-connector/pull/578)
- Исправлены ошибки преобразования типов при синхронизации PostgreSQL CDC. [#582](https://github.com/apache/doris-flink-connector/pull/582)
- Исправлено несоответствие длины схемы для полей ObjectId, отличных от `_id`, при синхронизации MongoDB CDC. [#588](https://github.com/apache/doris-flink-connector/pull/588)

### Благодарности {#thanks-5}

- @Aalron
- @JNSimba
- @kwonder0926
- @vinlee19

## 25.0.0 {#2500}

Источник: [Примечания к выпуску 25.0.0](https://github.com/apache/doris-flink-connector/issues/562)

### Функции и улучшения {#features-and-improvements-5}

- Добавлена поддержка чтения таблиц Catalog через Arrow Flight SQL. [#530](https://github.com/apache/doris-flink-connector/pull/530)
- Добавлена поддержка `INSERT OVERWRITE`. [#544](https://github.com/apache/doris-flink-connector/pull/544)
- Добавлена поддержка частичного проталкивания ограничения LIMIT. [#553](https://github.com/apache/doris-flink-connector/pull/553)
- При проталкивании выполняется объединение значения параметра `doris.filter.query`. [#552](https://github.com/apache/doris-flink-connector/pull/552)
- Для совместимости с изменениями API FE добавлена возможность задавать поля ответа, которые следует игнорировать. [#549](https://github.com/apache/doris-flink-connector/pull/549)
- Оптимизирована логика вычисления `sampleSize` в MongoDB CDC. [#542](https://github.com/apache/doris-flink-connector/pull/542)
- Добавлено игнорирование неудачных изменений схемы MongoDB. [#537](https://github.com/apache/doris-flink-connector/pull/537)
- Добавлены префиксы для поисковых запросов и запросов Arrow Flight. [#531](https://github.com/apache/doris-flink-connector/pull/531) [#530](https://github.com/apache/doris-flink-connector/pull/530)

### Исправления ошибок {#bug-fixes-4}

- Исправлена ошибка, из-за которой в исключительных случаях ошибки записи могли обходить механизм контрольных точек. [#560](https://github.com/apache/doris-flink-connector/pull/560) [#555](https://github.com/apache/doris-flink-connector/pull/555)
- Исправлена ошибка, из-за которой запись могла зависать при возникновении ошибки HTTP. [#539](https://github.com/apache/doris-flink-connector/pull/539)
- Исправлены ошибки разбора временных меток и массивов MongoDB. [#547](https://github.com/apache/doris-flink-connector/pull/547)
- Исправлена ошибка ORA-12733 при синхронизации большого количества таблиц. [#532](https://github.com/apache/doris-flink-connector/pull/532)
- Исправлены ошибки проталкивания формата временных меток. [#528](https://github.com/apache/doris-flink-connector/pull/528)
- Исправлен некорректный разбор SQL-парсером комментариев к таблицам схемы и типов полей. [#540](https://github.com/apache/doris-flink-connector/pull/540)
- Исправлена ошибка, сообщавшая, что заголовок `Transfer-Encoding` уже присутствует. [#525](https://github.com/apache/doris-flink-connector/pull/525)
- Исправлено исключение из-за указателя NULL при синхронизации нескольких баз данных. [#534](https://github.com/apache/doris-flink-connector/pull/534)

### Благодарности {#thanks-6}

- @awol2005ex
- @DongLiang-0
- @JNSimba
- @nativeCat
- @vinlee19
- @xuqinghuang
