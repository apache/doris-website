---
title: Проверка релиза Apache
language: ru
description: "Порядок проверки релиза Apache Doris: скачивание, проверка подписи, проверка лицензий исходного кода, проверка сборки и голосование."
keywords:
    - Apache Doris
    - проверка релиза
    - подпись GPG
    - контрольная сумма sha512
    - проверка LICENSE
    - skywalking-eyes
    - голосование по релизу
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

# Проверка релиза Apache {#verify-an-apache-release}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / verification and voting -->

Эта процедура проверки применяется в следующих случаях:

- Проверка кандидата на выпуск (Release Candidate, RC) в ходе голосования по релизу.
- Проверка целостности уже опубликованного релиза.

В этом документе в качестве примера используется Doris Core. Для других компонентов замените названия соответствующим образом.

## Контрольный список проверки {#verification-checklist}

Все 7 перечисленных ниже проверок должны завершиться успешно, прежде чем вы проголосуете +1:

| № | Что проверить | Способ проверки |
|------|--------|----------|
| 1 | Ссылка для скачивания является официальной | Ссылка ведёт на `dist.apache.org` или `downloads.apache.org` |
| 2 | Контрольная сумма и подпись PGP корректны | `gpg --verify` + `sha512sum --check` |
| 3 | Код соответствует текущей версии релиза | Сравните исходный код с тегом Git |
| 4 | Файлы LICENSE и NOTICE корректны | Проверка вручную |
| 5 | Все файлы содержат обязательный лицензионный заголовок | `apache/skywalking-eyes` |
| 6 | Архив с исходным кодом не содержит результатов компиляции | Вручную проверьте `target/`, `build/` и двоичные файлы |
| 7 | Сборка завершается успешно | Соберите проект, следуя документации по сборке |

## 1. Скачайте архив с исходным кодом, файл подписи, файл контрольной суммы и KEYS {#1-download-the-source-package-signature-file-checksum-file-and-keys}

Скачайте все связанные файлы. В примере используется `a.b.c-incubating`:

```shell
wget https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.sha512

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.asc

wget https://downloads.apache.org/incubator/doris/KEYS
```

> Для проверки в рамках голосования скачайте файлы с адреса SVN, указанного в письме о голосовании.

## 2. Проверьте подпись и контрольную сумму {#2-check-the-signature-and-checksum}

### 2.1 Установите GnuPG {#21-install-gnupg}

Рекомендуется использовать GnuPG. Установите его одной из следующих команд:

| Система | Команда установки |
|------|----------|
| CentOS / RHEL | `yum install gnupg` |
| Ubuntu / Debian | `apt-get install gnupg` |

### 2.2 Импортируйте KEYS и выполните проверку {#22-import-keys-and-verify}

В следующем примере используется релиз ядра Doris. Для других релизов процедура аналогична:

```shell
gpg --import KEYS
gpg --verify apache-doris-a.b.c-incubating-src.tar.gz.asc apache-doris-a.b.c-incubating-src.tar.gz
sha512sum --check apache-doris-a.b.c-incubating-src.tar.gz.sha512
```

> Примечание: если `gpg --import` завершается ошибкой `no valid user IDs`, возможно, версия GPG несовместима. Обновите её до 2.2.x или более поздней.

## 3. Проверьте лицензионные заголовки исходных файлов {#3-verify-source-license-headers}

