---
title: AI エージェントを使った Apache Doris Core のリリース
language: ja
description: "AI エージェントとリリースマネージャー向けの Apache Doris Core リリース手順書。準備、パッケージ化、署名、投票、リリースの完了、Web サイトの更新までを扱います。"
keywords:
    - Apache Doris Core のリリース
    - AI エージェント
    - リリースマネージャー
    - Apache の投票
    - SVN dist
    - GPG 署名
    - リリースノート
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

# AI エージェントを使った Apache Doris Core のリリース

<!-- Knowledge type: Agent runbook -->
<!-- Applicable scenario: Apache Doris Core release / Release Manager assistant -->

このページは、AI エージェント向けの Doris Core リリース手順書です。エージェントがリリースマネージャーに代わってリリースを判断するためのものではありません。ブランチとタグの準備、RC ソースパッケージの作成と署名、Apache dev SVN へのアップロード、投票の開始、正式リリースの完了、Doris Web サイトの更新まで、エージェントがリリースマネージャーを順を追って案内するためのものです。

エージェントは、この文書の順序に従ってください。各ステップで、目的、リリースマネージャーによる確認が必要な入力、自分またはリリースマネージャーが実行するコマンド、完了を判断できる結果を説明してください。

## 対象範囲と役割の境界

この文書は、`apache/doris` リポジトリからのソースリリースである Apache Doris Core を対象とします。リリース補助スクリプトは Doris リポジトリにあります。

```text
tools/release-tools/
```

Web サイト更新用の補助手順は Doris Website リポジトリにあります。

```text
doc-tools/skills/add-release/SKILL.md
```

エージェントは次の境界を守ってください。

| 項目 | 要件 |
| --- | --- |
| リリースに関する判断 | リリースマネージャーとコミュニティが判断します。エージェントは確認事項の通知、チェック、情報整理のみを行います |
| ASF アカウントとパスワード | 認証情報をファイルに書き込んだり、ログに出力したり、Git にコミットしたりしないでください |
| GPG 秘密鍵とパスフレーズ | リリースマネージャーがローカルで管理します。エージェントはパスフレーズを尋ねたり保存したりしてはいけません |
| 公開 SVN への書き込み | 書き込むたびに、対象 URL とファイル一覧をリリースマネージャーに確認してください |
| メール送信 | スクリプトはメールの下書きのみを生成します。リリースマネージャーが内容を確認し、`@apache.org` のアドレスから手動で送信してください |
| 投票結果 | エージェントは集計を補助できますが、ASF の投票ルールを満たすかどうかはリリースマネージャーが確認してください |
| 利便性のためのバイナリ | スクリプトはローカルの利便性のためのバイナリに署名し、チェックサムを生成できますが、バイナリパッケージはアップロードしません |

## 最初にエージェントが収集する入力

リリース作業を始める前に、次の入力をリリースマネージャーに確認してください。重要な項目が欠けている場合、パッケージ化やアップロードに進まないでください。

| 入力 | 例 | 用途 |
| --- | --- | --- |
| リリースバージョン | `4.0.7` | パッケージ名、Web サイトのリンク、リリースメールの生成 |
| RC 番号 | `rc01` または `rc02` | Git タグと dev SVN ディレクトリの生成 |
| Git タグ | `4.0.7-rc01` | リリース候補の変更されないソース基点 |
| リリースブランチ | `branch-4.0` | 想定したブランチからタグが作られたことの確認 |
| Apache ID | `morningman` | SVN、KEYS、メール、署名情報で使用 |
| Apache メールアドレス | `morningman@apache.org` | 投票メールの署名者メールアドレスとして使用 |
| 署名鍵 | GPG フィンガープリント。自動検出する場合は空欄 | `.asc` 署名の生成 |
| リリースノートの URL | GitHub issue または Web サイトのリリースノート URL | 投票メールと Web サイトの更新で使用 |
| 利便性のためのバイナリ | `x64`、`x64-noavx2`、`arm64` の tarball のローカルパス | 任意の署名と投票メールへの表示 |
| リリース SVN への PMC 権限 | 権限あり、または PMC の支援が必要 | 正式リリースの SVN ステップで必要 |
| Web サイト更新の時期 | 今すぐ、または後で | Doris Website の更新手順を実行するかどうかの判断 |

