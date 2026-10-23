---
title: Правила форматирования кода C++
language: ru
description: "Форматирование кода C++ в Apache Doris: настройка и использование инструмента clang-format из командной строки и IDE."
keywords:
    - Apache Doris
    - форматирование кода C++
    - clang-format
    - LDB toolchain
    - Clion
    - VS Code
    - разработка BE
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

# Правила форматирования кода C++ {#c-code-formatting-specification}

<!-- Knowledge type: Code specification -->
<!-- Applicable scenario: BE development / Pull Request submission -->

Apache Doris использует `clang-format` для форматирования кода C++ и предоставляет скрипты-обёртки в каталоге `build-support`, чтобы разработчики могли привести код к единому формату перед отправкой изменений.

## Скрипты-обёртки {#wrapper-scripts}

| Скрипт | Назначение |
|------|------|
| `build-support/clang-format.sh` | Форматирует код C/C++ в каталогах `be/src` и `be/test` |
| `build-support/check-format.sh` | Проверяет форматирование кода в каталогах `be/src` и `be/test` и выводит различия, не изменяя файлы |

## Настройка стиля кода {#code-style-customization}

- Стиль кода Apache Doris основан на Google Style с небольшими изменениями. Файл конфигурации `.clang-format` находится в корневом каталоге Doris.
- `.clang-format` совместим с `clang-format-16.0.0` и более поздними версиями.
- Файл `.clang-format-ignore` содержит список кода, который не следует форматировать. Обычно это сторонние библиотеки, для которых нужно сохранить исходный стиль.

## Настройка окружения {#environment-setup}

Необходимо установить `clang-format` или использовать плагин `clang-format`, доступный в вашей IDE или редакторе. В настоящее время Doris использует `clang-format 16` для форматирования кода (разные версии `clang-format` могут давать разные результаты).

### Установка clang-format {#install-clang-format}

| Система | Рекомендуемый способ |
|------|---------|
| Linux | Используйте [набор инструментов LDB](/community/source-install/compilation-with-ldb-toolchain) (он уже включает нужную версию) или самостоятельно соберите и установите исполняемый файл |
| macOS | `brew install clang-format@16` |

Примечание о наборе инструментов LDB: последняя версия (>= v0.18) уже включает готовый исполняемый файл `clang-format 16.0.0`. Скачать его можно на странице [релизов ldb_toolchain_gen](https://github.com/amosbird/ldb_toolchain_gen/releases).

### Использование плагина IDE {#use-an-ide-plugin}

| IDE | Плагин | Примечания |
|-----|------|---------|
| CLion | `ClangFormat` (найдите и скачайте в разделе `File -> Setting -> Plugins`) | Убедитесь, что используется `clang-format` версии 16 |
| VS Code | Расширение `Clang-Format` | Необходимо вручную указать путь к исполняемому файлу `clang-format` |

## Использование {#usage}

### Запуск из командной строки {#run-from-the-command-line}

1. Перейдите в корневой каталог Doris:

    ```bash
    cd ${DORIS_HOME}
    ```

2. Запустите скрипт форматирования:

    ```bash
    build-support/clang-format.sh
    ```

> Примечание: для работы скрипта `clang-format.sh` на компьютере должен быть установлен Python 3.

### Использование clang-format в CLion {#use-clang-format-in-clion}

После установки плагина `ClangFormat` нажмите `Reformat Code`, чтобы отформатировать текущий файл.

### Использование clang-format в VS Code {#use-clang-format-in-vs-code}

1. Установите расширение `Clang-Format`.
2. Откройте страницу настроек VS Code, найдите `clang_format` и задайте следующую конфигурацию:

    ```json
    {
        "clang_format_path": "$clang-format path$",
        "clang_format_style": "file"
    }
    ```

3. Щёлкните правой кнопкой мыши и выберите `Format Document`, чтобы отформатировать файл.

## Часто задаваемые вопросы {#faq}

**Вопрос: могут ли разные версии `clang-format` приводить к различиям в форматировании?**

Да. Используйте только версии серии `clang-format 16`, иначе форматирование может не соответствовать требованиям проекта, а проверка CI может завершиться ошибкой.

**Вопрос: форматируется ли сторонний код?**

Нет. Каталоги, перечисленные в `.clang-format-ignore`, пропускаются, чтобы сохранить исходный стиль кода сторонних зависимостей.
