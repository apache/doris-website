---
title: Анализ производительности FE с помощью Arthas
language: ru
description: "Анализируйте производительность Apache Doris FE во время работы с помощью Arthas: флейм-графы, трассировка функций и наблюдение за их выполнением."
keywords:
    - Apache Doris
    - Arthas
    - анализ производительности FE
    - флейм-граф
    - трассировка функций
    - JVM
    - DorisFE
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

# Анализ производительности FE с помощью Arthas {#analyzing-fe-performance-with-arthas}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Performance tuning / Troubleshooting -->

## Введение {#introduction}

В Apache Doris 3.1.0 и более поздних версиях каталог развертывания FE `${DORIS_FE_HOME}/arthas` содержит инструмент Arthas (версия 4.0.5). С помощью Arthas можно строить флейм-графы во время работы системы, отслеживать цепочки вызовов функций, измерять время их выполнения и наблюдать за входными данными и возвращаемыми значениями. Это упрощает поиск проблем во время работы FE.

Подробные описания команд приведены в [официальной документации Arthas](https://arthas.aliyun.com/en/doc/).

### Поддерживаемые системы {#system-support}

| Система | Поддержка |
|------|---------|
| Linux | Да |
| macOS | Да |
| Windows | Пока не поддерживается |

### Установка вручную для более ранних версий FE {#manual-installation-for-older-fe-versions}

Для версий Doris до 3.1.0 скачайте Arthas вручную:

```bash
wget https://github.com/alibaba/arthas/releases/download/arthas-all-4.0.5/arthas-bin.zip
unzip arthas-bin.zip -o ${DORIS_FE_HOME}/arthas
```

## Построение флейм-графа {#generating-a-flame-graph}

1. Запустите скрипт `${DORIS_FE_HOME}/arthas/as.sh` и выберите в списке процессов порядковый номер процесса `DorisFE`:

    ```shell
    bash ./as.sh
    Arthas script version: 4.0.5
    Found existing java process, please choose one and input the serial number of the process, eg : 1. Then hit ENTER.
    * [1]: 75123 com.intellij.idea.Main
      [2]: 77285 org.apache.doris.DorisFE
      [3]: 76901 DorisBE
      [4]: 6776 org.jetbrains.jps.cmdline.Launcher
      [5]: 76265 DorisBE
      [6]: 80527 org.jetbrains.jps.cmdline.Launcher
    2
    ```

2. Запустите профилирование в командной строке Arthas:

    ```shell
    [arthas@77285]$ profiler start
    Profiling started
    ```

3. Остановите профилирование и создайте флейм-граф в формате HTML:

    ```shell
    [arthas@77285]$ profiler stop --format html
    OK
    profiler output file: <DORIS_FE_HOME>/arthas-output/20250627-115104.html
    ```

    Выходной файл сохраняется в каталоге `${DORIS_FE_HOME}/arthas-output/`. Откройте его в браузере, чтобы определить функции, потребляющие больше всего процессорного времени.

## Краткий справочник по основным командам Arthas {#common-arthas-command-cheatsheet}

| Команда | Назначение |
|------|------|
| `profiler start` / `profiler stop --format html` | Сбор флейм-графа CPU |
| `trace <class> <method>` | Отслеживание цепочек вызовов функций и времени их выполнения |
| `watch <class> <method>` | Наблюдение за входными данными и возвращаемыми значениями функций |
| `thread` | Просмотр состояния потоков JVM |
| `dashboard` | Просмотр общих показателей работы JVM в реальном времени |

## Часто задаваемые вопросы {#faq}

**Вопрос: Процесс `DorisFE` не найден при запуске `as.sh`.**

Убедитесь, что процесс FE запущен и что `as.sh` выполняется на той же машине, что и FE. Список процессов формируется на основе JVM, доступных текущему пользователю.

**Вопрос: Построенный флейм-граф пуст или содержит слишком мало сэмплов.**

Убедитесь, что во время профилирования FE непрерывно выполняет запросы или обрабатывает обращения. Можно увеличить интервал между `profiler start` и `profiler stop`.
