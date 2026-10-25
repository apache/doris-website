---
{
    "title": "Doris Kafka Connector",
    "language": "ru",
    "description": "Примечания к выпускам Doris Kafka Connector."
}
---

# Doris Kafka Connector {#doris-kafka-connector}

В этом документе перечислены выпуски Doris Kafka Connector в обратном хронологическом порядке.

## 26.1.0 {#2610}

Источник: [Примечания к выпуску 26.1.0](https://github.com/apache/doris-kafka-connector/issues/102)

### Возможности и улучшения {#features-and-improvements}

- Добавлено кэширование доступных BE, чтобы не выполнять HTTP-проверку перед каждой загрузкой. [#99](https://github.com/apache/doris-kafka-connector/pull/99)
- Добавлена поддержка односторонних TLS-соединений с Doris. [#100](https://github.com/apache/doris-kafka-connector/pull/100)
- Добавлена поддержка режима приёмника S3 TVF для объединённой записи с гарантией доставки «как минимум один раз». [#101](https://github.com/apache/doris-kafka-connector/pull/101)

### Благодарности {#thanks}

- @diggle1
- @JNSimba

## 26.0.0 {#2600}

Источник: [Примечания к выпуску 26.0.0](https://github.com/apache/doris-kafka-connector/issues/98)

### Возможности и улучшения {#features-and-improvements-1}

- Для Stream Load по умолчанию включено сжатие gzip. [#95](https://github.com/apache/doris-kafka-connector/pull/95)
- Исправлены резкие увеличения числа JDBC-соединений, вызванные неправильным повторным использованием соединений при изменении схемы. [#94](https://github.com/apache/doris-kafka-connector/pull/94)
- Добавлены скрипты сборки для Confluent. [#86](https://github.com/apache/doris-kafka-connector/pull/86)
- Обновлена конфигурация `ConfigDef`. [#85](https://github.com/apache/doris-kafka-connector/pull/85)

### Исправления ошибок {#bug-fixes}

- Исправлена проверка конфигурации `topic2table`. [#83](https://github.com/apache/doris-kafka-connector/pull/83)
- Исправлена ссылка на документацию сайта в README. [#84](https://github.com/apache/doris-kafka-connector/pull/84)

### Благодарности {#thanks-1}

- @JNSimba
- @rnb-tron

## 25.0.0 {#2500}

Источник: [Примечания к выпуску 25.0.0](https://github.com/apache/doris-kafka-connector/issues/81)

### Возможности и улучшения {#features-and-improvements-2}

- Добавлена поддержка асинхронного сброса в режиме combine flush. [#74](https://github.com/apache/doris-kafka-connector/pull/74)
- Обновлены значения конфигурации по умолчанию и добавлен режим combine flush. [#73](https://github.com/apache/doris-kafka-connector/pull/73)
- Уровень журналирования изменён на debug. [#75](https://github.com/apache/doris-kafka-connector/pull/75)
- Добавлены сквозные тесты для нескольких цепочек преобразований. [#72](https://github.com/apache/doris-kafka-connector/pull/72)
- Добавлена обработка значений null. [#69](https://github.com/apache/doris-kafka-connector/pull/69)
- Добавлены проверки SMT, изменяющих темы. [#68](https://github.com/apache/doris-kafka-connector/pull/68)
- Добавлена стратегия повторных попыток. [#67](https://github.com/apache/doris-kafka-connector/pull/67)
- Добавлены тестовые сценарии для обновления и удаления в Debezium, а также для преобразования Avro. [#65](https://github.com/apache/doris-kafka-connector/pull/65)
- Добавлены сквозные тестовые сценарии для преобразований Kafka Connect. [#64](https://github.com/apache/doris-kafka-connector/pull/64)
- Оптимизирован код, в том числе запросы состояния транзакций по меткам. [#62](https://github.com/apache/doris-kafka-connector/pull/62)
- В сообщения об ошибках изменения схемы добавлены имена таблиц. [#61](https://github.com/apache/doris-kafka-connector/pull/61)
- Добавлены скрипты выпуска. [#80](https://github.com/apache/doris-kafka-connector/pull/80)

### Исправления ошибок {#bug-fixes-1}

- Исправлен разбор десятичных чисел. [#70](https://github.com/apache/doris-kafka-connector/pull/70)
- Исправлено обновление `processedOffset` при повторных попытках загрузки. [#79](https://github.com/apache/doris-kafka-connector/pull/79)
- В необходимых случаях ответы API схемы теперь игнорируются. [#77](https://github.com/apache/doris-kafka-connector/pull/77)

### Благодарности {#thanks-2}

- @chuang-wang-pre
- @DongLiang-0
- @JNSimba
- @vinlee19
