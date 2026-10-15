---
title: Apache Doris Shade のリリース
language: ja
description: "Apache Doris Shade のリリース手順：Maven release prepare/perform、SVN へのアップロード、コミュニティ投票。"
keywords:
    - Apache Doris Shade のリリース
    - Maven release prepare
    - Maven release perform
    - Apache の投票
    - Maven Staging
    - SVN dist
    - リリースマネージャー
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

# Apache Doris Shade のリリース

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Version release / Apache vote process -->

Doris Shade のリポジトリは Doris のメインリポジトリから独立しており、次の場所にあります。

- [https://github.com/apache/doris-Shade](https://github.com/apache/doris-Shade)

このドキュメントでは、Doris Shade v1.0.0 のリリースを例に、Maven release プラグインの使用から SVN の準備、コミュニティ投票まで、Shade 系コンポーネントのリリース手順全体を説明します。

## リリースの準備

まず、[リリースの準備](./release-prepare)を参照して、署名、SVN、Maven の環境を整えてください。

## Maven へのリリース

### 1. ブランチの準備

リポジトリで `1.0.0-release` ブランチを作成し、そのブランチをチェックアウトします。

### 2. Maven Staging へのリリース

Maven release プラグインを実行してリリースタグを生成します。

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

`-DpushChanges=false` を指定すると、実行中に新しく生成されたブランチとタグはリポジトリへ自動的にプッシュされません。

`release:prepare` の実行中に、次の三項目の入力を求められます。

| 入力項目 | 推奨値 | 例 |
| --- | --- | --- |
| Doris Shade のバージョン | `{shade.version}` 形式のデフォルト値を使用 | `1.0.0` |
| リリースタグ名 | デフォルトのタグ名を使用 | `1.0.0` |
| 次のバージョン | ローカルブランチ用で、実質的な意味はありません | `1.0.1-SNAPSHOT` |

実行中に GPG のパスフレーズの入力を求められる場合があります。`gpg: no valid OpenPGP data found` が表示された場合は、先に `export GPG_TTY=$(tty)` を実行してから再試行してください。

`mvn release:prepare` が正常に完了すると、ローカルにタグとブランチが生成され、現在のブランチに二つの新しいコミットが追加されます。

1. 最初のコミットは、新しく生成されたタグに対応します。
2. 二番目のコミットは、次のバージョンのブランチに対応します。

`git log` で確認できます。

ローカルのタグが正しいことを確認したら、リポジトリにプッシュします。

```bash
git push upstream --tags
```

ここで、`upstream` は `apache/doris-shade` リポジトリを指します。

最後に release:perform を実行します。

```bash
mvn release:perform
```

正常に完了すると、[https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories) でリリースしたバージョンを確認できます。

![](/images/staging-repositories.png)

:::caution 注意
成果物に `.asc` 署名ファイルが含まれていることを確認してください。
:::

問題が発生した場合は、次の手順を実行してください。

1. ローカルのタグを削除します。
2. リポジトリのタグを削除します。
3. ローカルに新しく生成された二つのコミットを削除します。
4. Staging リポジトリを破棄します。
5. 上記の手順をやり直します。

すべて正しいことを確認したら、`close` ボタンをクリックして Staging のリリースを完了します。

### 3. SVN の準備

Dev SVN リポジトリをチェックアウトします。

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

タグのソースコードをアーカイブし、署名ファイルと SHA512 チェックサムファイルを生成します（以下は `1.0.0` の例です）。

```bash
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-shade-1.0.0-src/ | gzip > apache-doris-shade-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-shade-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-shade-1.0.0-src.tar.gz
sha512sum apache-doris-shade-1.14_2.12-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

macOS では、次のコマンドを使用します。

```bash
shasum -a 512 apache-doris-shade-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

最終的に、次の三ファイルが作成されます。

| ファイル | 用途 |
| --- | --- |
| `apache-doris-shade-1.0.0-src.tar.gz` | ソースパッケージ |
| `apache-doris-shade-1.0.0-src.tar.gz.asc` | GPG 署名ファイル |
| `apache-doris-shade-1.0.0-src.tar.gz.sha512` | SHA512 チェックサムファイル |

これら三ファイルを SVN ディレクトリに移動します。

```text
doris/doris-shade/1.0.0/
```

SVN ディレクトリ全体の構造例を示します。

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-shade
│   └── 1.0.0
│       ├── apache-doris-shade-1.0.0-src.tar.gz
│       ├── apache-doris-shade-1.0.0-src.tar.gz.asc
│       └── apache-doris-shade-1.0.0-src.tar.gz.sha512
```

ここで、`1.2.3-rc01` は Doris 本体のリリース用ディレクトリで、`doris-shade/1.0.0` には今回のリリースの内容が格納されます。

> KEYS ファイルの準備方法については、[リリースの準備](./release-prepare)の該当するセクションを参照してください。

### 4. 投票

`dev@doris.apache.org` メーリングリストで投票を開始します。テンプレートは次のとおりです。

```text
Hi all,

This is a call for the vote to release Apache Doris-Shade 1.0.0

The git tag for the release:
https://github.com/apache/doris-shade/releases/tag/doris-shade-1.0.0

Release Notes are here:
https://github.com/apache/doris-shade/blob/doris-shade-1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-shade/

KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...
```

## リリースの完了

[リリースの完了](./release-complete)を参照して、リリース手順全体を完了してください。

## 付録：SNAPSHOT のリリース

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-release preview -->

Snapshot は Apache の正式なリリースバージョンではなく、リリース前のプレビューにのみ使用します。Snapshot バージョンをリリースするには、PMC での議論と承認が必要です。

doris-shade ディレクトリに移動します。

```bash
mvn deploy
```

その後、次のアドレスで Snapshot バージョンを確認できます。

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-shade/
```

## FAQ / トラブルシューティング

**Q：`mvn release:prepare` で `gpg: no valid OpenPGP data found` というエラーが報告された場合は？**

ターミナルが GPG のパスフレーズを受け取れない状態です。`export GPG_TTY=$(tty)` を実行してから再試行してください。

**Q：`mvn release:perform` が失敗した後、完全にロールバックするには？**

次の順に実行します。ローカルのタグを削除し（`git tag -d <tag>`）、リモートのタグを削除し（`git push upstream :refs/tags/<tag>`）、ローカルの二つのコミットを取り消し（`git reset --hard HEAD~2`）、Apache Staging で該当するリポジトリを破棄してから、`mvn release:clean` と `mvn release:prepare` を再実行します。

**Q：Maven release プラグインと、手動でタグを付けて `mvn deploy` を実行する方法の違いは？**

`release:prepare/perform` は、バージョンの変更、タグの作成、成果物のアップロードを自動的に処理するため、Shade のように pom が単純なプロジェクトに適しています。手動の方法は、複数の Spark バージョンに対応する Spark Connector のように、複数の成果物を扱う場合に柔軟性があります。
