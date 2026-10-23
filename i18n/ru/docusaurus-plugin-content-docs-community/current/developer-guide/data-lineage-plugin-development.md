---
title: Разработка плагина для отслеживания происхождения данных
language: ru
description: Создание, упаковка, развёртывание и проверка плагина Apache Doris для отслеживания происхождения данных, который записывает события происхождения данных в журнал или передаёт их во внешнюю систему управления данными.
keywords:
    - Apache Doris
    - происхождение данных
    - LineagePlugin
    - LineagePluginFactory
    - ServiceLoader
    - разработка плагинов
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Extension development -->
<!-- Applicable scenario: Data governance integration / Kernel extension development -->

В этом документе описано, как разработать внешний плагин для отслеживания происхождения данных в Apache Doris. После успешного выполнения поддерживаемого оператора DML плагин получает событие `LineageInfo`, преобразует его и записывает в журнал, систему обмена сообщениями или на внешнюю платформу управления метаданными.

> Применимая версия: Apache Doris редакции сообщества 4.0.6 и новее. Компилируйте плагин для той же версии сообщества Doris или той же ревизии исходного кода, которая развёрнута на FE.

## Область применения и жизненный цикл {#scope-and-lifecycle}

Фреймворк отслеживания происхождения данных представляет собой SPI на стороне FE. Он не хранит сведения о происхождении данных, не предоставляет API для запросов и не отображает граф происхождения данных. Плагин преобразует Java-объекты из `LineageInfo`, находящиеся в памяти, в формат и транспортный протокол, которые требуются принимающей системе.

Текущая реализация создаёт события только для успешно выполненных операторов `INSERT INTO ... SELECT`, `INSERT OVERWRITE TABLE ... SELECT` и `CREATE TABLE AS SELECT`. Операции записи только с `VALUES` и операции, целевой объект которых находится в `__internal_schema`, пропускаются. `SELECT`, `UPDATE`, `DELETE` и задания загрузки не входят в область применения этого фреймворка. Некоторые пути выполнения `UPDATE` и `DELETE` внутри системы повторно используют команду Insert, но проверка исходного типа команды исключает их из отправки событий происхождения данных.

![Архитектура сбора сведений о происхождении данных: успешно выполненные поддерживаемые операторы DML анализируются Nereids, преобразуются в LineageInfo, помещаются в очередь FE и передаются плагином во внешнюю систему управления данными.](/images/data-lineage/lineage-architecture.svg)

`eventFilter()` вызывается один раз перед извлечением сведений о происхождении данных в ходе обработки запроса DML и ещё раз перед отправкой события рабочим потоком. Возвращайте `false`, если плагин не должен получать события. Метод вызывается параллельно из потоков запросов и рабочего потока, поэтому он должен быть потокобезопасным. `exec()` вызывается одним рабочим потоком, но может выполняться одновременно с `eventFilter()`.

При запуске FE механизм ServiceLoader сначала обнаруживает все реализации `LineagePluginFactory`. Затем FE вызывает метод фабрики `create(context)` и вызывает `initialize(context)` у возвращённого плагина. Реализация `LineagePluginFactory.create(context)` по умолчанию делегирует вызов методу `create()` без аргументов, поэтому в минимальном примере из этого руководства реализован только `create()`. `PluginContext` предоставляет неизменяемую карту свойств через `getProperties()`; FE сохраняет имя и каталог плагина в записях `plugin.name` и `plugin.path`. Доступ к ним осуществляется через `context.getProperties().get("plugin.name")` и `context.getProperties().get("plugin.path")`. Плагин для промышленной эксплуатации, который читает файл конфигурации из своего каталога, может переопределить `initialize(context)`, найти файл с помощью записи `plugin.path` и инициализировать в этом методе свои ресурсы.

## Модель событий происхождения данных {#lineage-event-model}

`LineageInfo` содержит целевую таблицу, целевые выходные столбцы, исходные таблицы, прямые зависимости, косвенные зависимости и `LineageContext`.

| Часть | Значение |
| --- | --- |
| Целевой объект | Целевая таблица и выходные столбцы операции записи. |
| Исходные таблицы | Таблицы, на которые ссылается проанализированный логический план. |
| Прямые зависимости | Карта соответствий каждого выходного Slot исходным выражениям с классификацией `IDENTITY`, `TRANSFORMATION` или `AGGREGATION`. |
| Косвенные зависимости набора данных | Выражения, влияющие на весь результирующий набор: `JOIN`, `FILTER`, `GROUP_BY` и `SORT`. |
| Косвенные зависимости выходных столбцов | Зависимости, влияющие на конкретный выходной столбец: `WINDOW` и `CONDITIONAL`. |
| Контекст запроса | Идентификатор запроса, текст SQL, пользователь, IP-адрес клиента, база данных и Catalog сеанса, состояние выполнения, временная метка, длительность и очищенные от конфиденциальных данных свойства внешних Catalog. |

