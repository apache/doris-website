---
{
    "title": "Управление журналами FE",
    "language": "ru",
    "description": "Руководство по управлению журналами FE Apache Doris: категории журналов (fe.log/fe.warn.log/fe.audit.log/fe.out/fe.gc.log), настройка хранения и ротации журналов, включение журналов DEBUG во время работы и интеграция вывода журналов в stdout в контейнерных средах.",
    "keywords": [
        "Doris FE logs",
        "fe.log",
        "fe.warn.log",
        "fe.audit.log",
        "fe.out",
        "fe.gc.log",
        "audit log",
        "GC log",
        "log level",
        "DEBUG log",
        "sys_log_verbose_modules",
        "sys_log_mode",
        "log_rollover_strategy",
        "log rolling",
        "log retention",
        "log compression",
        "Kubernetes FE logs",
        "container logs",
        "stdout logs",
        "enable_file_logger",
        "runtime log level adjustment",
        "Doris log troubleshooting"
    ]
}
---

Этот документ предназначен для инженеров по эксплуатации и разработчиков, работающих с кластером Doris. В нём описана система журналирования процесса FE (Frontend): категории файлов журналов, политики хранения и ротации, включение журналов DEBUG во время работы и интеграция журналов в контейнерных средах.

> Этот документ применим к Doris 2.1.4 и более поздним версиям.

<!-- Knowledge type: Operations guide + Configuration parameters -->
<!-- Use cases: Daily operations / Troubleshooting / Performance tuning / Containerized deployment -->

## Сценарии использования {#use-cases}