Для проверки лицензионных заголовков используйте [skywalking-eyes](https://github.com/apache/skywalking-eyes).

Перейдите в корневой каталог исходного кода и выполните:

```shell
sudo docker run -it --rm -v $(pwd):/github/workspace apache/skywalking-eyes header check
```

Пример вывода:

```text
INFO GITHUB_TOKEN is not set, license-eye won't comment on the pull request
INFO Loading configuraftion from file: .licenserc.yaml
INFO Totally checked 5611 files, valid: 3926, invalid: 0, ignored: 1685, fixed: 0
```

Если значение `invalid` равно 0, проверка пройдена.

## 4. Проверьте сборку {#4-verify-compilation}

Обратитесь к документации по сборке соответствующего компонента:

- Сборка ядра Doris: см. [документацию по сборке](/community/source-install/compilation-with-docker).
- Сборка Flink Doris Connector: см. [документацию Flink Doris Connector](/docs/dev/connection-integration/data-integration/flink-doris-connector).
- Сборка Spark Doris Connector: см. [документацию Spark Doris Connector](/docs/dev/connection-integration/data-integration/spark-doris-connector).

## 5. Голосование {#5-voting}

Подробнее о голосовании см. в описании [процедуры голосования ASF](https://www.apache.org/foundation/voting.html).

После проверки можно ответить на письмо о голосовании в списке рассылки `dev@doris` по следующему шаблону:

```text
+1 (binding) or +1 (non-binding)

My Apache ID(optional): morningman

I checked:

[x] The download link is legal.
[x] The PGP signature are valid.
[x] The source code matches the current release version.
[x] The LICENSE and NOTICE files are correct.
[x] All files carry the necessary protocol header.
[x] The compiled content is not included in the source package.
[x] The compilation can be executed smoothly.

Other comments...
```

### 5.1 Основные правила голосования {#51-key-voting-rules}

| Правило | Описание |
|------|------|
| Решающий голос | Голоса членов PMC имеют решающую силу. Остальные голоса носят рекомендательный характер |
| Условие принятия | Одобрение большинством: не менее трёх голосов +1 от членов PMC, причём голосов +1 должно быть больше, чем -1 |
| Продолжительность голосования | Голосование открыто не менее 72 часов |
| Отсутствие автоматического +1 | Ни Release Manager, ни кто-либо из голосующих не получает +1 автоматически. Учитываются только явно поданные голоса |

Голоса членов PMC имеют решающую силу, но сообщество призывает всех участников голосовать, даже если их голоса носят лишь рекомендательный характер.

Release Manager должен проверить действительность каждого голоса. По списку участников PMC можно проверить соответствие адресов электронной почты. Рекомендации:

- При голосовании используйте адрес электронной почты Apache, чтобы голос был действительным.
- Укажите свой Apache ID при голосовании: это упростит подсчёт голосов для Release Manager.

Как правило, если кто-то обнаруживает серьёзную проблему, сообщество отменяет голосование по релизу. Однако в большинстве случаев окончательное решение принимает Release Manager. Конкретная процедура может различаться в зависимости от проекта, но **правило «минимальный кворум из трёх голосов +1» действует во всех проектах**.

Примечание: **Ни Release Manager, ни любой другой участник голосования ASF не получает +1 автоматически. Учитываются только явно поданные голоса.** Также рекомендуется, чтобы Release Manager проголосовал по релизу.

## Частые вопросы / Устранение неполадок {#faq--troubleshooting}

### Q1: `gpg --verify` сообщает об ошибке `gpg verify failed` или `BAD signature` {#q1-gpg---verify-reports-gpg-verify-failed-or-bad-signature}

Возможные причины:

- Файл KEYS не импортирован. Сначала выполните `gpg --import KEYS`.
- Файл подписи не соответствует архиву с исходным кодом. Убедитесь, что файлы `.asc` и `.tar.gz` находятся в одном каталоге и имеют одинаковые номера версий.
- Архив с исходным кодом был повреждён при скачивании. Скачайте его заново и сравните с файлом `.sha512`.

### Q2: `gpg --import` сообщает об ошибке `no valid user IDs` {#q2-gpg---import-reports-no-valid-user-ids}

Версия GPG слишком старая. Обновите её до 2.2.x или более поздней:

```shell
# Ubuntu
apt-get install gnupg2

# CentOS
yum install gnupg2
```

### Q3: `sha512sum --check` сообщает об ошибке `shasum mismatch` или `FAILED` {#q3-sha512sum---check-reports-shasum-mismatch-or-failed}

Архив с исходным кодом повреждён или не соответствует файлу контрольной суммы. Скачайте архив с исходным кодом заново, убедитесь, что скачивание завершилось (сравните размеры файлов), и повторите проверку.

### Q4: skywalking-eyes сообщает об ошибке `LICENSE check failed` или `invalid > 0` {#q4-skywalking-eyes-reports-license-check-failed-or-invalid--0}

В некоторых файлах исходного кода отсутствуют лицензионные заголовки. Типичные причины:

- В недавно добавленном файле исходного кода отсутствует заголовок Apache License.
- Сторонний файл не указан в разделе `paths-ignore` файла `.licenserc.yaml`.

Release Manager должен исправить проблему и подготовить новый RC.

### Q5: Нужно ли голосовать -1, если сборка завершилась ошибкой? {#q5-should-i-vote--1-if-compilation-fails}

Если ошибка сборки вызвана самим архивом релиза (например, отсутствующими файлами или ошибками зависимостей), проголосуйте -1 и подробно укажите причины. Если ошибка связана с локальным окружением (например, отсутствующими зависимостями или неверной версией JDK), устраните проблемы в окружении, прежде чем принимать решение.
