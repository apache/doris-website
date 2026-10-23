---
title: Pull Request
language: ru
description: "Полный процесс отправки Pull Request в Apache Doris: создание форка и ветки, разрешение конфликтов и отправка PR."
keywords:
    - Apache Doris
    - Pull Request
    - Отправка PR
    - Создание форка репозитория
    - git rebase
    - Разрешение конфликтов
    - Сообщение коммита
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
<!-- Applicable scenario: First-time PR submission / Forking the repository / Resolving rebase conflicts -->

GitHub предоставляет удобный механизм совместной работы — [Pull Request (PR)](https://help.github.com/articles/about-pull-requests/). В этом документе описан полный процесс отправки PR в проект Apache Doris.

Процесс включает следующие шаги:

1. Создайте форк репозитория `apache/doris` в своей учётной записи.
2. Настройте локальный git и создайте коммит с изменениями.
3. Создайте PR на GitHub.
4. Если возникнут конфликты, разрешите их с помощью rebase.

## 1. Создание форка репозитория {#1-fork-the-repository}

Перейдите на [страницу GitHub](https://github.com/apache/doris) репозитория `apache/doris` и нажмите кнопку `Fork` в правом верхнем углу, чтобы создать форк.

![Форк](/images/fork-repo.png)

## 2. Настройка Git и создание коммита с изменениями {#2-configure-git-and-commit-changes}

### (1) Клонируйте код на локальный компьютер {#1-clone-the-code-locally}

```bash
git clone https://github.com/<your_github_name>/doris.git
cd doris
git submodule update --init --recursive
```

Примечание: замените `<your_github_name>` своим именем пользователя на GitHub.

После клонирования `origin` по умолчанию указывает на ваш удалённый форк на GitHub.

### (2) Добавьте apache/doris как удалённый репозиторий upstream {#2-add-apachedoris-as-the-upstream-remote}

```bash
cd doris
git remote add upstream https://github.com/apache/doris.git
```

### (3) Проверьте настройки удалённых репозиториев {#3-check-the-remote-repository-settings}

```bash
git remote -v
origin    https://github.com/<your_github_name>/doris.git (fetch)
origin    https://github.com/<your_github_name>/doris.git (push)
upstream  https://github.com/apache/doris.git (fetch)
upstream  https://github.com/apache/doris.git (push)
```

### (4) Создайте новую ветку для своих изменений {#4-create-a-new-branch-for-your-changes}

```bash
git checkout -b <your_branch_name>
```

Примечание: `<your_branch_name>` — выбранное вами имя ветки.

После создания ветки можно вносить в неё изменения кода.

### (5) Отправьте код в удалённую ветку {#5-push-the-code-to-the-remote-branch}

```bash
git commit -a -m "<your_commit_message>"
git push origin <your_branch_name>
```

Подробнее об использовании git см. в официальной документации GitHub: [Использование git](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories).

## 3. Создание PR {#3-create-a-pr}

### (1) Откройте новый PR {#1-open-a-new-pr}

В браузере перейдите на свою страницу GitHub, выберите ветку, которую вы отправили (`<your_branch_name>`), и нажмите кнопку `Compare & pull request`, чтобы создать PR.

![Новый PR](/images/new-pr.png)

### (2) Подготовьте ветку {#2-prepare-the-branch}

Теперь появится кнопка `Create pull request`. Если она не появилась, проверьте, правильно ли выбрана ветка. Также можно нажать `compare across forks`, чтобы заново выбрать репозиторий и ветку.

![Создание PR](/images/create-pr.png)

### (3) Заполните сообщение коммита {#3-fill-in-the-commit-message}

Укажите краткое описание коммита и подробности, затем нажмите `Create pull request`, чтобы завершить создание.

<!-- Knowledge type: Rules and conventions -->

Основные правила написания сообщения коммита:

| Параметр | Требование |
|------|------|
| Форма | На английском языке, в форме «глагол + дополнение», в виде повелительного предложения |
| Время | **Не** используйте глаголы в прошедшем времени |
| Заголовок и основной текст | Оба обязательны и разделяются пустой строкой (на странице PR в GitHub заполните соответствующие поля по отдельности) |
| Длина заголовка | Не более **50** символов |
| Длина строки основного текста | Не более **72** символов в строке; более длинные строки переносите вручную |
| Содержание основного текста | Объясните, «что было сделано, почему и как» |
| Первая буква заголовка | Заглавная |
| Конец заголовка | Без точки |
| Связанная задача | Укажите связанную задачу в основном тексте (например, `#233`) |

Подробнее см. на странице <https://chris.beams.io/posts/git-commit>.

![Создание PR](/images/create-pr.png)

### (4) Завершите создание PR {#4-finish-creating-the-pr}

После создания PR вы увидите, что он ожидает проверки сопровождающими проекта Doris. Можно дождаться проверки и слияния или напрямую связаться с сообществом, чтобы узнать о ходе рассмотрения.

![Создание PR](/images/create-pr3.png)

Теперь PR создан. Подробнее о PR см. в разделе [Совместная работа с задачами и Pull Request](https://help.github.com/categories/collaborating-with-issues-and-pull-requests/).

### (5) Дождитесь успешного прохождения проверок CI {#5-wait-for-ci-checks-to-pass}

После создания PR автоматически запускается конвейер CI. В списке проверок внизу страницы PR:

- Проверки с пометкой **Обязательные** **должны все пройти успешно** (стать зелёными), прежде чем PR можно будет объединить.
- Остальные, необязательные проверки носят справочный характер и не блокируют слияние.

Какие именно проверки обязательны, определяется текущими отметками на странице PR. Если проверка завершилась с ошибкой, нажмите на неё, чтобы открыть журнал GitHub Actions и найти причину. После исправления выполните `git push`, чтобы запустить проверки повторно.

## 4. Разрешение конфликтов {#4-resolving-conflicts}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Git conflicts on a PR / Branch is behind master -->

Конфликты кода при отправке PR обычно возникают, когда несколько человек редактируют один и тот же файл. Чтобы разрешить их, выполните следующие шаги:

### (1) Переключитесь на основную ветку {#1-switch-to-the-main-branch}

```bash
git checkout master
```

### (2) Синхронизируйте локальную основную ветку с удалённой {#2-sync-the-remote-main-branch-to-local}

```bash
git pull upstream master
```

### (3) Вернитесь в ветку разработки (предположим, она называется fix) {#3-switch-back-to-the-development-branch-assume-the-branch-is-named-fix}

```bash
git checkout fix
```

### (4) Выполните rebase {#4-run-rebase}

```bash
git rebase -i master
```

Откроется файл с историей коммитов. В большинстве случаев достаточно сохранить его без изменений. Затем Git укажет файлы с конфликтами. Откройте каждый такой файл и разрешите конфликт. После обработки всех конфликтующих файлов выполните:

```bash
git add .
git rebase --continue
```

Повторяйте эти действия, пока на экране не появится сообщение об успешном завершении rebase, например *rebase successful*. Затем принудительно отправьте обновления в ветку PR:

```bash
git push -f origin fix
```

## 5. Полный пример {#5-complete-example}

<!-- Knowledge type: Worked example -->

Ниже приведён полный пример: от синхронизации кода до отправки ветки.

### (1) Получите последнюю версию кода, находясь в локальной ветке с уже настроенным upstream {#1-fetch-the-latest-code-on-a-local-branch-with-upstream-already-configured}

```bash
$ git branch
* master

$ git fetch upstream
remote: Counting objects: 195, done.
remote: Compressing objects: 100% (68/68), done.
remote: Total 141 (delta 75), reused 108 (delta 48)
Receiving objects: 100% (141/141), 58.28 KiB, done.
Resolving deltas: 100% (75/75), completed with 43 local objects.
From https://github.com/apache/doris
   9c36200..0c4edc2  master     -> upstream/master
```

### (2) Выполните rebase {#2-run-rebase}

```bash
$ git rebase upstream/master
First, rewinding head to replay your work on top of it...
Fast-forwarded master to upstream/master.
```

### (3) Проверьте, остались ли коммиты других участников, ещё не синхронизированные с вашим репозиторием {#3-check-whether-others-commits-have-not-been-synced-to-your-own-repo}

```bash
$ git status
# On branch master
# Your branch is ahead of 'origin/master' by 8 commits.
#
# Untracked files:
#   (use "git add <file>..." to include in what will be committed)
#
#       custom_env.sh
nothing added to commit but untracked files present (use "git add" to track)
```

### (4) Синхронизируйте коммиты других участников со своим репозиторием {#4-sync-others-commits-to-your-own-repo}

```bash
$ git push origin master
Counting objects: 195, done.
Delta compression using up to 32 threads.
Compressing objects: 100% (41/41), done.
Writing objects: 100% (141/141), 56.66 KiB, done.
Total 141 (delta 76), reused 140 (delta 75)
remote: Resolving deltas: 100% (76/76), completed with 44 local objects.
To https://lide-reed:xxxx@github.com/lide-reed/doris.git
   9c36200..0c4edc2  master -> master
```

### (5) Создайте новую ветку и начните разработку {#5-create-a-new-branch-and-start-development}

```bash
$ git checkout -b my_branch
Switched to a new branch 'my_branch'

$ git branch
  master
* my_branch
```

### (6) Добавьте изменения в индекс после редактирования кода {#6-stage-the-changes-after-editing-the-code}

```bash
$ git add -u
```

### (7) Укажите сообщение и создайте коммит в локальной ветке {#7-fill-in-the-message-and-commit-to-the-local-branch}

```bash
$ git commit -m "Fix a typo"
[my_branch 55e0ba2] Fix a typo
 1 files changed, 2 insertions(+), 2 deletions(-)
```

### (8) Отправьте ветку в свой репозиторий на GitHub {#8-push-the-branch-to-your-own-repo-on-github}

```bash
$ git push origin my_branch
Counting objects: 11, done.
Delta compression using up to 32 threads.
Compressing objects: 100% (6/6), done.
Writing objects: 100% (6/6), 534 bytes, done.
Total 6 (delta 4), reused 0 (delta 0)
remote: Resolving deltas: 100% (4/4), completed with 4 local objects.
remote:
remote: Create a pull request for 'my_branch' on GitHub by visiting:
remote:      https://github.com/lide-reed/doris/pull/new/my_branch
remote:
To https://lide-reed:xxxx@github.com/lide-reed/doris.git
 * [new branch]      my_branch -> my_branch
```

Теперь можно создать PR, следуя описанным выше шагам.
