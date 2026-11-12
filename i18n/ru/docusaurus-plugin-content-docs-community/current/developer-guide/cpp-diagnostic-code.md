---
title: Статический анализ кода C++
language: ru
description: "Статический анализ кода C++ в Apache Doris: настройка Clang-Tidy и Clangd (включая интеграцию с VSCode)."
keywords:
    - Apache Doris
    - Статический анализ C++
    - Clang-Tidy
    - Clangd
    - VSCode
    - LDB toolchain
    - compile_commands.json
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

# Статический анализ кода C++ {#c-static-code-analysis}

<!-- Knowledge type: Code conventions -->
<!-- Applicable scenarios: BE development / Code quality checks -->

Apache Doris поддерживает статический анализ кода C++ с помощью [Clangd](https://clangd.llvm.org/) и [Clang-Tidy](https://clang.llvm.org/extra/clang-tidy/). Оба инструмента входят в состав [LDB-toolchain](/community/source-install/compilation-with-ldb-toolchain); их также можно установить или собрать самостоятельно.

## Сравнение инструментов {#tool-comparison}

| Инструмент | Назначение | Файл конфигурации |
|------|---------|--------------------|
| Clangd | Предоставляет функции IDE: навигацию по коду, автодополнение и всплывающие подсказки | Задаётся через `clangd.arguments` |
| Clang-Tidy | Статический анализ и проверка качества кода (может вызываться из Clangd) | `.clang-tidy` в корневом каталоге Doris |

По сравнению с `vscode-cpptools`, Clangd обеспечивает более точную навигацию по коду и интегрирует функции диагностики и быстрого исправления Clang-Tidy.

## Настройка Clang-Tidy {#clang-tidy-configuration}

Правила проверок Clang-Tidy собраны в файле `.clang-tidy` в корневом каталоге Doris. Редактируя этот файл, можно включать и отключать отдельные проверки.

## Настройка Clangd в VSCode {#configuring-clangd-in-vscode}

<!-- Knowledge type: Tool usage -->

### Порядок действий {#steps}

1. Установите плагин `clangd`.
2. Перед использованием один раз скомпилируйте `be(RELEASE)` и `be-ut(ASAN)`, чтобы создать соответствующие файлы `compile_commands.json`.
3. Отредактируйте `settings.json` или измените конфигурацию плагина непосредственно в разделе «Настройки».

### Пример конфигурации {#configuration-example}

```json
{
    "clangd.path": "ldb_toolchain/bin/clangd",
    "clangd.arguments": [
        "--background-index",
        "--clang-tidy",
        "--compile-commands-dir=doris/be/build_Release/",
        "--completion-style=detailed",
        "-j=5",
        "--all-scopes-completion",
        "--pch-storage=memory",
        "--pretty",
        "--query-driver=ldb_toolchain/bin/*"
    ],
    "clangd.trace": "output/clangd-server.log"
}
```

### Основные параметры {#key-parameters}

| Параметр | Описание |
|-----------|-------------|
| `clangd.path` | Путь к исполняемому файлу Clangd |
| `--background-index` | Индексирует весь проект в фоновом режиме, чтобы ускорить поиск символов |
| `--clang-tidy` | Включает статические проверки Clang-Tidy |
| `--compile-commands-dir` | Указывает каталог, содержащий `compile_commands.json` |
| `--completion-style=detailed` | Показывает подробную информацию при автодополнении |
| `-j=5` | Количество параллельных задач, которые Clangd использует для анализа файлов |
| `--query-driver` | Путь к компилятору, используемый для поиска системных заголовочных файлов |

## Часто задаваемые вопросы {#faq}

**Вопрос: что делать, если `clangd` сообщает об отсутствующем заголовочном файле или символе?**

Убедитесь, что BE был скомпилирован хотя бы один раз для создания `compile_commands.json` и что `--compile-commands-dir` указывает на правильный каталог.