| Сценарий | Рекомендуемый раздел |
| --- | --- |
| Узнать, какие файлы журналов создаёт FE и для чего предназначен каждый из них | [Категории журналов](#log-categories) |
| Изменить срок хранения журналов в днях, размер отдельного файла или политику ротации | [Настройка журналов](#log-configuration) |
| Включить журналы DEBUG для определённого класса или пакета при диагностике проблем | [Включение журналов DEBUG](#enable-debug-logs) |
| Развернуть FE в Kubernetes или другой контейнерной среде и направить журналы в stdout | [Настройка журналов в контейнерной среде](#container-environment-log-configuration) |
| Узнать, где находится журнал аудита и что в нём записывается | `fe.audit.log` в разделе [Категории журналов](#log-categories) и параметры аудита в разделе [Настройка журналов](#log-configuration) |

## Категории журналов {#log-categories}

<!-- Knowledge type: Concept overview -->
<!-- Use cases: Quickly confirm which log to look at before troubleshooting -->

После запуска процесса FE командой `sh bin/start_fe.sh --daemon` в каталоге журналов FE (задаётся параметром `LOG_DIR`, по умолчанию это каталог `log/` в каталоге развёртывания FE) создаются следующие файлы журналов:

| Файл журнала | Тип | Описание |
| --- | --- | --- |
| `fe.log` | Журнал работы (основной) | Основной журнал процесса FE. Содержит сообщения всех уровней, записываемые во время работы (DEBUG, INFO, WARN, ERROR и т. д.). |
| `fe.warn.log` | Журнал работы (предупреждения) | Содержит только сообщения уровня WARN и выше. Представляет собой подмножество `fe.log` и удобен для быстрого поиска предупреждений и ошибок. |
| `fe.audit.log` | Журнал аудита | Содержит все операции с базой данных (SQL, DDL, DML и т. д.), выполненные через этот узел FE. |
| `fe.out` | Стандартный поток вывода / ошибок | Содержит вывод `echo` из скрипта запуска и сообщения, не перехваченные библиотекой log4j. Дополняет журнал работы. В редких случаях в нём можно найти дополнительную информацию. |
| `fe.gc.log` | Журнал GC JVM | Журнал сборки мусора JVM процесса FE. Его поведение определяется параметром `JAVA_OPTS` в `fe.conf`. |

## Настройка журналов {#log-configuration}

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: Adjust log retention policy, rolling mode, and compressed archiving -->

Все перечисленные ниже параметры находятся в файле `fe.conf`. Они определяют путь хранения журналов, срок хранения, количество сохраняемых файлов, размер отдельного файла и связанные настройки.

### Общие настройки {#general-configuration}

| Параметр | Значение по умолчанию | Допустимые значения | Описание |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | | Путь хранения всех журналов. По умолчанию используется каталог `log/` в каталоге развёртывания FE. Обратите внимание: это переменная окружения, и её имя должно быть указано в верхнем регистре. |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | Уровень журналирования для `fe.log`. По умолчанию используется INFO. Менять его не рекомендуется, поскольку на уровне INFO записывается много важных сообщений. |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | Режим вывода журналов FE. `NORMAL` используется по умолчанию: сообщения записываются синхронно и содержат сведения о месте вызова в коде. `ASYNC` записывает сообщения асинхронно и включает сведения о месте вызова в коде. `BRIEF` записывает сообщения асинхронно, но без сведений о месте вызова в коде. Производительность возрастает при переходе от `NORMAL` к `ASYNC` и далее к `BRIEF`. |

:::note
Начиная с версии 3.0.2, значение по умолчанию для `sys_log_mode` изменено на `ASYNC`.
:::

### Журналы работы (fe.log / fe.warn.log) {#runtime-logs-felog--fewarnlog}

| Параметр | Значение по умолчанию | Допустимые значения | Описание |
| --- | --- | --- | --- |
| `log_roll_size_mb` | 1024 | | Максимальный размер отдельного файла `fe.log`, `fe.warn.log` или `fe.audit.log`. По умолчанию — 1024 МБ. Когда размер файла журнала превышает этот порог, автоматически создаётся новый файл. |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | Интервал ротации `fe.log` и `fe.warn.log`. По умолчанию — 1 день: новый файл журнала создаётся ежедневно. |
| `sys_log_roll_num` | 10 | | Максимальное количество файлов `fe.log` и `fe.warn.log` за один день. По умолчанию — 10. Если из-за ротации или разделения файлов их количество превышает этот порог, старые файлы журналов удаляются. |
| `sys_log_enable_compress` | false | true, false | Включает сжатие старых файлов `fe.log` и `fe.warn.log`. По умолчанию отключено. Если параметр включён, старые журналы архивируются со сжатием gzip. |
| `sys_log_verbose_modules` | | | Включает журналирование уровня DEBUG для указанных пакетов или классов Java. См. раздел [Включение журналов DEBUG](#enable-debug-logs). |

:::tip
`sys_log_roll_num` определяет количество сохраняемых журналов за день, а не их общее количество. Чтобы определить общее количество сохраняемых журналов, этот параметр нужно использовать вместе с `sys_log_delete_age`.
:::

### Журнал аудита (fe.audit.log) {#audit-log-feauditlog}

| Параметр | Значение по умолчанию | Допустимые значения | Описание |
| --- | --- | --- | --- |
| `audit_log_dir` | `ENV(DORIS_HOME)/log` | | Отдельный путь хранения `fe.audit.log`. По умолчанию используется каталог `log/` в каталоге развёртывания FE. |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | Интервал ротации `fe.audit.log`. По умолчанию — 1 день: новый файл журнала создаётся ежедневно. |
| `audit_log_roll_num` | 90 | | Максимальное количество файлов `fe.audit.log`. По умолчанию — 90. Если из-за ротации или разделения файлов их количество превышает этот порог, старые файлы журналов удаляются. |
| `audit_log_enable_compress` | false | true, false | Включает сжатие старых файлов `fe.audit.log`. По умолчанию отключено. Если параметр включён, старые журналы аудита архивируются со сжатием gzip. |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` | | Типы модулей, записываемых в `fe.audit.log`. По умолчанию: медленные запросы, запросы, загрузка и Stream Load. «Query» включает все операции DDL, DML и SQL; «slow query» — такие операции, время выполнения которых превышает порог `qe_slow_log_ms`; «load» — операции Broker Load; «stream load» — операции Stream Load. |
| `qe_slow_log_ms` | 5000 | | Если время выполнения оператора DDL, DML или SQL превышает этот порог, он отдельно записывается в модуле `slow_query` журнала `fe.audit.log`. По умолчанию — 5000 мс. |
| `sql_digest_generation_threshold_ms` | 5000 | | Порог времени для создания `sql_digest`, в миллисекундах. Если время ответа на запрос превышает этот порог, для него создаётся `sql_digest` в `fe.audit.log`. По умолчанию — 5000 мс. |

### Хранение по времени (log_rollover_strategy = age) {#retention-by-time-log_rollover_strategy--age}

| Параметр | Значение по умолчанию | Допустимые значения | Описание |
| --- | --- | --- | --- |
| `log_rollover_strategy` | `age` | `age`, `size` | Стратегия хранения журналов. По умолчанию — `age`: старые журналы сохраняются с учётом времени; `size` определяет хранение старых журналов по их общему размеру. |
| `sys_log_delete_age` | 7d | Поддерживаются форматы 7d, 10h, 60m, 120s | Действует, только если `log_rollover_strategy` имеет значение `age`. Определяет срок хранения файлов `fe.log` и `fe.warn.log`. По умолчанию — 7 дней. Журналы старше 7 дней удаляются автоматически. |
| `audit_log_delete_age` | 30d | Поддерживаются форматы 7d, 10h, 60m, 120s | Действует, только если `log_rollover_strategy` имеет значение `age`. Определяет срок хранения файлов `fe.audit.log`. По умолчанию — 30 дней. Журналы старше 30 дней удаляются автоматически. |

### Хранение по размеру (log_rollover_strategy = size) {#retention-by-size-log_rollover_strategy--size}

| Параметр | Значение по умолчанию | Допустимые значения | Описание |
| --- | --- | --- | --- |
| `info_sys_accumulated_file_size` | 4 | | Действует, только если `log_rollover_strategy` имеет значение `size`. Определяет суммарный размер файлов `fe.log`. По умолчанию — 4 ГБ. Когда суммарный размер журналов превышает этот порог, старые файлы журналов удаляются. |
| `warn_sys_accumulated_file_size` | 2 | | Действует, только если `log_rollover_strategy` имеет значение `size`. Определяет суммарный размер файлов `fe.warn.log`. По умолчанию — 2 ГБ. Когда суммарный размер журналов превышает этот порог, старые файлы журналов удаляются. |
| `audit_sys_accumulated_file_size` | 4 | | Действует, только если `log_rollover_strategy` имеет значение `size`. Определяет суммарный размер файлов `fe.audit.log`. По умолчанию — 4 ГБ. Когда суммарный размер журналов превышает этот порог, старые файлы журналов удаляются. |

## Включение журналов DEBUG {#enable-debug-logs}

<!-- Knowledge type: Procedures -->
<!-- Use cases: Troubleshooting / temporarily inspecting runtime details of a specific class or package -->

Журналы уровня DEBUG на FE можно включить, изменив файл конфигурации, либо во время работы через интерфейс или REST API. Сравнение трёх способов:

| Способ | Необходимость перезапуска | Область действия | Сценарий использования |
| --- | --- | --- | --- |
| Изменение `fe.conf` | Требуется перезапуск FE | Каждый узел применяет собственную конфигурацию после перезапуска | Постоянное ведение определённых журналов DEBUG |
| Интерфейс FE | Перезапуск не требуется | Только текущий узел FE | Временная диагностика через графический интерфейс |
| REST API | Перезапуск не требуется | Только целевой узел FE | Временная диагностика, массовые операции с помощью скриптов |

### Способ 1: через файл конфигурации {#option-1-through-the-configuration-file}

Добавьте `sys_log_verbose_modules` в `fe.conf`. Например:

```text
# Enable DEBUG log only for the class org.apache.doris.catalog.Catalog
sys_log_verbose_modules=org.apache.doris.catalog.Catalog

# Enable DEBUG log for all classes under the package org.apache.doris.catalog
sys_log_verbose_modules=org.apache.doris.catalog

# Enable DEBUG log for all classes under the package org
sys_log_verbose_modules=org
```

После добавления параметра перезапустите узел FE, чтобы изменение вступило в силу.

### Способ 2: через интерфейс FE {#option-2-through-the-fe-ui}

Интерфейс позволяет менять уровни журналирования во время работы без перезапуска узла FE. Порядок действий:

1. Откройте в браузере адрес узла FE с его HTTP-портом (по умолчанию 8030) и войдите в интерфейс.
2. Нажмите вкладку `Log` на верхней панели навигации.

    ![Через интерфейс FE](/images/log_manage/fe_web_log1.png)

3. В поле «Добавить» введите имя пакета или конкретного класса, чтобы включить для него журналирование DEBUG. Например, ввод `org.apache.doris.catalog.Catalog` включает журналирование DEBUG для класса Catalog:

    ![Через интерфейс FE](/images/log_manage/fe_web_log2.png)

4. В поле «Удалить» введите имя пакета или конкретного класса, чтобы отключить для него журналирование DEBUG.

:::note
Эти изменения влияют только на уровень журналирования соответствующего узла FE и не затрагивают другие узлы FE.
:::

### Способ 3: через REST API {#option-3-through-the-rest-api}

REST API также позволяет менять уровни журналирования во время работы без перезапуска узла FE.

- **Включение журнала DEBUG**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
    ```

    Укажите имя и пароль пользователя root или admin, под которым вы входите в Doris. Параметр `add_verbose` задаёт имя пакета или класса, для которого нужно включить журналирование DEBUG. При успешном выполнении возвращается следующий ответ:

    ```json
    {
        "msg": "success", 
        "code": 0, 
        "data": {
            "LogConfiguration": {
                "VerboseNames": "org,org.apache.doris.catalog.Catalog", 
                "AuditNames": "slow_query,query,load", 
                "Level": "INFO"
            }
        }, 
        "count": 0
    }
    ```

- **Отключение журнала DEBUG**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
    ```

    Параметр `del_verbose` задаёт имя пакета или класса, для которого нужно отключить журналирование DEBUG.

## Настройка журналов в контейнерной среде {#container-environment-log-configuration}

<!-- Knowledge type: Procedures + Configuration parameters -->
<!-- Use cases: Containerized deployment (Kubernetes) / sending logs to stdout for collection -->

В некоторых сценариях, например при развёртывании процесса FE через Kubernetes, все журналы необходимо направлять в стандартный поток вывода вместо файлов, чтобы сборщик журналов контейнеров мог собирать их единообразно.

### Способ запуска {#startup-method}

Запустите процесс FE на переднем плане следующей командой. Все журналы будут направляться в стандартный поток вывода:

```shell
sh bin/start_fe.sh --console
```

### Определение типа журнала по префиксу {#log-prefix-identification}

Чтобы различать типы журналов в одном стандартном потоке вывода, к каждой строке добавляется соответствующий префикс. Пример вывода:

```text
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```

Префиксы соответствуют следующим типам журналов:

| Префикс | Соответствующий файл журнала | Описание |
| --- | --- | --- |
| `StdoutLogger` | `fe.out` | Журналы из стандартного потока вывода. |
| `StderrLogger` | `fe.out` | Журналы из стандартного потока ошибок. |
| `RuntimeLogger` | `fe.log` | Основной журнал работы FE. |
| `AuditLogger` | `fe.audit.log` | Журнал аудита. |
| Без префикса | `fe.gc.log` | Журнал GC. |

### Дополнительные настройки для контейнерных сред {#additional-configuration-for-container-environments}

| Параметр | Значение по умолчанию | Допустимые значения | Описание |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false | Включает запись журналов в файлы. По умолчанию — `true`. При запуске процесса FE с командой `--console` журналы записываются как в стандартный поток вывода, так и в обычные файлы журналов. Если установлено значение `false`, журналы записываются только в стандартный поток вывода, а файлы журналов не создаются. |
