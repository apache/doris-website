---
title: Правила форматирования кода Java
language: ru
description: "Правила форматирования кода Java в Apache Doris: порядок импорта, Checkstyle и настройка IDE."
keywords:
    - Apache Doris
    - Форматирование кода Java
    - Checkstyle
    - IDEA
    - VS Code
    - Порядок импорта
    - formatter-check
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

# Правила форматирования кода Java {#java-code-formatting-specification}

<!-- Knowledge type: Code specification -->
<!-- Applicable scenarios: FE development / Pull Request submission -->

Код Apache Doris на Java (преимущественно модуль FE) обычно форматируется автоматически средствами IDE. В этом документе приведены общие правила форматирования и способы настройки различных IDE. В конвейере CI форматирование кода проверяется с помощью `formatter-check`.

## Правила порядка импорта {#import-order-rules}

<!-- Knowledge type: Code specification -->

Операторы импорта должны быть расположены в следующем порядке групп, разделённых одной пустой строкой:

```text
org.apache.doris
<blank line>
third party package
<blank line>
standard java package
<blank line>
```

Дополнительные правила:

| Правило | Описание |
|------|-------------|
| Запрет на `import *` | Каждый класс необходимо импортировать явно |
| Запрет на `import static` | Статический импорт не допускается |

## Проверка Checkstyle при компиляции {#checkstyle-check-at-compile-time}

При компиляции с помощью `maven` по умолчанию выполняется проверка `Checkstyle`, что немного замедляет компиляцию. Чтобы пропустить проверку, используйте следующую команду:

```bash
mvn clean install -DskipTests -Dcheckstyle.skip
```

В CI проверка форматирования кода через `formatter-check` обязательна. Пропускать локальную проверку следует только при разработке и отладке. Перед отправкой PR убедитесь, что форматирование соответствует требованиям.

## Настройка плагина Checkstyle {#checkstyle-plugin-configuration}

### Настройка Checkstyle в IDEA {#configure-checkstyle-in-idea}

1. Установите плагин `Checkstyle-IDEA` в настройках.
2. Перейдите в `Tools -> Checkstyle`, найдите `Configuration File` и нажмите `Use a local Checkstyle file`.
3. Выберите файл `fe/check/checkstyle/checkstyle.xml` в корневом каталоге проекта.
4. Убедитесь, что используется `Checkstyle` версии 9.3 или выше (рекомендуется последняя версия).

![](/images/idea-checkstyle-version.png)

После настройки можно использовать плагин `Checkstyle-IDEA` для проверки кода с помощью Checkstyle:

![](/images/idea-checkstyle-plugin-cn.png)

### Настройка Checkstyle в VS Code {#configure-checkstyle-in-vs-code}

1. Установите плагин `Checkstyle for Java`.
2. Завершите настройку, следуя инструкциям и анимациям в [официальной документации по проверке кода Java](https://code.visualstudio.com/docs/java/java-linting).

## Форматирование кода в IDEA {#idea-code-formatting}

### Настройка автоматического форматирования {#auto-formatting-configuration}

Рекомендуется использовать функцию автоматического форматирования IDEA:

1. Перейдите в `Preferences -> Editor -> Code Style -> Java`.
2. Нажмите значок настройки, выберите `Import Scheme`, затем `IntelliJ IDEA code style XML`.
3. Выберите файл `build-support/IntelliJ-code-format.xml` в корневом каталоге проекта.

### Изменение порядка объявлений в коде {#rearrange-code}

Checkstyle проверяет порядок объявлений в коде в соответствии с разделом [Объявления классов и интерфейсов](https://www.oracle.com/java/technologies/javase/codeconventions-fileorganization.html#1852).

После импорта указанного выше файла `build-support/IntelliJ-code-format.xml` используйте `Code/Rearrange Code` для автоматического упорядочивания объявлений:

![](/images/idea-rearrange-code.png)

## Автоматическое удаление неиспользуемых импортов {#automatically-remove-unused-imports}

| Цель | Действие |
|---------|--------|
| Только удалить неиспользуемые импорты | Сочетание клавиш по умолчанию: `CTRL + ALT + O` |
| Автоматически удалять и упорядочивать импорты при сохранении | Установите флажок `Preferences -> Editor -> General -> Auto Import -> Optimize Imports on the Fly` |

## Часто задаваемые вопросы {#faq}

**Вопрос: Как устранить ошибку `formatter-check` в CI?**

Запустите проверку локально с помощью IDEA или плагина Checkstyle. Убедитесь, что порядок импорта, правила именования и порядок объявлений соответствуют требованиям в `fe/check/checkstyle/checkstyle.xml`, затем отправьте изменения повторно.

**Вопрос: Влияет ли пропуск локальной проверки Checkstyle на слияние PR?**

Да. В CI по-прежнему запускается `formatter-check`. Локальный параметр `-Dcheckstyle.skip` предназначен только для ускорения сборок при разработке. Итоговый код должен пройти проверку Checkstyle.
