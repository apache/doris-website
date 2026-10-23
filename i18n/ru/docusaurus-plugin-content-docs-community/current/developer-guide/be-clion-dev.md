---
title: Настройка среды разработки BE - CLion
language: ru
description: Настройте среду разработки Apache Doris BE в CLion для удалённой разработки или локальной разработки в macOS.
keywords:
    - CLion
    - Apache Doris BE
    - среда разработки BE
    - удалённая разработка
    - отладка BE в macOS
    - CMake
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

# Настройка среды разработки BE в CLion {#setting-up-a-be-development-environment-with-clion}

В этом документе описаны два типичных режима разработки BE (Backend) в CLion:

- **Вариант 1: удалённая разработка** (рекомендуется). Локальная среда CLion подключается к удалённому серверу Linux по SSH/SFTP, а код синхронизируется с удалённой машиной для компиляции и выполнения. Это наиболее распространённая конфигурация для разработки BE в Doris, поскольку для BE требуется полноценный набор инструментов Linux.
- **Вариант 2: локальная разработка в macOS**. Компилируйте и отлаживайте BE непосредственно в macOS без удалённого сервера.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: IDE configuration / Debug setup -->

## Вариант 1: удалённая разработка (Linux) {#option-1-remote-development-linux}

### 1. Скачайте и скомпилируйте код на удалённом сервере {#1-download-and-compile-the-code-on-the-remote-server}

На удалённом сервере Linux скачайте и скомпилируйте Doris:

```bash
git clone https://github.com/apache/doris.git
cd doris
```

Отредактируйте `env.sh`, добавив в начале настройку `DORIS_HOME`, например:

```bash
DORIS_HOME=/mnt/datadisk0/chenqi/doris
```

Запустите сборку (подробное описание процесса см. в разделе [Компиляция с LDB Toolchain](../source-install/compilation-with-ldb-toolchain)):

```bash
./build.sh
```

### 2. Настройте среду удалённой разработки в локальной CLion {#2-configure-the-remote-development-environment-in-local-clion}

1. Скачайте и установите CLion локально, затем импортируйте код BE Doris.

2. В CLion откройте **Настройки → Сборка, выполнение, развёртывание → Развёртывание** и добавьте данные для входа на удалённый сервер разработки, используя **SFTP**. Настройте пути в разделе **Сопоставления**, например:
    - Локальный путь: `/User/kaka/Programs/doris/be`
    - Путь развёртывания: `/mnt/datadisk0/chenqi/clion/doris/be`

    ![Развёртывание1](/images/clion-deployment1.png)

    ![Развёртывание2](/images/clion-deployment2.png)

3. Скопируйте каталог `gensrc`, созданный на удалённом сервере при компиляции, в родительский каталог для пути, указанного в поле **Путь развёртывания**:

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/gensrc /mnt/datadisk0/chenqi/clion/doris/gensrc
    ```

4. Откройте **Настройки → Сборка, выполнение, развёртывание → Наборы инструментов** и добавьте набор инструментов для удалённой среды (CMake, GCC, G++, GDB и т. д.).

    :::caution Важно
    В поле **Файл окружения** укажите путь к файлу `env.sh` в исходном коде Doris на удалённом сервере.
    :::

    ![Наборы инструментов](/images/clion-toolchains.png)

5. Откройте **Настройки → Сборка, выполнение, развёртывание → CMake** и добавьте следующее в параметры CMake:

    ```bash
    -DDORIS_JAVA_HOME=/path/to/remote/JAVA_HOME
    ```

    Укажите здесь путь `JAVA_HOME` на удалённом сервере. Иначе файл `jni.h` не будет найден.

6. В CLion щёлкните правой кнопкой мыши и выберите **Загрузить проект CMake**. Это действие синхронизирует код с удалённым сервером и создаёт файлы сборки CMake.

### 3. Запускайте и отлаживайте удалённый BE из локальной CLion {#3-run-and-debug-remote-be-from-local-clion}

1. Настройте CMake в разделе **Настройки → Сборка, выполнение, развёртывание → CMake**. Можно настроить разные цели, например Debug или Release, и в поле **Набор инструментов** выбрать ранее настроенный удалённый набор инструментов.

    Для запуска и отладки модульных тестов добавьте `-DMAKE_TEST=ON` в параметры CMake (по умолчанию этот параметр выключен).

2. На удалённом сервере скопируйте каталог `output` в отдельный каталог:

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/output /mnt/datadisk0/chenqi/clion/doris/doris_be
    ```

    ![Структура выходного каталога](/images/doris-dist-output-tree.png)