Прямые зависимости описывают, как формируется выходное значение. Простая ссылка на исходный столбец относится к `IDENTITY`, например `target.customer_id <- source.customer_id`. Вычисление, функция, оконное или условное выражение без агрегатной функции относится к `TRANSFORMATION`, например `UPPER(source.region)`. Выражение, содержащее агрегатную функцию, относится к `AGGREGATION`, например `SUM(source.amount)`. Косвенные зависимости фиксируют выражения, которые влияют на результат, но сами не становятся выходным значением. К ним относятся ключи Join, предикаты `WHERE` и `HAVING`, ключи группировки и сортировки. `WINDOW` фиксирует входные данные для разбиения на оконные секции и упорядочивания в них. `CONDITIONAL` фиксирует влияние `CASE`, `IF` или `COALESCE` на конкретный выходной столбец.

### Пример модели событий происхождения данных {#lineage-event-model-example}

В следующем примере используются одна исходная и одна целевая таблица, чтобы показать все три типа прямых зависимостей, косвенные зависимости набора данных и косвенные зависимости выходных столбцов. Текущему пользователю необходимы права на создание базы данных и таблиц, запись данных и выполнение запросов к данным.

```sql
CREATE DATABASE IF NOT EXISTS lineage_demo;
USE lineage_demo;

CREATE TABLE lineage_source (
    region VARCHAR(32),
    amount DECIMAL(18, 2),
    status VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_target (
    region VARCHAR(32),
    total_amount DECIMAL(18, 2),
    region_seq BIGINT,
    region_group VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO lineage_source VALUES
    ('east', 100.00, 'PAID'),
    ('east', 30.00, 'CANCELLED'),
    ('west', 80.00, 'PAID');

INSERT INTO lineage_target
SELECT
    region,
    SUM(amount) AS total_amount,
    ROW_NUMBER() OVER (ORDER BY region) AS region_seq,
    CASE
        WHEN region = 'east' THEN 'CORE'
        ELSE 'OTHER'
    END AS region_group
FROM lineage_source
WHERE status = 'PAID'
GROUP BY region
ORDER BY SUM(amount) DESC;

SELECT region, total_amount, region_seq, region_group
FROM lineage_target
ORDER BY region;
```

Запрос возвращает:

```text
+--------+--------------+------------+--------------+
| region | total_amount | region_seq | region_group |
+--------+--------------+------------+--------------+
| east   |       100.00 |          1 | CORE         |
| west   |        80.00 |          2 | OTHER        |
+--------+--------------+------------+--------------+
```

Первая команда Insert, использующая только `VALUES`, не создаёт событие. После успешного выполнения `INSERT INTO lineage_target ... SELECT` событие содержит следующие основные связи:

| Уровень происхождения данных | Содержимое в этом примере |
| --- | --- |
| Происхождение данных на уровне таблиц | `internal.lineage_demo.lineage_source` -> `internal.lineage_demo.lineage_target`. |
| Прямые зависимости столбцов | `region` относится к `IDENTITY`; `total_amount` относится к `AGGREGATION`; `region_seq` и `region_group` относятся к `TRANSFORMATION`. |
| Косвенные зависимости набора данных | `FILTER` содержит `status = 'PAID'`; `GROUP_BY` содержит `region`; `SORT` содержит `SUM(amount) DESC`. |
| Косвенные зависимости выходных столбцов | Зависимость `WINDOW` для `region_seq` содержит `region`; зависимость `CONDITIONAL` для `region_group` содержит `region = 'east'`. |
| Контекст запроса | Содержит фактический идентификатор запроса, приведённый выше SQL команды Insert, пользователя, выполняющего команду, и IP-адрес клиента. База данных сеанса: `lineage_demo`, внутренний Catalog: `internal`, состояние выполнения: `OK`. |

В этом примере нет Join, поэтому отсутствует зависимость `JOIN` на уровне набора данных. В запросе с Join условие соединения записывается как зависимость `JOIN` на уровне набора данных.

Прежде чем событие поступит в плагин, экстрактор разрешает выражения, формирующие CTE, и раскрывает ветви `UNION`. При этом плагину следует рассматривать `Expression`, `SlotReference` и `TableIf` как внутренние Java-объекты Doris и перед отправкой за пределы FE преобразовывать их в стабильные имена или в схему принимающей системы.

## Справочник API плагина {#plugin-api-reference}

