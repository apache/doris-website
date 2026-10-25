---
{
    "title": "Выпуск 1.1.3",
    "language": "ru",
    "description": "В этом выпуске команда Doris исправила более 80 проблем и внесла улучшения производительности по сравнению с 1.1.2. Это выпуск с исправлениями ошибок для ветки 1."
}
---

В этом выпуске команда Doris исправила более 80 проблем и внесла улучшения производительности по сравнению с 1.1.2. Это выпуск с исправлениями ошибок для ветки 1.1, и всем пользователям рекомендуется обновиться до этой версии.


# Новые возможности {#features}

- Добавлена поддержка экранирования идентификаторов для sqlserver и postgresql в таблицах ODBC.

- Добавлена возможность использовать Parquet в качестве формата выходных файлов.

# Улучшения {#improvements}

- Оптимизирована политика сброса данных, чтобы избежать создания мелких сегментов. [#12706](https://github.com/apache/doris/pull/12706) [#12716](https://github.com/apache/doris/pull/12716)

- Переработан runtime filter, что сократило время подготовки. [#13127](https://github.com/apache/doris/pull/13127)

- Исправлено множество проблем, связанных с управлением памятью при выполнении запросов и загрузке данных. [#12682](https://github.com/apache/doris/pull/12682) [#12688](https://github.com/apache/doris/pull/12688) [#12708](https://github.com/apache/doris/pull/12708) [#12776](https://github.com/apache/doris/pull/12776) [#12782](https://github.com/apache/doris/pull/12782) [#12791](https://github.com/apache/doris/pull/12791) [#12794](https://github.com/apache/doris/pull/12794) [#12820](https://github.com/apache/doris/pull/12820) [#12932](https://github.com/apache/doris/pull/12932) [#12954](https://github.com/apache/doris/pull/12954) [#12951](https://github.com/apache/doris/pull/12951)

# Исправления ошибок {#bugfix}

- Исправлен core dump при compaction с типом largeint. [#10094](https://github.com/apache/doris/pull/10094)

- Исправлена ошибка, из-за которой grouping sets могли приводить к аварийному завершению процесса или неверным результатам. [#12313](https://github.com/apache/doris/pull/12313)

- Исправлено неверное значение флага PREAGGREGATION в операторе orthogonal_bitmap_union_count. [#12581](https://github.com/apache/doris/pull/12581)

- Level1Iterator теперь освобождает итераторы в куче, что предотвращает возможную утечку памяти. [#12592](https://github.com/apache/doris/pull/12592)

- Исправлен сбой вывода из эксплуатации при наличии 2 BE и существующей colocation table. [#12644](https://github.com/apache/doris/pull/12644)

- Исправлен возможный core dump в BE из-за stack-buffer-overflow при слишком большом TBrokerOpenReaderResponse. [#12658](https://github.com/apache/doris/pull/12658)

- Исправлено возможное исчерпание памяти в BE во время загрузки данных при возникновении ошибки с кодом -238. [#12666](https://github.com/apache/doris/pull/12666)

- Исправлено неверное дочернее выражение функции lead. [#12587](https://github.com/apache/doris/pull/12587)

- Исправлен сбой запроса intersect в коде построчного хранения данных. [#12712](https://github.com/apache/doris/pull/12712)

- Исправлен неверный результат функций curdate()/current_date(). [#12720](https://github.com/apache/doris/pull/12720)

- Исправлена ошибка lateral view explode_split при использовании временной таблицы. [#13643](https://github.com/apache/doris/pull/13643)

- Исправлен неверный план bucket shuffle join при соединении одной и той же таблицы. [#12930](https://github.com/apache/doris/pull/12930)

- Исправлена ошибка, из-за которой версия tablet могла определяться неверно при выполнении alter и загрузке данных. [#13070](https://github.com/apache/doris/pull/13070)

- Исправлено аварийное завершение BE при загрузке данных через broker с использованием md5sum()/sm3sum(). [#13009](https://github.com/apache/doris/pull/13009)

# Примечания по обновлению {#upgrade-notes}

PageCache и ChunkAllocator по умолчанию отключены для снижения потребления памяти. Их можно снова включить, изменив параметры конфигурации `disable_storage_page_cache` и `chunk_reserved_bytes_limit`.

Storage Page Cache кэширует фрагменты пользовательских данных, а Chunk Allocator предварительно выделяет память.

Эти две функции занимают определённую долю памяти и не освобождают её. Эту часть памяти нельзя гибко перераспределять, что в некоторых сценариях может привести к нехватке памяти для других задач и повлиять на стабильность и доступность системы. Поэтому в версии 1.1.3 обе функции по умолчанию отключены.

Однако в некоторых сценариях построения отчётов, чувствительных к задержкам, отключение этих функций может увеличить время выполнения запросов. Если вас беспокоит их влияние на работу после обновления, добавьте следующие параметры в be.conf, чтобы сохранить поведение предыдущей версии.

```
disable_storage_page_cache=false
chunk_reserved_bytes_limit=10%
```

* ``disable_storage_page_cache``: определяет, отключён ли Storage Page Cache. В версии 1.1.2 включительно значение по умолчанию — false, то есть кэш включён. Начиная с версии 1.1.3 значение по умолчанию — true, то есть кэш отключён.
* `chunk_reserved_bytes_limit`: объём памяти, резервируемой Chunk Allocator. В версии 1.1.2 и более ранних версиях значение по умолчанию составляет 10% общего объёма памяти. В версии 1.1.3 значение по умолчанию — 209715200 (200MB).