3. В CLion выберите цель `doris_be` (Debug или Release) и настройте её. Ориентируйтесь на переменные окружения, экспортируемые в `be/bin/start_be.sh`, и укажите для каждой переменной соответствующий путь на удалённом сервере:

    ![Конфигурация запуска и отладки1](/images/clion-run-debug-conf1.png)
    ![Конфигурация запуска и отладки2](/images/clion-run-debug-conf2.png)

4. Нажмите **Запуск**, чтобы скомпилировать и запустить BE, или **Отладка**, чтобы скомпилировать и отладить BE.

## Вариант 2: локальная разработка в macOS {#option-2-macos-local-development}

В macOS можно компилировать и отлаживать BE полностью локально, без удалённого сервера. Прежде чем начать, установите зависимости и получите исходный код, как описано в разделе [Компиляция в macOS](../source-install/compilation-mac).

### 1. Откройте корневой каталог исходного кода Doris {#1-open-the-doris-source-root-directory}

![развёртывание1](/images/mac-clion-deployment1.png)

### 2. Настройте CLion {#2-configure-clion}

**Настройка набора инструментов**: выполните настройку согласно рисунку ниже. Все проверки должны пройти успешно.

![развёртывание2](/images/mac-clion-deployment2.png)

**Настройка CMake**: выполните настройку согласно рисунку ниже.

![развёртывание3](/images/mac-clion-deployment3.png)

После подтверждения настроек CLion автоматически выполняет первую загрузку файла CMake. Если файл не загрузился автоматически, щёлкните правой кнопкой мыши по `$DORIS_HOME/be/CMakeLists.txt` и выберите «Загрузить».

### 3. Настройте отладку BE {#3-configure-debug-be}

Выберите «Изменить конфигурации»:

![развёртывание4](/images/mac-clion-deployment4.png)

<!-- Knowledge type: Configuration parameters -->

Добавьте переменные окружения для `doris_be`. Ориентируйтесь на переменные окружения, экспортируемые в `be/bin/start_be.sh`. Пути к каталогам Doris в переменных окружения должны указывать на скопированный вами каталог среды выполнения. Пример переменных окружения:

| Переменная окружения | Пример значения                                                                                                                                       | Описание           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `JAVA_OPTS`          | `-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000` | Аргументы запуска JVM |
| `LOG_DIR`            | `~/DorisDev/doris-run/be/log`                                                                                                                       | Каталог журналов BE      |
| `NLS_LANG`           | `AMERICAN_AMERICA.AL32UTF8`                                                                                                                         | Кодировка Oracle JDBC  |
| `ODBCSYSINI`         | `~/DorisDev/doris-run/be/conf`                                                                                                                      | Каталог конфигурации ODBC |
| `PID_DIR`            | `~/DorisDev/doris-run/be/log`                                                                                                                       | Каталог файлов PID    |
| `UDF_RUNTIME_DIR`    | `~/DorisDev/doris-run/be/lib/udf-runtime`                                                                                                           | Каталог среды выполнения UDF |
| `DORIS_HOME`         | `~/DorisDev/doris-run/be`                                                                                                                           | Каталог среды выполнения BE  |

```bash
JAVA_OPTS=-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000
LOG_DIR=~/DorisDev/doris-run/be/log
NLS_LANG=AMERICAN_AMERICA.AL32UTF8
ODBCSYSINI=~/DorisDev/doris-run/be/conf
PID_DIR=~/DorisDev/doris-run/be/log
UDF_RUNTIME_DIR=~/DorisDev/doris-run/be/lib/udf-runtime
DORIS_HOME=~/DorisDev/doris-run/be
```

![развёртывание5](/images/mac-clion-deployment5.png)
![развёртывание6](/images/mac-clion-deployment6.png)

### 4. Начните отладку {#4-start-debugging}

Нажмите **Запуск** или **Отладка**. CLion начнёт компиляцию, а после её завершения запустится BE.

![развёртывание7](/images/mac-clion-deployment7.png)

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос 1: при удалённой компиляции возникает ошибка `jni.h not found` {#q1-remote-compilation-reports-jnih-not-found}

В параметрах CMake значение `-DDORIS_JAVA_HOME` неверно указывает на удалённый `JAVA_HOME`. См. шаг 5 в подразделе 2 варианта 1.

### Вопрос 2: CLion не находит символы или показывает много красных подчёркиваний {#q2-clion-cannot-find-symbols-or-shows-a-lot-of-red-underlines}

Каталог `gensrc` не был скопирован в родительский каталог пути развёртывания либо для повторной загрузки не была выбрана команда **Загрузить проект CMake**.

### Вопрос 3: BE завершает работу сразу после запуска {#q3-be-exits-immediately-after-startup}

Переменные окружения `DORIS_HOME`, `PID_DIR` или `LOG_DIR` не настроены либо указанные пути не существуют. Проверьте таблицу переменных окружения выше; все каталоги по указанным путям должны быть созданы заранее.