SPI для отслеживания происхождения данных состоит из фабрики, обнаруживаемой при запуске FE, экземпляра плагина, создаваемого этой фабрикой, неизменяемого контекста выполнения и события `LineageInfo`, передаваемого плагину. Ниже перечислены методы расширения, которые непосредственно используются в реализациях плагинов.

### Обзор API {#api-summary}

| Метод | Входные данные | Тип возвращаемого значения | Назначение |
| --- | --- | --- | --- |
| `LineagePluginFactory.name()` | Нет | `String` | Вернуть уникальное имя фабрики, используемое в `activate_lineage_plugin`. |
| `LineagePluginFactory.create()` | Нет | `LineagePlugin` | Создать экземпляр плагина без чтения контекста выполнения в фабрике. |
| `LineagePluginFactory.create(PluginContext)` | `PluginContext` | `LineagePlugin` | Создать экземпляр плагина с доступом к контексту выполнения. Реализация по умолчанию делегирует вызов методу `create()`. |
| `LineagePlugin.name()` | Нет | `String` | Вернуть имя плагина. Оно должно совпадать с именем фабрики. |
| `LineagePlugin.eventFilter()` | Нет | `boolean` | Указать, хочет ли плагин в данный момент получать события происхождения данных. |
| `LineagePlugin.exec(LineageInfo)` | `LineageInfo` | `boolean` | Обработать одно событие происхождения данных. |
| `Plugin.initialize(PluginContext)` | `PluginContext` | `void` | Инициализировать ресурсы после создания плагина фабрикой. Реализация по умолчанию ничего не делает. |
| `Plugin.close()` | Нет | `void` | Метод жизненного цикла, предназначенный для освобождения ресурсов плагина. Реализация по умолчанию ничего не делает. |
| `PluginContext.getProperties()` | Нет | `Map<String, String>` | Вернуть неизменяемую карту свойств контекста выполнения. |

### `LineagePluginFactory` {#lineagepluginfactory}

`LineagePluginFactory` служит точкой входа для ServiceLoader. FE обнаруживает фабрику, фильтрует её по значению, возвращаемому `name()`, а затем создаёт один экземпляр плагина.

```java
String name();
LineagePlugin create();
default LineagePlugin create(PluginContext context);
```

#### `name()` {#name}

- **Входные данные:** нет.
- **Возвращает:** `String`, уникальный идентификатор фабрики с учётом регистра.
- **Поведение:** значение сопоставляется с каждым элементом в `activate_lineage_plugin`. В примере возвращается `example-lineage`.

#### `create()` {#create}

- **Входные данные:** нет.
- **Возвращает:** новый экземпляр `LineagePlugin`.
- **Поведение:** реализуйте этот метод, если для создания плагина не требуется контекст выполнения. Метод `create(PluginContext)` по умолчанию делегирует ему вызов.

#### `create(PluginContext context)` {#createplugincontext-context}

- **Входные данные:** `PluginContext context`, неизменяемый контекст выполнения, подготовленный для этого каталога плагина.
- **Возвращает:** новый экземпляр `LineagePlugin`.
- **Поведение:** переопределяйте этот метод только в том случае, если самой фабрике нужны свойства контекста выполнения при создании плагина. После создания FE вызывает `initialize(context)` у возвращённого плагина.

Возврат `null` или исключение при создании не позволяют загрузить этот плагин. Не выполняйте длительные обращения к принимающей системе в методе фабрики, поскольку обнаружение плагинов происходит при запуске FE.

### `LineagePlugin` {#lineageplugin}

`LineagePlugin` получает события происхождения данных и наследует методы жизненного цикла `initialize()` и `close()` от `Plugin`.

```java
String name();
boolean eventFilter();
boolean exec(LineageInfo lineageInfo);
default void initialize(PluginContext context);
default void close();
```

#### `name()` {#name-1}

- **Входные данные:** нет.
- **Возвращает:** `String`, идентификатор плагина.
- **Поведение:** возвращайте тот же стабильный идентификатор, что и `LineagePluginFactory.name()`, чтобы для активации, журналов и эксплуатационной конфигурации использовалось одно имя.

#### `eventFilter()` {#eventfilter}

- **Входные данные:** нет.
- **Возвращает:** `boolean`; `true` означает, что плагин хочет получать события происхождения данных, а `false` означает, что FE пропускает его.
- **Поведение:** FE вызывает этот метод перед извлечением сведений о происхождении данных в потоках запросов и повторно перед отправкой события в рабочем потоке обработки происхождения данных. Метод должен быть потокобезопасным и быстро возвращать результат. Если перед извлечением все загруженные плагины возвращают `false`, FE пропускает извлечение для этого оператора.

