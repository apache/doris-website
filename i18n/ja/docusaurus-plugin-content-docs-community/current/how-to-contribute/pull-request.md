---
title: プルリクエスト
language: ja
description: "Apache Doris にプルリクエストを送るための一連の手順。フォーク、ブランチの作成、競合の解消、PR の提出について説明します。"
keywords:
    - Apache Doris
    - プルリクエスト
    - PR の提出
    - リポジトリのフォーク
    - git rebase
    - 競合の解消
    - コミットメッセージ
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

GitHub には、共同作業に便利な [プルリクエスト（PR）](https://help.github.com/articles/about-pull-requests/) の仕組みがあります。この文書では、Apache Doris プロジェクトに PR を提出するまでの一連の手順を説明します。

全体の流れは次のとおりです。

1. `apache/doris` リポジトリを自分のアカウントにフォークします。
2. ローカルの git を設定し、変更をコミットします。
3. GitHub で PR を作成します。
4. 競合がある場合は、リベースして解消します。

## 1. リポジトリをフォークする {#1-fork-the-repository}

[GitHub ページ](https://github.com/apache/doris) で `apache/doris` リポジトリを開き、右上の `Fork` ボタンをクリックしてフォークします。

![フォーク](/images/fork-repo.png)

## 2. Git を設定して変更をコミットする {#2-configure-git-and-commit-changes}

### (1) コードをローカルにクローンする {#1-clone-the-code-locally}

```bash
git clone https://github.com/<your_github_name>/doris.git
cd doris
git submodule update --init --recursive
```

注: `<your_github_name>` は自分の GitHub ユーザー名に置き換えてください。

クローンが完了すると、`origin` はデフォルトで GitHub 上の自分のフォークを指します。

### (2) apache/doris を upstream リモートとして追加する {#2-add-apachedoris-as-the-upstream-remote}

```bash
cd doris
git remote add upstream https://github.com/apache/doris.git
```

### (3) リモートリポジトリの設定を確認する {#3-check-the-remote-repository-settings}

```bash
git remote -v
origin    https://github.com/<your_github_name>/doris.git (fetch)
origin    https://github.com/<your_github_name>/doris.git (push)
upstream  https://github.com/apache/doris.git (fetch)
upstream  https://github.com/apache/doris.git (push)
```

### (4) 変更用の新しいブランチを作成する {#4-create-a-new-branch-for-your-changes}

```bash
git checkout -b <your_branch_name>
```

注: `<your_branch_name>` は自分で決めたブランチ名です。

ブランチを作成したら、そのブランチでコードを変更できます。

### (5) コードをリモートブランチにプッシュする {#5-push-the-code-to-the-remote-branch}

```bash
git commit -a -m "<your_commit_message>"
git push origin <your_branch_name>
```

git の使い方について詳しくは、GitHub の公式ドキュメント「[Git の使用](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories)」を参照してください。

## 3. PR を作成する {#3-create-a-pr}

### (1) 新しい PR を開く {#1-open-a-new-pr}

ブラウザーで自分の GitHub ページを開き、プッシュしたブランチ（`<your_branch_name>`）に切り替えて、`Compare & pull request` ボタンをクリックして PR を作成します。

![新しい PR](/images/new-pr.png)

### (2) ブランチを選択する {#2-prepare-the-branch}

`Create pull request` ボタンが表示されます。表示されない場合は、ブランチが正しく選択されているか確認してください。`compare across forks` をクリックして、リポジトリとブランチを選び直すこともできます。

![PR の作成](/images/create-pr.png)

### (3) コミットメッセージを入力する {#3-fill-in-the-commit-message}

コミットの概要と詳細を入力し、`Create pull request` をクリックして作成を完了します。

<!-- Knowledge type: Rules and conventions -->

コミットメッセージを書く際の要点は次のとおりです。

| 項目 | 要件 |
|------|------|
| 表現 | 英語の「動詞 + 目的語」の形で、命令文として書く |
| 時制 | 動詞に過去形を**使わない** |
| 件名と本文 | 両方が必要で、空行で区切る（GitHub の PR ページでは二つの欄にそれぞれ入力する） |
| 件名の長さ | **50** 文字以内 |
| 本文の行幅 | 各行 **72** 文字以内。超える場合は手動で改行する |
| 本文の内容 | 「何を、なぜ、どのように行ったか」を説明する |
| 件名の最初の文字 | 大文字にする |
| 件名の末尾 | ピリオドを付けない |
| 関連 Issue | 本文で関連する Issue を参照する（例: `#233`） |

詳しくは、<https://chris.beams.io/posts/git-commit> を参照してください。

![PR の作成](/images/create-pr.png)

### (4) PR の作成を完了する {#4-finish-creating-the-pr}

PR を作成すると、Doris プロジェクトのメンテナーによるレビューを待つ状態になります。レビューとマージを待つか、コミュニティに直接連絡して状況を確認できます。

![PR の作成](/images/create-pr3.png)

これで PR の作成は完了です。PR について詳しくは、[Issue とプルリクエストを使った共同作業](https://help.github.com/categories/collaborating-with-issues-and-pull-requests/) を参照してください。

### (5) CI チェックの通過を待つ {#5-wait-for-ci-checks-to-pass}

PR を作成すると、CI パイプラインが自動的に起動します。PR ページ下部のチェック一覧では、次の点を確認してください。

- **Required** と表示されたチェックは、PR をマージする前に**すべて通過**（緑色で表示）している必要があります。
- それ以外の Required ではないチェックは参考情報であり、マージを妨げません。

どのチェックが Required かは、PR ページにその時点で表示される内容で決まります。チェックが失敗した場合は、そのチェックをクリックして GitHub Actions のログを開き、エラーの原因を特定してください。修正後に `git push` を実行すると、チェックが再度起動します。

## 4. 競合を解消する {#4-resolving-conflicts}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Git conflicts on a PR / Branch is behind master -->

PR 提出時のコードの競合は、通常、複数の人が同じファイルを編集することで発生します。次の手順で解消します。

### (1) メインブランチに切り替える {#1-switch-to-the-main-branch}

```bash
git checkout master
```

### (2) リモートのメインブランチをローカルに同期する {#2-sync-the-remote-main-branch-to-local}

```bash
git pull upstream master
```

### (3) 開発ブランチに戻る（ブランチ名を fix とする） {#3-switch-back-to-the-development-branch-assume-the-branch-is-named-fix}

```bash
git checkout fix
```

### (4) リベースを実行する {#4-run-rebase}

```bash
git rebase -i master
```

コミット履歴を示すファイルが開きます。通常は、そのまま保存します。その後、Git が競合しているファイルを示します。競合している各ファイルを開いて競合を解消してください。すべての競合を処理したら、次を実行します。

```bash
git add .
git rebase --continue
```

画面に *rebase successful* のようなメッセージが表示されるまで繰り返します。その後、更新内容を PR のブランチに強制プッシュします。

```bash
git push -f origin fix
```

## 5. 一連の操作例 {#5-complete-example}

<!-- Knowledge type: Worked example -->

以下は、コードの同期からブランチのプッシュまでの一連の操作例です。

### (1) upstream が設定済みのローカルブランチで最新のコードを取得する {#1-fetch-the-latest-code-on-a-local-branch-with-upstream-already-configured}

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

### (2) リベースを実行する {#2-run-rebase}

```bash
$ git rebase upstream/master
First, rewinding head to replay your work on top of it...
Fast-forwarded master to upstream/master.
```

### (3) 他の人のコミットが自分のリポジトリにまだ同期されていないか確認する {#3-check-whether-others-commits-have-not-been-synced-to-your-own-repo}

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

### (4) 他の人のコミットを自分のリポジトリに同期する {#4-sync-others-commits-to-your-own-repo}

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

### (5) 新しいブランチを作成して開発を始める {#5-create-a-new-branch-and-start-development}

```bash
$ git checkout -b my_branch
Switched to a new branch 'my_branch'

$ git branch
  master
* my_branch
```

### (6) コードを編集した後、変更をステージングする {#6-stage-the-changes-after-editing-the-code}

```bash
$ git add -u
```

### (7) メッセージを入力してローカルブランチにコミットする {#7-fill-in-the-message-and-commit-to-the-local-branch}

```bash
$ git commit -m "Fix a typo"
[my_branch 55e0ba2] Fix a typo
 1 files changed, 2 insertions(+), 2 deletions(-)
```

### (8) ブランチを GitHub 上の自分のリポジトリにプッシュする {#8-push-the-branch-to-your-own-repo-on-github}

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

これで、上記の手順に従って PR を作成できます。