入力を集めたら、リリース計画を再確認してください。例:

```text
This release plan is for Apache Doris 4.0.7, RC rc01, tag 4.0.7-rc01.
The RC source artifacts will be uploaded to https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01/.
After the vote passes, the final source artifacts will be published to https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7/.
```

## ステージ 1: リリース準備の確認

すぐに補助スクリプトを実行しないでください。まず、リリース準備が完了していることを確認します。Doris のリリース補助スクリプトは、次の作業が完了していることを前提とします。

1. リリースマネージャーがコミュニティでリリース計画の議論を終えている。
2. リリースブランチが作成されている。
3. 対象バージョンの issue、PR、重要なバグ修正がクローズ、マージ、または延期されている。
4. 必要なパッチがリリースブランチに cherry-pick されている。
5. QA または担当メンテナーが安定性の検証を終えている。
6. ブランチのビルドが成功する。
7. 通常は GitHub issue または Markdown 文書として、リリースノートが準備されている。
8. Git タグが作成され、`apache/doris` を指すリモートに push されている。

リリースマネージャーに、Doris リポジトリで次の確認を実行してもらってください。

```bash
git fetch --tags <apache-remote>
git rev-parse <version>-<rc>
git ls-remote --tags <apache-remote> refs/tags/<version>-<rc>
```

完了条件:

- ローカルにタグが存在する。
- Apache Doris の GitHub リモートに同じタグが存在する。
- ローカルとリモートのタグが同じコミットを指している。
- リリースマネージャーが、リリースブランチ、リリースノート、検証作業の準備が整ったことを確認している。

タグが存在しないか、タグのコミットが一致しない場合はリリース作業を止め、続行前にリリースマネージャーにタグを修正してもらってください。

## ステージ 2: `release.env` の設定

リリースマネージャーに、Doris リポジトリ内のリリースツールのディレクトリへ移動してもらってください。

```bash
cd tools/release-tools
```

次に `release.env` を編集します。`4.0.7-rc01` の場合、主なフィールドは次のようになります。

```bash
VERSION="4.0.7"
RC="rc01"
TAG="${VERSION}-${RC}"
GIT_REMOTE="upstream-apache"

APACHE_ID="<your-apache-id>"
APACHE_EMAIL="<your-apache-id>@apache.org"
SIGNER_NAME="<your display name>"
SIGNING_KEY="<your signing key fingerprint, or empty if only one secret key exists>"

RELEASE_NOTES_URL="<release notes issue or page URL>"
ANNOUNCE_RELEASE_NOTES_URL="<release notes URL for announce email, or empty to reuse>"
```

リリースマネージャーに、次の派生値を確認してもらってください。

| フィールド | 期待される値 |
| --- | --- |
| `TAG` | `4.0.7-rc01` のように RC の接尾辞を含む |
| `PKG_BASE` | `apache-doris-4.0.7-rc01-src` のように RC の接尾辞を含む、投票段階のソースパッケージ名 |
| `RELEASE_PKG_BASE` | `apache-doris-4.0.7-src` のように RC の接尾辞を含まない、最終リリースのソースパッケージ名 |
| `DEV_SVN_DIR` | `https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01` のような dev SVN の RC ディレクトリ |
| `RELEASE_SVN_DIR` | `https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7` のようなリリース SVN ディレクトリ |
| `VERIFY_GUIDE_URL` | Doris のリリース検証ガイドを指す |

投票メールに利便性のためのバイナリを記載する場合、リリースマネージャーはバイナリ tarball のローカル絶対パスを `BIN_FILES` に設定できます。次の範囲を明確に説明してください。

- `02-package-sign-upload.sh` は `BIN_FILES` 内のファイルに署名し、同じ場所に `.asc` と `.sha512` のファイルを生成します。
- このスクリプトは、それらのバイナリパッケージを Apache dev SVN にアップロードしません。
- ASF の投票対象の成果物はソースのみです。