#### `exec(LineageInfo lineageInfo)` {#execlineageinfo-lineageinfo}

- **Входные данные:** `LineageInfo lineageInfo`, одно извлечённое событие происхождения данных от успешно выполненного поддерживаемого оператора DML.
- **Возвращает:** `boolean`; `true` сообщает вызывающему коду об успехе, а `false` сообщает об ошибке.
- **Поведение:** один рабочий поток обработки происхождения данных вызывает `exec()`, однако этот метод может выполняться параллельно с вызовами `eventFilter()` в потоках запросов. Когда `exec()` возвращает `false`, текущий фреймворк не повторяет попытку, не возвращает событие в очередь и не изменяет состояние DML. Исключение записывается в журнал, после чего обработка продолжается для следующих плагинов или событий.

#### `initialize(PluginContext context)` {#initializeplugincontext-context}

- **Входные данные:** `PluginContext context`, тот же контекст выполнения, который был передан фабрике.
- **Возвращает:** `void`.
- **Поведение:** FE вызывает этот метод после создания плагина. Переопределите его, чтобы читать конфигурацию из `plugin.path`, создавать клиенты или выделять другие ресурсы. Исключение не позволяет загрузить плагин.

#### `close()` {#close}

- **Входные данные:** нет.
- **Возвращает:** `void`.
- **Поведение:** этот унаследованный метод жизненного цикла предназначен для освобождения ресурсов. Текущий процессор происхождения данных не поддерживает динамическую выгрузку или перезагрузку, поэтому плагин не должен рассчитывать на вызов `close()` при замене JAR. Для замены JAR по-прежнему требуется перезапуск FE.

### `PluginContext` {#plugincontext}

```java
Map<String, String> getProperties();
```

`getProperties()` не принимает входных данных и возвращает неизменяемую `Map<String, String>`. Загрузчик плагинов происхождения данных предоставляет следующие записи:

| Свойство | Тип | Значение |
| --- | --- | --- |
| `plugin.name` | `String` | Имя, возвращаемое обнаруженной фабрикой. |
| `plugin.path` | `String` | Абсолютный путь к каталогу внешнего плагина. |

Читайте их с помощью `context.getProperties().get("plugin.name")` и `context.getProperties().get("plugin.path")`. Карту нельзя изменять. Плагин может использовать `plugin.path` для поиска собственных файлов конфигурации, но не должен предполагать, что имя каталога совпадает с именем фабрики.

### `LineageInfo` {#lineageinfo}

`LineageInfo` является типом входных данных для `exec()`. Плагины должны читать его через следующие методы и преобразовывать объекты Doris в схему событий принимающей системы.

| Метод | Тип возвращаемого значения | Значение |
| --- | --- | --- |
| `getTargetTable()` | `TableIf` | Целевая таблица операции записи. |
| `getTargetColumns()` | `List<Slot>` | Целевые выходные столбцы в порядке записи. |
| `getTableLineageSet()` | `Set<TableIf>` | Исходные таблицы, на которые ссылается проанализированный план. |
| `getDirectLineageMap()` | `Map<SlotReference, SetMultimap<DirectLineageType, Expression>>` | Прямые исходные выражения для каждого выходного Slot. |
| `getDatasetIndirectLineageMap()` | `Multimap<IndirectLineageType, Expression>` | Зависимости `JOIN`, `FILTER`, `GROUP_BY` и `SORT` на уровне набора данных. |
| `getInDirectLineageMapByDataset()` | `Map<SlotReference, SetMultimap<IndirectLineageType, Expression>>` | Производное представление, применяющее зависимости уровня набора данных к каждому выходному Slot. Не включает `WINDOW` и `CONDITIONAL`. |
| `getOutputIndirectLineageMap()` | `Map<SlotReference, SetMultimap<IndirectLineageType, Expression>>` | Зависимости `WINDOW` и `CONDITIONAL` для каждого выходного столбца. |
| `getContext()` | `LineageContext` | Метаданные запроса и выполнения для этого события. |

`LineageInfo` также предоставляет сеттеры и методы `add*`, которые использует экстрактор FE. Обычно плагин-приёмник читает объект через перечисленные выше геттеры и не должен изменять событие. Возвращаемые значения `TableIf`, `Slot`, `SlotReference` и `Expression` представляют собой объекты среды выполнения Doris, а не стабильные идентификаторы формата передачи данных.

### `LineageContext` {#lineagecontext}

`LineageContext` возвращается методом `LineageInfo.getContext()`. Его геттеры не принимают входных данных.

