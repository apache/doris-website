---
title: Компиляция Apache Doris в Windows (WSL2)
language: ru
description: Порядок компиляции Apache Doris в Windows с помощью WSL2.
keywords:
    - компиляция в Windows
    - WSL2
    - WSL
    - Apache Doris
    - компиляция из исходного кода
    - подсистема Linux
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

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Windows development machine / WSL2 compilation -->

В этом документе описана компиляция исходного кода Apache Doris на платформе Windows. Doris не поддерживает нативную компиляцию непосредственно в Windows, но с помощью WSL2 (Windows Subsystem for Linux 2) можно запустить подсистему Linux в Windows и выполнить сборку по инструкции для Linux.

:::tip
Способ с использованием Windows + WSL2 в настоящее время не поддерживает компиляцию и развёртывание для режима разделения хранения и вычислений.
:::

## Для кого предназначено, преимущества и недостатки {#target-users-pros-and-cons}

| Критерий | Описание |
| ---- | ---- |
| Целевая аудитория | Разработчики, которые работают на компьютере с Windows и которым необходимо компилировать и отлаживать Doris |
| Преимущества | Не требуется система с двойной загрузкой или дополнительный сервер Linux; компиляцию можно выполнять локально |
| Недостатки | Требуется Windows 10 2004+ или Windows 11, а также определённый объём дискового пространства |

## 1. Требования к среде {#1-environment-requirements}

<!-- Knowledge type: Hardware requirements -->

| Параметр | Требование |
| ---- | ---- |
| Версия Windows | Windows 10 2004 (сборка 19041) или более поздняя либо Windows 11 |
| Версия WSL | WSL2 (рекомендуется дистрибутив Ubuntu 22.04 или Ubuntu 24.04) |
| Дисковое пространство | Рекомендуется не менее 50 ГБ свободного места (для исходного кода, сторонних библиотек и артефактов сборки) |

## 2. Порядок компиляции {#2-compilation-steps}

### 2.1 Установка WSL2 {#21-install-wsl2}

Ознакомьтесь с официальным [руководством Microsoft по установке WSL](https://learn.microsoft.com/en-us/windows/wsl/install) и выполните следующую команду в PowerShell:

```powershell
wsl --install
```

После завершения установки перезагрузите систему и следуйте подсказкам для первоначальной настройки подсистемы Linux (задайте имя пользователя и пароль).

### 2.2 Компиляция Doris в WSL2 {#22-compile-doris-in-wsl2}

Войдите в подсистему Linux, запущенную с помощью WSL2, и выберите один из следующих способов компиляции:

- [Компиляция с помощью LDB Toolchain (рекомендуется)](./compilation-with-ldb-toolchain)
- [Компиляция с помощью образа Docker (рекомендуется)](./compilation-with-docker)
- [Компиляция непосредственно в Linux](./compilation-linux)

## 3. Примечания {#3-notes}

- **Диск для хранения данных**: по умолчанию данные дистрибутива WSL2 хранятся на диске C. Если на диске C мало свободного места, перенесите данные WSL2 на другой диск перед установкой, чтобы не заполнить системный диск. Для переноса см. команды [экспорта и импорта WSL](https://learn.microsoft.com/en-us/windows/wsl/basic-commands#export-a-distribution-to-a-tar-file).
- **Ограничения ресурсов**: по умолчанию WSL2 использует оперативную память хоста. Если процесс компиляции часто принудительно завершается из-за нехватки памяти, увеличьте ограничения `memory` и `processors` в `%UserProfile%\.wslconfig`.
- **Файловая система**: разместите исходный код в файловой системе ext4 внутри WSL2 (например, в `~/doris`), а не по подключённому пути `/mnt/c/...`. Доступ между файловыми системами сильно замедляет компиляцию.

## Часто задаваемые вопросы {#faq}

### Вопрос 1: установка WSL2 завершается ошибкой «Необходимо обновить Windows»? {#q1-wsl2-installation-fails-with-windows-needs-to-be-updated}

Обновите Windows до версии 10 2004 (сборка 19041) или более поздней либо сразу используйте Windows 11.

### Вопрос 2: компиляция в WSL2 выполняется очень медленно? {#q2-wsl2-compilation-is-extremely-slow}

Убедитесь, что исходный код находится во внутренней файловой системе WSL2 (например, в `~/doris`), а не в `/mnt/c/...`. Доступ между файловыми системами значительно замедляет компиляцию.

### Вопрос 3: WSL2 занимает всю оперативную память хоста? {#q3-wsl2-uses-up-all-the-host-memory}

Ограничьте использование ресурсов WSL2 в `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=12GB
processors=8
```

После изменения файла выполните `wsl --shutdown`, чтобы перезапустить WSL2 и применить изменения.

## Связанные документы {#related-documents}

- [Компиляция с помощью LDB Toolchain](./compilation-with-ldb-toolchain)
- [Компиляция с помощью образа Docker](./compilation-with-docker)
- [Компиляция непосредственно в Linux](./compilation-linux)