## ステージ 3: ASF SVN 認証情報のエクスポート

リリースマネージャーに、現在のシェルで ASF の認証情報をエクスポートしてもらってください。

```bash
export ASF_USERNAME=<your-apache-id>
export ASF_PASSWORD='<your-apache-ldap-password>'
```

リリースマネージャーにパスワードの送信を求めないでください。パスワードを `release.env` に書き込まないでください。

完了条件:

- `ASF_USERNAME` が現在のシェルに存在する。
- `ASF_PASSWORD` が現在のシェルに存在する。
- どちらの変数も Git にコミットされていない。

## ステージ 4: 署名とリリースの環境確認

次を実行します。

```bash
./01-check-env.sh
```

このスクリプトは次を確認します。

- `git`、`gpg`、`svn`、`sha512sum`、`curl`、`gzip` など、必要なツール。
- `GPG_TTY` が使用可能かどうか。
- `gpg.conf` に SHA512 のダイジェスト設定があるかどうか。
- 使用可能なローカル GPG 秘密鍵が存在するかどうか。
- 署名鍵が Doris KEYS に掲載されているかどうか。
- ローカルでのテスト署名と検証が成功するかどうか。
- ASF SVN の認証情報が設定されているかどうか。

スクリプトが `gpg.conf` の編集、鍵のインポートや生成、KEYS の公開を求めた場合は、まず変更内容を説明します。そのうえで、確認するかどうかをリリースマネージャーに判断してもらってください。

成功時には次の行が表示されます。

```text
environment looks READY for <version>-<rc>
```

この行が表示されない場合は、パッケージ化とアップロードに進まないでください。

## ステージ 5: RC ソース成果物のパッケージ化、署名、アップロード

アップロードスクリプトを実行する前に、対象の dev SVN URL を再確認してください。

```text
https://dist.apache.org/repos/dist/dev/doris/<version>-<rc>/
```

リリースマネージャーが確認したら、次を実行します。

```bash
./02-package-sign-upload.sh
```

スクリプトは次の処理を行います。

1. ローカルにタグが存在することを確認します。
2. Apache Doris の GitHub リモートに同じタグが存在することを確認します。
3. ローカルとリモートのタグが同じコミットを指すことを確認します。
4. `git archive` でソース tarball を作成します。
5. `.asc` GPG 署名を生成します。
6. `.sha512` チェックサムを生成します。
7. 署名とチェックサムを検証します。
8. 任意で `BIN_FILES` に指定された利便性のためのバイナリに署名し、チェックサムを生成します。
9. 二度の確認後、ソース tarball、`.asc`、`.sha512` を Apache dev SVN にアップロードします。

両方の確認時には、リリースマネージャーに次を確認してもらってください。

- 対象の SVN URL が正しい。
- アップロード一覧にソース tarball、署名、チェックサムのみが含まれている。
- ファイル名に RC の接尾辞が含まれている。
- SVN のコミットメッセージがこの RC に対応している。

完了条件:

- dev SVN ディレクトリに次の三つのファイルがある。

```text
apache-doris-<version>-<rc>-src.tar.gz
apache-doris-<version>-<rc>-src.tar.gz.asc
apache-doris-<version>-<rc>-src.tar.gz.sha512
```

- スクリプトの最後に、リリースマネージャーへ `./03-vote-mail.sh` の実行が案内される。

アップロード前にバージョン、タグ、ファイル名、または SVN URL の誤りが見つかった場合は停止し、リリースマネージャーがコミットを承認しないようにしてください。

## ステージ 6: `[VOTE]` メールの生成と送信

次を実行します。

```bash
./03-vote-mail.sh
```

スクリプトは `WORK_DIR` の下に次のファイルを作成します。

```text
vote-email.txt
vote-email.eml
```

リリースマネージャーがメールの下書きを確認する際、次を手伝ってください。