| Метод | Тип возвращаемого значения | Значение |
| --- | --- | --- |
| `getSourceCommand()` | `Class<? extends Command>` | Класс команды, создавшей событие, например `InsertIntoTableCommand`. |
| `getQueryId()` | `String` | Идентификатор запроса. |
| `getQueryText()` | `String` | Исходный текст DML. |
| `getUser()` | `String` | Пользователь, выполняющий команду. |
| `getClientIp()` | `String` | IP-адрес клиента. |
| `getState()` | `String` | Состояние выполнения запроса. |
| `getDatabase()` | `String` | База данных сеанса; она не обязательно совпадает с базой данных целевой таблицы. |
| `getCatalog()` | `String` | Catalog сеанса; он не обязательно совпадает с Catalog целевой таблицы. |
| `getTimestampMs()` | `long` | Временная метка события в миллисекундах или `-1`, если она недоступна. |
| `getDurationMs()` | `long` | Длительность запроса в миллисекундах или `-1`, если она недоступна. |
| `getExternalCatalogProperties()` | `Map<String, Map<String, String>>` | Очищенные от конфиденциальных данных свойства внешних Catalog, на которые ссылается запрос. |

Исходный SQL, пользователь, IP-адрес клиента, выражения и свойства внешних Catalog могут содержать конфиденциальные данные. Перед их экспортом плагин для промышленной эксплуатации должен применять собственные правила контроля доступа, маскирования, ограничения размера и срока хранения.

## Разработка плагина {#develop-a-plugin}

В этом разделе используется публичный тег `4.0.6` из официального репозитория сообщества `github.com/apache/doris`, а в дерево исходного кода добавляется подмодуль Maven `example-lineage`. Плагин записывает каждое событие только в журнал FE. Он не запускает HTTP-сервис и не зависит от внешней платформы управления данными. Эта реализация демонстрирует полный процесс разработки и загрузки плагина. Плагин для промышленной эксплуатации может преобразовывать `LineageInfo` в стороннюю схему, вызывать API платформы метаданных, например OpenMetadata, или отправлять события происхождения данных, соответствующие спецификации OpenLineage. Все приведённые ниже пути к исходным файлам указаны относительно одного и того же корневого каталога исходного кода Doris.

### Шаг 1: Подготовка исходного кода Doris {#step-1-prepare-the-doris-source}

Переключитесь на публичный релиз, который точно соответствует целевому FE, и сохраните корневой каталог исходного кода в `DORIS_SOURCE`:

```shell
git clone https://github.com/apache/doris.git
export DORIS_SOURCE="$(pwd)/doris"
cd "${DORIS_SOURCE}"
git checkout 4.0.6
```

Все последующие пути `$DORIS_SOURCE/fe_plugins/...` относятся к этому каталогу исходного кода. Не заменяйте его каталогом установки FE и не компилируйте плагин с использованием JAR-файлов FE другой версии.

### Шаг 2: Создание модулей Maven {#step-2-create-the-maven-modules}

Выполните следующие команды из корневого каталога исходного кода Doris:

```shell
cd "${DORIS_SOURCE}"
mkdir -p fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example
mkdir -p fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services
```

После выполнения этого раздела новые файлы будут расположены следующим образом:

```text
$DORIS_SOURCE/
└── fe_plugins/
    ├── pom.xml                                      # Existing file; add the lineage module
    └── lineage/
        ├── pom.xml
        └── example-lineage/
            ├── pom.xml
            └── src/main/
                ├── java/org/apache/doris/plugin/lineage/example/
                │   ├── ExampleLineagePluginFactory.java
                │   └── LoggingLineagePlugin.java
                └── resources/META-INF/services/
                    └── org.apache.doris.nereids.lineage.LineagePluginFactory
```

Отредактируйте существующий файл `$DORIS_SOURCE/fe_plugins/pom.xml` и добавьте `lineage` в его `<modules>`. Сохраните все существующие модули; не заменяйте весь файл этим фрагментом:

```xml
<modules>
    <!-- Keep the modules already present in fe_plugins/pom.xml -->
    <module>lineage</module>
</modules>
```

Создайте `$DORIS_SOURCE/fe_plugins/lineage/pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>fe-plugins</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>lineage</artifactId>
    <packaging>pom</packaging>
    <modules>
        <module>example-lineage</module>
    </modules>
</project>
```

Создайте `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>lineage</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>example-lineage</artifactId>
    <packaging>jar</packaging>
    <dependencies>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-core</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-extension-spi</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <build>
        <finalName>example-lineage</finalName>
    </build>
</project>
```

Для всех зависимостей используется `provided`, поскольку эти API предоставляет FE. Не включайте классы Doris или Log4j в JAR плагина.

