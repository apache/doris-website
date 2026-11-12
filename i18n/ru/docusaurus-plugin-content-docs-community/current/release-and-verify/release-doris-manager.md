---
title: Выпуск Doris Manager
language: ru
description: "Процесс выпуска Apache Doris Manager: управление ветками, создание тегов, упаковка и подписание, загрузка в SVN, голосование сообщества и голосование IPMC."
keywords:
    - Apache Doris
    - Doris Manager
    - Процесс выпуска
    - Голосование сообщества
    - Голосование IPMC
    - Подписание с помощью GPG
    - Загрузка в SVN
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

# Выпуск Doris Manager {#release-doris-manager}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / Doris Manager release -->

Кодовая база Doris Manager поддерживается отдельно от основной кодовой базы Doris, в репозитории [apache/doris-manager](https://github.com/apache/doris-manager). В этом документе описан полный процесс выпуска Doris Manager.

## Обзор процесса выпуска {#release-process-overview}

| Этап | Шаг | Цель |
|------|------|------|
| Подготовка | 1. Подготовка к выпуску | Подготовить ключи GPG, доступ к SVN и выполнить другие предварительные требования |
| Подготовка | 2. Подготовка ветки | Создать ветку выпуска и обеспечить стабильную работу функций |
| Подготовка | 3. Проверка задач | Закрыть завершённые задачи и отложить незавершённые |
| Подготовка | 4. Включение необходимых патчей | Оценить и включить важные патчи |
| Проверка | 5. Проверка ветки | Проверить стабильность и сборку |
| Голосование | 6. Создание тега, упаковка, подписание и загрузка | Подготовить пакет RC и загрузить его в SVN |
| Голосование | 7. Голосование в dev@doris | Провести голосование сообщества |
| Голосование | 8. Голосование IPMC | Провести голосование Incubator PMC |
| Завершение | 9. Завершение выпуска | Архивировать, опубликовать и объявить о выпуске |

## 1. Подготовка к выпуску {#1-prepare-for-release}

Выполните предварительные действия, описанные в документе [Подготовка к выпуску](./release-prepare).

## 2. Подготовка ветки {#2-prepare-the-branch}

Перед выпуском создайте новую ветку:

```shell
git checkout -b branch-1.0.0
```

После создания ветки проведите тщательное тестирование и убедитесь, что:

- Функции работают должным образом.
- Количество ошибок сокращается.
- Все существенные ошибки исправлены.

Во время тестирования дождитесь отзывов сообщества, чтобы определить, нужно ли включить необходимые патчи. Если нужно, перенесите их в ветку выпуска с помощью cherry-pick.

## 3. Проверка задач {#3-clean-up-issues}

Просмотрите все задачи, относящиеся к этому выпуску:

- Закройте завершённые задачи.
- Перенесите задачи, которые не удаётся завершить, на более поздний выпуск.

## 4. Включение необходимых патчей {#4-merge-required-patches}

В ожидании выпуска может потребоваться включить важные патчи. Если сообщество сообщает о существенной ошибке, исправление которой должно войти в выпуск, ответственный за выпуск оценивает исправление и включает патч в ветку выпуска.

## 5. Проверка ветки {#5-verify-the-branch}

### 5.1 Тестирование стабильности {#51-stability-testing}

Передайте подготовленную ветку команде QA для тестирования стабильности. Если во время тестирования обнаружатся проблемы, требующие исправления, включите соответствующие PR в ветку выпуска, как только они будут готовы.

Переходите к выпуску только после того, как вся ветка станет стабильной.

### 5.2 Проверка сборки {#52-build-verification}

Следуя документации по сборке, выполните сборку из исходного кода и убедитесь, что он компилируется без ошибок.

## 6. Голосование сообщества по выпуску {#6-community-release-vote-process}

### 6.1 Создание тега {#61-create-the-tag}

Когда ветка станет стабильной, создайте на ней тег. Например:

```shell
git checkout branch-1.0.0
git tag -a 1.0.0-rc01 -m "doris manager 1.0.0 release candidate 01"
git push origin 1.0.0-rc01
```

Ожидаемый вывод:

```text
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris-manager.git
 * [new tag]         1.0.0-rc01 -> 1.0.0-rc01
```

Выполните `git tag`, чтобы вывести список локальных тегов.

### 6.2 Упаковка, подписание и загрузка {#62-package-sign-and-upload}

Для выполнения следующих шагов необходимо войти непосредственно под нужной учётной записью через терминал, например SecureCRT. **Не переключайтесь на неё с помощью `su - user` или `ssh`**, иначе запрос пароля может не отображаться и команда завершится с ошибкой.

#### 6.2.1 Упаковка и подписание {#621-package-and-sign}

```shell
git archive --format=tar 1.0.0-rc01 --prefix=apache-doris-incubating-manager-src-1.0.0-rc01/ | gzip > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc --detach-sign apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg --verify apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

sha512sum apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512

sha512sum --check apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

#### 6.2.2 Загрузка в SVN {#622-upload-to-svn}

Получите рабочую копию репозитория SVN:

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

Разместите созданные выше файлы в SVN по следующему пути:

```text
./doris/
├── doris-manager
│   └── 1.0.0
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc
│       └── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

Загрузите эти файлы:

```shell
svn add 1.0.0-rc01
svn commit -m "Add doris manager 1.0.0-rc01"
```

### 6.3 Отправка письма для голосования на dev@doris.apache.org {#63-send-a-vote-email-to-devdorisapacheorg}

Тема письма:

```text
[VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

Шаблон текста письма:

```text
Hi All,

This is a call for vote to release Doris Manager v1.0.0 for Apache Doris(Incubating).

- apache-doris-incubating-manager-src-1.0.0-rc01

The release node:



The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

Keys to verify the Release Candidate:
https://downloads.apache.org/doris/KEYS

Look at here for how to verify this release candidate:
http://doris.apache.org/community/release-and-verify/release-verify.html

Vote thread at dev@doris: [1]

The vote will be open for at least 72 hours or until necessary number of votes are reached.

Please vote accordingly:

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

[1] vote thread in dev@doris


Brs,
xxxx
------------------
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

### 6.4 Отправка письма с результатами после успешного голосования {#64-after-the-vote-passes-send-a-result-email}

Тема письма:

```text
[Result][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

Шаблон текста письма:

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 jiafeng Zhang
+1 xxx
+1 EmmyMiao87
+1 Mingyu Chen

Best Regards,
xxx
```

## 7. Голосование IPMC {#7-ipmc-vote}

После успешного голосования в списке рассылки dev отправьте письмо в список рассылки `general@incubator.apache.org`, чтобы начать голосование IPMC.

Шаблон текста письма:

```text
Hi all,

Please review and vote on Apache Doris Manager 1.0.0-incubating-rc01 release.

Doris manager is a platform for automatic installation, deployment and management of Doris groups

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 1.0.0-rc01, available here:
https://github.com/apache/doris-manager/releases/tag/1.0.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

This has been signed with PGP key 33DBF2E0, corresponding to lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

To verify and build, you can refer to following instruction:

Firstly, you must be install and start docker service, and then you could build Doris as following steps:

$ wget https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
$ cd apache-doris-incubating-manager-src-1.0.0-rc01
$ sh build.sh

Best Regards,
xxx

----
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

Найдите ссылку на обсуждение в архиве списка рассылки:

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 7.1 Отправка письма с результатами на general@incubator.apache.org {#71-send-the-result-email-to-generalincubatorapacheorg}

Тема письма:

```text
[RESULT][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

Шаблон текста письма:

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris Manager 1.0.0-incubating-rc01 is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Willem Jiang
+1 Justin Mclean
+1 ShaoFeng Shi
+1 Makoto Yui

The vote thread:
https://lists.apache.org/thread.html/da05fdd8d84e35de527f27200b5690d7811a1e97d419d1ea66562130@%3Cgeneral.incubator.apache.org%3E

Best Regards,
xxx
```

## 8. Завершение выпуска {#8-complete-the-release}

Выполните все заключительные действия, описанные в документе [Завершение выпуска](./release-complete).

## Часто задаваемые вопросы {#faq}

### Вопрос 1: Почему упаковку и подписание нельзя выполнить через `ssh` или `su - user`? {#q1-why-can-the-packaging-and-signing-step-not-be-done-through-ssh-or-su---user}

Терминал, в который вошли через `ssh` или `su -`, не может корректно отобразить запрос пароля GPG, из-за чего команда подписания завершается с ошибкой. Войдите непосредственно под нужной учётной записью через терминал, например SecureCRT.

### Вопрос 2: `gpg --verify` сообщает об ошибке `gpg verify failed` или `BAD signature` {#q2-gpg---verify-reports-gpg-verify-failed-or-bad-signature}

Возможные причины:

- Открытый ключ не импортирован: сначала выполните `gpg --import KEYS`.
- Файл подписи не соответствует архиву с исходным кодом: убедитесь, что файлы `.asc` и `.tar.gz` относятся к одной и той же сборке.

### Вопрос 3: `sha512sum --check` сообщает об ошибке `shasum mismatch` {#q3-sha512sum---check-reports-shasum-mismatch}

Архив с исходным кодом мог быть повреждён или перезаписан при передаче. Скачайте архив заново либо повторно создайте файл контрольной суммы `.sha512` и выполните проверку ещё раз.
