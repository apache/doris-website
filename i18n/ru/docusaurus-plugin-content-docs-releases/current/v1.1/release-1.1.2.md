---
{
    "title": "Выпуск 1.1.2",
    "language": "ru",
    "description": "В этом выпуске команда Doris исправила более 170 проблем и внесла улучшения производительности по сравнению с 1.1.1. Этот выпуск содержит исправления ошибок для ветки 1."
}
---

В этом выпуске команда Doris исправила более 170 проблем и внесла улучшения производительности по сравнению с 1.1.1. Выпуск содержит исправления ошибок для ветки 1.1, поэтому всем пользователям рекомендуется обновиться.

# Новые возможности {#features}

### Новый MemTracker {#new-memtracker}

Для векторизованного и невекторизованного движков представлен новый MemTracker, который точнее отслеживает использование памяти.

### API для просмотра текущих запросов и их принудительного завершения {#add-api-for-showing-current-queries-and-kill-query}

### Поддержка чтения и записи эмодзи в UTF-16 через ODBC Table {#support-readwrite-emoji-of-utf16-via-odbc-table}

# Улучшения {#improvements}

### Улучшения для Data Lake {#data-lake-related-improvements}

- Производительность сканирования файлов ORC в HDFS повышена примерно на 300%. [#11501](https://github.com/apache/doris/pull/11501)

- Добавлена поддержка режима HA для HDFS при запросах к таблицам Iceberg.

- Добавлена поддержка запросов к данным Hive, созданным с помощью [Apache Tez](https://tez.apache.org/)

- Добавлена поддержка Ali OSS для внешних таблиц Hive.

### Поддержка типов string и text в Spark Load {#add-support-for-string-and-text-type-in-spark-load}


### Повторное использование блоков в невекторизованном движке повышает производительность в некоторых случаях на 50%. [#11392](https://github.com/apache/doris/pull/11392) {#add-reuse-block-in-non-vectorized-engine-and-have-50-performance-improvement-in-some-cases-11392}

### Повышена производительность LIKE и регулярных выражений {#improve-like-or-regex-performance}

### Отключён aggressive_memory_decommit в tcmalloc {#disable-tcmallocs-aggressive_memory_decommit}

Это повышает производительность загрузки данных и выполнения запросов на 40%.

Сейчас этим поведением можно управлять с помощью параметра `tc_enable_aggressive_memory_decommit`.

# Исправления ошибок {#bug-fix}

### Ошибки FE, которые могли привести к сбою FE или повреждению данных {#some-issues-about-fe-that-will-cause-fe-failure-or-data-corrupt}

- Добавлен параметр настройки дискового резерва, предотвращающий накопление слишком большого количества резервных файлов BDB-JE. **(Критично)** В среде HA BDB-JE может накапливать множество таких файлов. Файлы журнала BDB-JE не удаляются, пока использование диска не приблизится к установленному пределу.

- Исправлена критическая ошибка BDB-JE, из-за которой реплика FE могла не запуститься должным образом или данные могли быть повреждены. **(Критично)**

### FE мог зависать в waitFor_rpc при выполнении запроса, а BE — при высокой степени параллелизма {#fe-will-hang-on-waitfor_rpc-during-query-and-be-will-hang-in-high-concurrent-scenarios}

[#12459](https://github.com/apache/doris/pull/12459) [#12458](https://github.com/apache/doris/pull/12458) [#12392](https://github.com/apache/doris/pull/12392)

### Критическая ошибка векторизованного движка хранения, приводившая к неверным результатам. **(Критично)** {#a-fatal-issue-in-vectorized-storage-engine-which-will-cause-wrong-result-serious}

[#11754](https://github.com/apache/doris/pull/11754) [#11694](https://github.com/apache/doris/pull/11694)

### Многочисленные ошибки планировщика, из-за которых BE аварийно завершался или переходил в некорректное состояние {#lots-of-planner-related-issues-that-will-cause-be-core-or-in-abnormal-state}

[#12080](https://github.com/apache/doris/pull/12080) [#12075](https://github.com/apache/doris/pull/12075) [#12040](https://github.com/apache/doris/pull/12040) [#12003](https://github.com/apache/doris/pull/12003) [#12007](https://github.com/apache/doris/pull/12007) [#11971](https://github.com/apache/doris/pull/11971) [#11933](https://github.com/apache/doris/pull/11933) [#11861](https://github.com/apache/doris/pull/11861) [#11859](https://github.com/apache/doris/pull/11859) [#11855](https://github.com/apache/doris/pull/11855) [#11837](https://github.com/apache/doris/pull/11837) [#11834](https://github.com/apache/doris/pull/11834) [#11821](https://github.com/apache/doris/pull/11821) [#11782](https://github.com/apache/doris/pull/11782) [#11723](https://github.com/apache/doris/pull/11723) [#11569](https://github.com/apache/doris/pull/11569)