### Шаг 3: Реализация фабрики {#step-3-implement-the-factory}

Создайте `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/ExampleLineagePluginFactory.java`:

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.doris.nereids.lineage.LineagePluginFactory;

/** Factory discovered by ServiceLoader at FE startup. */
public class ExampleLineagePluginFactory implements LineagePluginFactory {
    @Override
    public String name() {
        return "example-lineage";
    }

    @Override
    public LineagePlugin create() {
        return new LoggingLineagePlugin();
    }
}
```

Значение `example-lineage`, возвращаемое `name()`, является уникальным идентификатором плагина. В настройке `activate_lineage_plugin`, приведённой далее, должно использоваться точно такое же значение.

### Шаг 4: Реализация плагина записи в журнал {#step-4-implement-the-logging-plugin}

Создайте `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/LoggingLineagePlugin.java`:

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.catalog.TableIf;
import org.apache.doris.nereids.lineage.LineageContext;
import org.apache.doris.nereids.lineage.LineageInfo;
import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Objects;
import java.util.stream.Collectors;

/** Minimal lineage plugin that writes one summary line for each event. */
public class LoggingLineagePlugin implements LineagePlugin {
    private static final Logger LOG = LogManager.getLogger(LoggingLineagePlugin.class);
    private static final String PLUGIN_NAME = "example-lineage";

    @Override
    public String name() {
        return PLUGIN_NAME;
    }

    @Override
    public boolean eventFilter() {
        return true;
    }

    @Override
    public boolean exec(LineageInfo lineageInfo) {
        if (lineageInfo == null) {
            return false;
        }

        LineageContext context = lineageInfo.getContext();
        LOG.info("LINEAGE_EVENT queryId={} command={} user={} clientIp={} "
                        + "catalog={} database={} state={} durationMs={} target={} sources={} "
                        + "direct={} datasetIndirect={} outputIndirect={}",
                value(context == null ? null : context.getQueryId()),
                command(context),
                value(context == null ? null : context.getUser()),
                value(context == null ? null : context.getClientIp()),
                value(context == null ? null : context.getCatalog()),
                value(context == null ? null : context.getDatabase()),
                value(context == null ? null : context.getState()),
                context == null ? -1L : context.getDurationMs(),
                tableName(lineageInfo.getTargetTable()),
                sourceTables(lineageInfo),
                lineageInfo.getDirectLineageMap(),
                lineageInfo.getDatasetIndirectLineageMap(),
                lineageInfo.getOutputIndirectLineageMap());
        return true;
    }

    private String sourceTables(LineageInfo lineageInfo) {
        if (lineageInfo.getTableLineageSet() == null) {
            return "[]";
        }
        return lineageInfo.getTableLineageSet().stream()
                .filter(Objects::nonNull)
                .map(TableIf::getNameWithFullQualifiers)
                .sorted()
                .collect(Collectors.joining(",", "[", "]"));
    }

    private String tableName(TableIf table) {
        return table == null ? "" : table.getNameWithFullQualifiers();
    }

    private String command(LineageContext context) {
        return context == null || context.getSourceCommand() == null
                ? "" : context.getSourceCommand().getSimpleName();
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
```

В этом примере в журнал не записываются исходный SQL, свойства внешних Catalog и сведения для аутентификации. Выражения прямых и косвенных зависимостей всё же могут содержать литералы SQL, поэтому используйте эту реализацию только для проверки в процессе разработки. Плагин для промышленной эксплуатации должен очищать выражения от конфиденциальных данных согласно своей политике безопасности, ограничивать длину каждой записи журнала и определять, следует ли записывать пользователя и IP-адрес клиента.

### Шаг 5: Регистрация фабрики {#step-5-register-the-factory}

Создайте `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory`. Файл должен содержать только полное имя класса фабрики:

```text
org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory
```

Каждый каталог внешнего плагина может предоставлять только одну реализацию `LineagePluginFactory`. Имена фабрик также должны быть уникальными среди всех загруженных плагинов.

### Шаг 6: Сборка плагина {#step-6-build-the-plugin}

Перед первой сборкой плагина в этом каталоге исходного кода подготовьте среду сборки Doris для [Linux](/community/source-install/compilation-linux) или [macOS](/community/source-install/compilation-mac), а затем один раз соберите FE. Следующие переменные окружения отключают только UI, Hive UDF и Java-расширения BE, которые не требуются для сборки плагина происхождения данных. Они не пропускают сборку FE:

```shell
cd "${DORIS_SOURCE}"
DISABLE_BUILD_UI=ON \
DISABLE_BE_JAVA_EXTENSIONS=ON \
DISABLE_BUILD_HIVE_UDF=ON \
./build.sh --fe
```