| 確認項目 | 要件 |
| --- | --- |
| 件名 | `[VOTE] Release Apache Doris <version>-<rc>` |
| GitHub タグへのリンク | `https://github.com/apache/doris/releases/tag/<version>-<rc>` を指す |
| リリースノート | このバージョンのリリースノートを指す |
| RC 成果物 | dev SVN の RC ディレクトリを指す |
| PGP 鍵 | フィンガープリント、Apache メールアドレス、KEYS の URL が正しい |
| 検証ガイド | Doris のリリース検証ガイドを指す |
| 投票期間 | 少なくとも 72 時間投票を受け付けると記載されている |
| 利便性のためのバイナリ | 記載する場合、tarball、`.asc`、`.sha512` の各 URL がすべて正しい |

リリースマネージャーは、`@apache.org` のアドレスから次の宛先に手動でメールを送信してください。

```text
dev@doris.apache.org
```

エージェントはメールを自動送信してはいけません。

完了条件:

- `[VOTE]` メールが `dev@doris.apache.org` に送信されている。
- リリースマネージャーが投票開始時刻を記録している。
- 投票が少なくとも 72 時間継続される。

## ステージ 7: 投票の追跡と `[RESULT]` メールの送信

投票中、リリースマネージャーが次の投票表を管理するのを手伝ってください。

| 投票者 | Apache ID | 票 | 拘束力 | 備考 |
| --- | --- | --- | --- | --- |
| `<name>` | `<apache-id>` | `+1` | あり/なし | `<verification summary>` |

リリースマネージャーに次を伝えてください。

- 明示的な返信だけを集計します。
- リリースマネージャーに暗黙の `+1` 票はありません。投票する場合は明示的に返信する必要があります。
- PMC メンバーの票には拘束力があります。その他のコミュニティの票には拘束力がありません。
- 投票は少なくとも 72 時間継続する必要があります。
- 通常、リリースには拘束力のある `+1` 票が少なくとも 3 票必要で、`+1` 票が `-1` 票より多い必要があります。
- 有効な `-1` 票や重大な検証上の問題がある場合、リリースマネージャーはこの RC を取り消して新しい RC を準備するかどうかを判断してください。

投票が可決されたら、リリースマネージャーが `[RESULT]` メールを手動で送信します。エージェントは本文の下書きを作成できますが、票数、拘束力の有無、メーリングリストのスレッドへのリンクはリリースマネージャーが確認してください。

完了条件:

- `[RESULT][VOTE]` メールが `dev@doris.apache.org` に送信されている。
- リリースマネージャーがこの RC の可決を確認している。

## ステージ 8: 最終ソース成果物の公開と `[ANNOUNCE]` メールの生成

投票が可決され、`[RESULT]` メールが送信された後にのみ、完了用スクリプトを実行します。

```bash
./04-release-complete.sh
```

スクリプトは次を行います。

1. 可決された RC のソース tarball、署名、チェックサムが dev SVN に存在することを確認します。
2. 対象のリリース SVN ディレクトリがまだ存在しないことを確認します。
3. `svnmucc` を使ってリリース SVN ディレクトリを作成します。
4. RC ファイルを dev SVN からリリース SVN へ移動します。
5. 最終リリースのファイル名から RC の接尾辞を削除します。
6. dev SVN から RC ディレクトリを削除します。
7. `announce-email.txt` と `announce-email.eml` を生成します。

リリースマネージャーに次を伝えてください。

- リリース SVN への書き込みには通常、PMC の権限が必要です。
- 対象のリリース SVN ディレクトリに RC の接尾辞を含めてはいけません。
- 最終ソースパッケージのファイル名に RC の接尾辞を含めてはいけません。
- このステップで dev SVN から RC ディレクトリが削除されます。
- スクリプトは SVN への変更をコミットする前に最終確認を求めます。

リリース SVN への移動がすでに完了し、告知メールだけを再生成する場合は、次を使用します。

```bash
./04-release-complete.sh --mail-only
```

完了条件:

- リリース SVN ディレクトリに次のファイルがある。

```text
apache-doris-<version>-src.tar.gz
apache-doris-<version>-src.tar.gz.asc
apache-doris-<version>-src.tar.gz.sha512
```

