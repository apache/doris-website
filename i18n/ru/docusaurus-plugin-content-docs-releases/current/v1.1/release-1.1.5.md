---
{
    "title": "Выпуск 1.1.5",
    "language": "ru",
    "description": "После выпуска 1.1.4 команда Doris внесла около 36 исправлений ошибок и улучшений производительности. Этот выпуск содержит исправления ошибок для ветки 1."
}
---

После выпуска 1.1.4 команда Doris внесла около 36 исправлений ошибок и улучшений производительности. Этот выпуск содержит исправления ошибок для ветки 1.1, поэтому всем пользователям рекомендуется обновиться до этой версии.

# Изменения в поведении {#behavior-changes}

Раньше, если псевдоним совпадал с именем исходного столбца, как в выражении "select year(birthday) as birthday", и использовался в предложении group by, order by или having, поведение Doris отличалось от MySQL. В этом выпуске поведение приведено в соответствие с MySQL: в group by и having приоритет имеет исходный столбец, а в order by — псевдоним. Это может вызывать путаницу, поэтому лучше не давать псевдониму то же имя, что и исходному столбцу.

# Новые возможности {#features}

Добавлена поддержка murmur_hash3_64. [#14636](https://github.com/apache/doris/pull/14636)

# Улучшения {#improvements}

Для convert_tz добавлен кеш часовых поясов, повышающий производительность. [#14616](https://github.com/apache/doris/pull/14616)

Результат команды show теперь сортируется по имени таблицы. [#14492](https://github.com/apache/doris/pull/14492)

# Исправления ошибок {#bug-fix}

Исправлен аварийный сбой с созданием дампа памяти при наличии константного выражения if в предложении select.  [#14858](https://github.com/apache/doris/pull/14858)

Исправлен возможный сбой в ColumnVector::insert_date_column. [#14839](https://github.com/apache/doris/pull/14839)

Значение high_priority_flush_thread_num_per_store по умолчанию изменено на 6, что повышает производительность загрузки данных. [#14775](https://github.com/apache/doris/pull/14775)

Исправлен аварийный сбой при быстрой компакции.  [#14731](https://github.com/apache/doris/pull/14731)

Исправлена ошибка IndexOutOfBounds, возникавшая при spark load, если столбец партиционирования не являлся duplicate key. [#14661](https://github.com/apache/doris/pull/14661)

Устранена утечка памяти в VCollectorIterator. [#14549](https://github.com/apache/doris/pull/14549)

Исправлена работа create table like при наличии столбца sequence. [#14511](https://github.com/apache/doris/pull/14511)

Для расчёта размера пакета вместо total_bytes используется средний размер rowset, поскольку расчёт через total_bytes требует значительных ресурсов CPU. [#14273](https://github.com/apache/doris/pull/14273)

Исправлен аварийный сбой при right outer join с конъюнктивным условием. [#14821](https://github.com/apache/doris/pull/14821)

Оптимизирована политика сборки мусора gc в tcmalloc.  [#14777](https://github.com/apache/doris/pull/14777) [#14738](https://github.com/apache/doris/pull/14738) [#14374](https://github.com/apache/doris/pull/14374)