На этом шаге генерируются исходные файлы Thrift и Protobuf и собирается FE. Не пропускайте его, переходя сразу к приведённой ниже команде Maven в только что полученном дереве исходного кода: компиляция завершится ошибкой из-за отсутствия сгенерированных классов, например `org.apache.doris.thrift`. Повторять этот шаг не требуется, если `./build.sh --fe` уже успешно выполнялся для той же версии исходного кода.

Затем установите необходимые плагину модули FE в локальный репозиторий Maven и соберите подмодуль плагина:

```shell
cd "${DORIS_SOURCE}"
mvn -f fe/pom.xml install \
  -pl fe-common,fe-extension-spi,fe-extension-loader,fe-core \
  -DskipTests -Dcheckstyle.skip=true
mvn -f fe_plugins/pom.xml -pl lineage/example-lineage -am clean package \
  -DskipTests -Dcheckstyle.skip=true
```

После успешной сборки создаётся:

```text
$DORIS_SOURCE/fe_plugins/lineage/example-lineage/target/example-lineage.jar
```

Проверьте файл SPI и содержимое JAR:

```shell
PLUGIN_JAR="${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar"
unzip -p "${PLUGIN_JAR}" \
  META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory
if jar tf "${PLUGIN_JAR}" | grep -qE '^org/apache/doris/(nereids|extension)/'; then
  echo "ERROR: Doris API classes must not be packaged in the plugin JAR" >&2
  exit 1
fi
```

Первая команда должна вывести `org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory`. Последующая проверка ничего не выводит и возвращает ноль, если JAR не содержит классов API Doris.

### Шаг 7: Развёртывание и активация плагина {#step-7-deploy-and-activate-the-plugin}

В этом разделе `FE_HOME` обозначает каталог установки одного FE, содержащий `bin/`, `conf/` и `lib/`, а не каталог исходного кода Doris. Скрипт `start_fe.sh` задаёт этот каталог в качестве `DORIS_HOME` процесса FE. Скопируйте JAR на каждый FE:

```shell
export FE_HOME=/opt/apache-doris/fe
mkdir -p "${FE_HOME}/plugins/lineage/example-lineage"
cp "${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar" \
  "${FE_HOME}/plugins/lineage/example-lineage/"
```

Пользователь операционной системы, от имени которого работает FE, должен иметь права на чтение каталога плагина и JAR.

Структура после развёртывания:

```text
$FE_HOME/
└── plugins/
    └── lineage/
        └── example-lineage/
            └── example-lineage.jar
```

Отредактируйте `$FE_HOME/conf/fe.conf` на каждом FE:

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| Параметр | Тип и значение по умолчанию | Обязателен | Действие |
| --- | --- | --- | --- |
| `plugin_dir` | Строка; `$FE_HOME/plugins` | Нет | Корневой каталог плагинов. Загрузчик плагинов происхождения данных сканирует непосредственно вложенные каталоги в `lineage/`. При использовании каталога по умолчанию этот параметр можно не указывать. |
| `activate_lineage_plugin` | Массив строк; пустой | Рекомендуется задать явно | Имена фабрик для создания экземпляров, разделённые запятыми. При пустом значении создаются экземпляры всех обнаруженных фабрик. |
| `lineage_event_queue_size` | Положительное целое число; `50000` | Нет | Максимальное количество событий, ожидающих рабочего потока на текущем FE. При заполнении очереди новые события отбрасываются. |

Эти параметры применяются к текущему процессу FE и считываются только при запуске. Разверните и настройте плагин на каждом FE, который может выполнять DML. После изменения параметра или замены JAR перезапустите соответствующий FE. Эти параметры нельзя изменить динамически с помощью `ADMIN SET FRONTEND CONFIG`.

## Проверка плагина {#verify-the-plugin}

После перезапуска FE сначала убедитесь, что плагин загрузился. Если каталог журналов FE был изменён, замените `FE_LOG` фактическим путём к `fe.log`:

```shell
export FE_LOG="${FE_HOME}/log/fe.log"
grep 'Loaded lineage plugin: example-lineage' "${FE_LOG}" | tail -1
```