- 対応する `<version>-<rc>` ディレクトリが dev SVN から削除されている。
- 告知メールの下書きが生成されている。

## ステージ 9: `[ANNOUNCE]` メールの送信

リリースマネージャーが `announce-email.txt` を確認する際、次を手伝ってください。

| 確認項目 | 要件 |
| --- | --- |
| 件名 | `[ANNOUNCE] Apache Doris <version> release` |
| ダウンロードページ | `https://doris.apache.org/download/` を指す |
| ソース成果物 | リリース SVN の最終ディレクトリを指す |
| リリースノート | 最終版のリリースノートを指す |
| 署名 | 正しいリリースマネージャーの名前が使われている |

リリースマネージャーは、`@apache.org` のアドレスから次の宛先に告知メールを手動で送信します。

```text
dev@doris.apache.org
```

完了条件:

- `[ANNOUNCE]` メールが送信されている。
- リリースマネージャーが、Web サイトや GitHub Release で参照できるようにメーリングリストのスレッドへのリンクを保存している。

## ステージ 10: Doris Web サイトのリリース情報の更新

リリースが可決された後、Doris Website リポジトリに移動して次を読んでください。

```text
doc-tools/skills/add-release/SKILL.md
```

まず、次の入力を集めるか確認します。

| 入力 | 説明 |
| --- | --- |
| バージョン | 例: `4.0.7` |
| リリース系列 | 例: `4.0` |
| リリースノートの元データ | GitHub issue、Markdown の本文、または既存のリリースノート |
| リリース日 | Apache のダウンロードディレクトリのタイムスタンプ、または告知日を優先 |
| ソースパッケージの URL | `https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz` |
| バイナリパッケージの URL | `x64`、`x64-noavx2`、`arm64` と、それぞれの `.asc`、`.sha512` |
| ソースファイル名の接尾辞 | 最終ソースパッケージに RC の接尾辞がないか確認 |
| Web サイトでの掲載位置 | `Latest`、`Prev`、または過去のリリースのみを更新するか |
| ローカライズ | デフォルトでは英語と中国語のリリースノートの内容を揃える |

通常、次のファイルを更新します。

```text
src/constant/download.data.ts
releasenotes/v<series>/release-<version>.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<version>.md
releasenotes/all-release.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
sidebarsReleases.json
```

特に次を確認してください。

- `DORIS_VERSIONS` と `ALL_VERSIONS` の両方に新しいバージョンが含まれている。
- 新しいバージョンが主要な掲載バージョンになる場合、`VersionEnum.Latest` または `VersionEnum.Prev` が正しく更新されている。
- ソース用の `source` フィールドと `version` フィールドから、実在するソースパッケージの URL が生成される。
- すべてのバイナリパッケージに `.tar.gz`、`.asc`、`.sha512` へのリンクがある。
- 英語と中国語のリリースノートの構成が一致している。
- `all-release.md` がリリース日の新しい順に並んでいる。
- `sidebarsReleases.json` に新しいリリースノートの ID が含まれ、有効な JSON のままである。

推奨する検証コマンド:

```bash
curl -sI https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
curl -sI https://download.velodb.io/apache-doris-<version>-bin-x64.tar.gz
curl -sI https://download.velodb.io/apache-doris-<version>-bin-x64-noavx2.tar.gz
curl -sI https://download.velodb.io/apache-doris-<version>-bin-arm64.tar.gz

git diff --check
node -e "JSON.parse(require('fs').readFileSync('sidebarsReleases.json','utf8')); console.log('sidebarsReleases.json ok')"
rg -n "<version>|release-<version>|apache-doris-<version>" src/constant/download.data.ts releasenotes i18n/zh-CN/docusaurus-plugin-content-docs-releases/current sidebarsReleases.json
```

リリースマネージャーがビルド検証を許可した場合は、Doris Website リポジトリで通常の Docusaurus ビルドまたはローカル検証コマンドを実行してください。リリースマネージャーが明示的にビルドを省略した場合は、最終報告にその旨を記載してください。

完了条件:

- Web サイトのダウンロードデータに新しいバージョンが含まれている。
- 英語と中国語のリリースノートが追加または更新されている。
- リリース一覧とサイドバーが更新されている。
- ソースパッケージ、バイナリパッケージ、署名、チェックサムへのリンクにアクセスできる。
- 関連する検証コマンドが成功しているか、省略した検証が明示されている。

## ステージ 11: リリース後の確認

最後に、リリースマネージャーが次を確認するのを手伝ってください。

| 確認項目 | 要件 |
| --- | --- |
| Apache のダウンロード | `https://downloads.apache.org/doris/<series>/<version>/` にアクセスできる |
| ダウンロードページ | Web サイトの `/download/` ページに新しいバージョンが表示される |
| リリースノート | Web サイトの `/releases/` ページに新しいリリースノートが表示される |
| GitHub Release | タグに対応する GitHub Release が更新されている |
| 旧バージョン | Web サイトの方針で必要な場合、旧バージョンのリンクがアーカイブの URL を指す |
| メーリングリスト | `[VOTE]`、`[RESULT]`、`[ANNOUNCE]` のスレッドへのリンクが保存されている |
| ソースの検証 | 最終ダウンロード URL から取得したファイルの署名とチェックサムを検証できる |

最終ダウンロード URL を使い、検証例を実行します。

```bash
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.asc
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.sha512
wget https://downloads.apache.org/doris/KEYS

gpg --import KEYS
gpg --verify apache-doris-<version>-src.tar.gz.asc apache-doris-<version>-src.tar.gz
sha512sum --check apache-doris-<version>-src.tar.gz.sha512
```

## 停止して再評価する条件

次のいずれかが起きた場合、リリースマネージャーにリリース作業の一時停止を勧めてください。

- ローカルとリモートのタグが異なるコミットを指している。
- `01-check-env.sh` が `environment looks READY` を出力しない。
- GPG 署名またはチェックサムの検証に失敗する。
- dev SVN またはリリース SVN の対象ディレクトリがこのバージョン用ではない。
- 投票開始から 72 時間が経過していない。
- 拘束力のある `+1` 票が 3 票未満である。
- 有効な `-1` 票が未解決である。
- 検証者がソースパッケージ内に予期しないバイナリやビルド成果物を発見した。
- LICENSE、NOTICE、またはライセンスヘッダーのチェックに失敗する。
- Web サイトのリンクが、存在しないソースパッケージ、バイナリパッケージ、署名、またはチェックサムを指している。

新しい RC が必要な場合は、リリースマネージャーを次の手順に案内してください。

1. リリースブランチを修正する。
2. `rc01` から `rc02` に進めるなど、新しいタグを作成して push する。
3. `RC` と `TAG` を `release.env` で を更新する。
4. ステージ 4 からやり直す。

## エージェントの返信例

リリースマネージャーが「Doris 4.0.7 のリリースを始めて」と言った場合、エージェントは次のように返信できます。

```text
I will guide you through the Doris Core release flow. First I need to confirm a few inputs:

1. Is this rc01 or a later RC?
2. Has the 4.0.7-rcXX tag already been created and pushed to apache/doris?
3. What is the Git remote name in your Doris checkout that points to apache/doris?
4. What is the Release Notes URL?
5. Should this vote email list convenience binaries?
6. Do you have release SVN write permission, or do you need a PMC member to help with the final release step?

After confirming these, I will check the tag and release.env, then run 01-check-env.sh. I will stop for your confirmation before any public SVN write or email send.
```

## 最終報告のテンプレート

リリース完了後、リリースマネージャーに短い報告を送ってください。

```text
Apache Doris <version> release flow is complete.

- RC tag: <version>-<rc>
- Vote artifacts: <dev SVN URL>
- Release artifacts: <release SVN URL>
- Vote thread: <mail thread URL>
- Result thread: <mail thread URL>
- Announce thread: <mail thread URL>
- Website PR/commit: <URL or commit>
- Validation:
  - Signature/checksum: passed
  - Website links: passed
  - Docusaurus build: passed/skipped

Remaining manual follow-ups:
- <none or list remaining follow-ups>
```
