---
title: Pull Request
language: ko
description: "Apache Doris에 Pull Request를 제출하는 전체 절차: 포크, 브랜치 생성, 충돌 해결, PR 제출."
keywords:
    - Apache Doris
    - Pull Request
    - PR 제출
    - 저장소 포크
    - git rebase
    - 충돌 해결
    - Commit Message
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

GitHub는 편리한 [Pull Request(PR)](https://help.github.com/articles/about-pull-requests/) 협업 기능을 제공합니다. 이 문서는 Apache Doris 프로젝트에 PR을 제출하는 전체 절차를 설명합니다.

전체 절차는 다음과 같습니다.

1. `apache/doris` 저장소를 자신의 계정으로 포크합니다.
2. 로컬 git을 설정하고 변경 사항을 커밋합니다.
3. GitHub에서 PR을 생성합니다.
4. 충돌이 있으면 rebase로 해결합니다.

## 1. 저장소 포크 {#1-fork-the-repository}

[GitHub 페이지](https://github.com/apache/doris)에서 `apache/doris` 저장소를 열고 오른쪽 위의 `Fork` 버튼을 클릭하여 포크를 완료합니다.

![포크](/images/fork-repo.png)

## 2. Git 설정 및 변경 사항 커밋 {#2-configure-git-and-commit-changes}

### (1) 로컬에 코드 복제 {#1-clone-the-code-locally}

```bash
git clone https://github.com/<your_github_name>/doris.git
cd doris
git submodule update --init --recursive
```

참고: `<your_github_name>`을 자신의 GitHub 사용자 이름으로 바꿉니다.

복제가 완료되면 기본적으로 `origin`은 GitHub에 있는 자신의 원격 포크 저장소를 가리킵니다.

### (2) apache/doris를 upstream 원격 저장소로 추가 {#2-add-apachedoris-as-the-upstream-remote}

```bash
cd doris
git remote add upstream https://github.com/apache/doris.git
```

### (3) 원격 저장소 설정 확인 {#3-check-the-remote-repository-settings}

```bash
git remote -v
origin    https://github.com/<your_github_name>/doris.git (fetch)
origin    https://github.com/<your_github_name>/doris.git (push)
upstream  https://github.com/apache/doris.git (fetch)
upstream  https://github.com/apache/doris.git (push)
```

### (4) 변경 사항을 위한 새 브랜치 생성 {#4-create-a-new-branch-for-your-changes}

```bash
git checkout -b <your_branch_name>
```

참고: `<your_branch_name>`은 원하는 브랜치 이름으로 지정합니다.

브랜치를 생성한 후 해당 브랜치에서 코드를 수정할 수 있습니다.

### (5) 원격 브랜치로 코드 푸시 {#5-push-the-code-to-the-remote-branch}

```bash
git commit -a -m "<your_commit_message>"
git push origin <your_branch_name>
```

git 사용법에 대한 자세한 내용은 GitHub 공식 문서 [git 사용하기](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories)를 참조하세요.

## 3. PR 생성 {#3-create-a-pr}

### (1) 새 PR 열기 {#1-open-a-new-pr}

브라우저에서 자신의 GitHub 페이지로 이동한 다음, 푸시한 브랜치(`<your_branch_name>`)로 전환하고 `Compare & pull request` 버튼을 클릭하여 PR을 생성합니다.

![새 PR](/images/new-pr.png)

### (2) 브랜치 준비 {#2-prepare-the-branch}

이제 `Create pull request` 버튼이 표시됩니다. 버튼이 표시되지 않으면 올바른 브랜치를 선택했는지 확인하세요. `compare across forks`를 클릭하여 저장소와 브랜치를 다시 선택할 수도 있습니다.

![PR 생성](/images/create-pr.png)

### (3) Commit Message 작성 {#3-fill-in-the-commit-message}

커밋 요약과 상세 내용을 작성한 후 `Create pull request`를 클릭하여 생성을 완료합니다.

<!-- Knowledge type: Rules and conventions -->

Commit Message 작성 시 유의 사항:

| 항목 | 요구 사항 |
|------|------|
| 문장 형식 | 영어의 "동사 + 목적어" 형식을 사용하고 명령문으로 작성 |
| 시제 | 동사에 과거형을 사용하지 **말 것** |
| 제목과 본문 | 둘 다 필수이며 빈 줄로 구분(GitHub PR 페이지에서는 두 필드에 각각 작성) |
| 제목 길이 | 최대 **50**자 |
| 본문 줄 길이 | 한 줄에 최대 **72**자. 초과하면 직접 줄바꿈 |
| 본문 내용 | "무엇을 했는지, 왜 했는지, 어떻게 했는지" 설명 |
| 제목 첫 글자 | 대문자로 표기 |
| 제목 끝 | 마침표를 붙이지 않음 |
| 관련 이슈 | 본문에서 관련 이슈를 참조(예: `#233`) |

자세한 내용은 <https://chris.beams.io/posts/git-commit>을 참조하세요.

![PR 생성](/images/create-pr.png)

### (4) PR 생성 완료 {#4-finish-creating-the-pr}

PR이 생성되면 Doris 프로젝트 메인테이너의 검토를 기다리는 상태임을 확인할 수 있습니다. 검토와 병합을 기다리거나 커뮤니티에 직접 연락하여 진행 상황을 확인할 수 있습니다.

![PR 생성](/images/create-pr3.png)

이제 PR이 생성되었습니다. PR에 대한 자세한 내용은 [이슈 및 Pull Request를 통한 협업](https://help.github.com/categories/collaborating-with-issues-and-pull-requests/)을 참조하세요.

### (5) CI 검사 통과 대기 {#5-wait-for-ci-checks-to-pass}

PR이 생성되면 CI 파이프라인이 자동으로 실행됩니다. PR 페이지 하단의 검사 목록에서 다음 사항을 확인하세요.

- **Required**로 표시된 검사는 PR을 병합하기 전에 **모두 통과해야 합니다**(녹색으로 표시).
- 그 외의 필수가 아닌 검사는 참고용이며 병합을 차단하지 않습니다.

어떤 검사가 Required인지는 PR 페이지에 현재 표시되는 내용을 기준으로 판단합니다. 검사가 실패하면 해당 검사를 클릭하여 GitHub Actions 로그에서 오류를 찾으세요. 오류를 수정한 후 `git push`를 실행하면 검사가 다시 실행됩니다.

## 4. 충돌 해결 {#4-resolving-conflicts}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Git conflicts on a PR / Branch is behind master -->

PR 제출 시 발생하는 코드 충돌은 대개 여러 사람이 같은 파일을 수정해서 발생합니다. 다음 단계에 따라 해결하세요.

### (1) 메인 브랜치로 전환 {#1-switch-to-the-main-branch}

```bash
git checkout master
```

### (2) 원격 메인 브랜치를 로컬에 동기화 {#2-sync-the-remote-main-branch-to-local}

```bash
git pull upstream master
```

### (3) 개발 브랜치로 다시 전환(브랜치 이름이 fix라고 가정) {#3-switch-back-to-the-development-branch-assume-the-branch-is-named-fix}

```bash
git checkout fix
```

### (4) rebase 실행 {#4-run-rebase}

```bash
git rebase -i master
```

커밋 이력이 표시된 파일이 열립니다. 대부분의 경우 그대로 저장하면 됩니다. 그러면 Git이 충돌이 발생한 파일을 알려 줍니다. 충돌이 발생한 각 파일을 열어 충돌을 해결하세요. 모든 파일의 충돌을 해결한 후 다음을 실행합니다.

```bash
git add .
git rebase --continue
```

화면에 *rebase successful*과 같은 메시지가 표시될 때까지 반복합니다. 그런 다음 업데이트를 PR 브랜치에 강제로 푸시합니다.

```bash
git push -f origin fix
```

## 5. 전체 예제 {#5-complete-example}

<!-- Knowledge type: Worked example -->

다음은 코드 동기화부터 브랜치 푸시까지의 전체 예제입니다.

### (1) upstream이 이미 설정된 로컬 브랜치에서 최신 코드 가져오기 {#1-fetch-the-latest-code-on-a-local-branch-with-upstream-already-configured}

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

### (2) rebase 실행 {#2-run-rebase}

```bash
$ git rebase upstream/master
First, rewinding head to replay your work on top of it...
Fast-forwarded master to upstream/master.
```

### (3) 다른 사람의 커밋 중 자신의 저장소에 동기화되지 않은 커밋이 있는지 확인 {#3-check-whether-others-commits-have-not-been-synced-to-your-own-repo}

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

### (4) 다른 사람의 커밋을 자신의 저장소에 동기화 {#4-sync-others-commits-to-your-own-repo}

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

### (5) 새 브랜치를 생성하고 개발 시작 {#5-create-a-new-branch-and-start-development}

```bash
$ git checkout -b my_branch
Switched to a new branch 'my_branch'

$ git branch
  master
* my_branch
```

### (6) 코드 수정 후 변경 사항을 스테이징 영역에 추가 {#6-stage-the-changes-after-editing-the-code}

```bash
$ git add -u
```

### (7) 메시지를 작성하고 로컬 브랜치에 커밋 {#7-fill-in-the-message-and-commit-to-the-local-branch}

```bash
$ git commit -m "Fix a typo"
[my_branch 55e0ba2] Fix a typo
 1 files changed, 2 insertions(+), 2 deletions(-)
```

### (8) GitHub의 자신의 저장소에 브랜치 푸시 {#8-push-the-branch-to-your-own-repo-on-github}

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

이제 위에서 설명한 단계에 따라 PR을 생성할 수 있습니다.