Выполните приведённый выше [пример модели событий происхождения данных](#lineage-event-model-example), а затем найдите последнее событие:

```shell
grep 'LINEAGE_EVENT' "${FE_LOG}" | tail -1
```

Журнал должен содержать фактический идентификатор запроса, `InsertIntoTableCommand`, целевую таблицу `lineage_target`, исходную таблицу `lineage_source` и разделы `direct`, `datasetIndirect` и `outputIndirect`. Например:

```text
LINEAGE_EVENT queryId=<query-id> command=InsertIntoTableCommand ...
target=internal.lineage_demo.lineage_target
sources=[internal.lineage_demo.lineage_source] direct={...}
datasetIndirect={...} outputIndirect={...}
```

Фактическая запись журнала занимает одну строку; выше она разбита на строки для удобства чтения. `INSERT INTO lineage_source VALUES ...` не создаёт событие. Эту запись журнала создаёт только `INSERT INTO lineage_target ... SELECT`.

Когда проверка завершена и данные примера больше не нужны, выполните:

```sql
DROP DATABASE lineage_demo;
```

## Надёжность и устранение неполадок {#reliability-and-troubleshooting}

| Условие | Поведение фреймворка | Рекомендация для плагина |
| --- | --- | --- |
| Очередь заполнена | Новое событие отбрасывается, а в журнал записывается предупреждение. Результат DML не меняется. | Обеспечьте быстрое выполнение `exec()`; выполняйте пакетную или буферизованную запись в принимающую систему вне критического пути FE. |
| `exec()` выбрасывает исключение | Рабочий поток записывает исключение в журнал и переходит к следующему плагину или событию. | Перехватывайте ожидаемые сбои принимающей системы, добавьте повторные попытки с ограничением и предоставляйте метрики. |
| `exec()` возвращает `false` | Текущий фреймворк игнорирует возвращаемое значение. Он не повторяет попытку, не возвращает событие в очередь и не меняет состояние DML. | Фиксируйте ошибку и реализуйте повторные попытки с ограничением внутри плагина. Не полагайтесь на возвращаемое значение для восстановления после сбоев. |
| Плагин работает медленно | Один рабочий поток последовательно отправляет события. Медленный плагин задерживает каждое последующее событие. | Для медленной принимающей системы используйте внутреннюю очередь ограниченного размера и отдельный пул потоков отправки. |
| Повторяющееся имя фабрики | Первая обнаруженная фабрика сохраняется, а дубликат пропускается. | Используйте глобально уникальное имя. |
| JAR изменён после запуска | Загрузчик не отслеживает изменения в каталогах плагинов, не перезагружает и не выгружает их. | После замены JAR-файлов или зависимостей перезапустите FE. |

### Диагностика проблем по журналам FE {#diagnose-problems-from-fe-logs}

| Ключевой текст в журнале | Типичная причина | Действие |
| --- | --- | --- |
| `Skip lineage plugin directory due to load failure` | В каталоге плагина нет JAR, отсутствует файл SPI, каталог предоставляет несколько фабрик или не удалось загрузить зависимости. | Проверьте каталог и JAR, убедитесь, что файл SPI содержит имя одного класса фабрики, и изучите `stage` и `message` в исключении. |
| `Skip lineage plugin not in activate_lineage_plugin` | Фабрика обнаружена, но её `name()` отсутствует в списке активации. | Сравните имя фабрики с `activate_lineage_plugin`. Имена чувствительны к регистру. |
| `Failed to create/initialize lineage plugin` | `create(context)` или `initialize(context)` выбросил исключение. | Изучите трассировку стека, логику инициализации, файлы конфигурации и права доступа к каталогу. |
| `the lineage event queue is full` | Плагин обрабатывает события медленнее, чем они создаются, и очередь текущего FE заполнена. | Сначала сократите время обработки в `exec()` и выясните причины блокировок в принимающей системе, затем оцените необходимость увеличения `lineage_event_queue_size`. |

### Отключение плагина и откат {#disable-and-roll-back-the-plugin}

Чтобы отключить плагин, остановите соответствующий FE, переместите каталог плагина за пределы `plugin_dir/lineage/`, удалите `example-lineage` из `activate_lineage_plugin` и запустите FE. Не ограничивайтесь очисткой `activate_lineage_plugin`, оставляя JAR на месте: пустой список активирует все обнаруженные плагины происхождения данных.

```shell
mkdir -p "${FE_HOME}/plugins-disabled"
mv "${FE_HOME}/plugins/lineage/example-lineage" \
  "${FE_HOME}/plugins-disabled/"
```

После запуска FE убедитесь, что новая запись `Loaded lineage plugin: example-lineage` не появилась. Чтобы восстановить плагин, верните каталог в `${FE_HOME}/plugins/lineage/`, восстановите `activate_lineage_plugin` и снова перезапустите FE.

Доставка сведений о происхождении данных выполняется без гарантий и не входит в одну транзакцию с DML. Успешное выполнение DML не гарантирует доставку во внешнюю систему управления данными. Используйте идентификатор запроса и целевую таблицу для формирования идемпотентных идентификаторов событий в принимающей системе.
