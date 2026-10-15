---
title: リリースの完了
language: ja
description: "Apache Doris のリリース後の作業：リリース用 SVN、ダウンロードリンク、リリースノート、旧バージョンの整理。"
keywords:
    - Apache Doris
    - リリースの完了
    - リリース用 SVN
    - ダウンロードリンク
    - リリースノート
    - Maven リリース
    - アナウンスメール
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

# リリースの完了

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Apache release process / Release wrap-up -->

このドキュメントでは、`dev@doris` メーリングリストでのリリース投票が終了し、可決された後に行う仕上げの作業を説明します。

## リリース完了のチェックリスト

| 手順 | 作業 | 担当者 |
|------|------|--------|
| 1. パッケージをリリース領域にアップロードする | ソースパッケージ、署名ファイル、チェックサムファイルを `dev` から `release` に移動する | PMC メンバー |
| 2. Maven の Staging リポジトリを公開する | Apache Nexus で `Release` をクリックする | リリースマネージャー |
| 3. リリースノートを用意する | GitHub Release と公式サイトのダウンロードページを更新する | リリースマネージャー |
| 4. SVN の旧バージョンを整理する | 最新バージョンのみを残し、旧バージョンのリンクをアーカイブの URL に置き換える | リリースマネージャー |
| 5. アナウンスメールを送る | `dev@doris` に新しいリリースを告知する | リリースマネージャー |

## 1. パッケージをリリース領域にアップロードする

正式なリリース投票が可決されたら、まず `[Result]` メールを送り、続いてリリースパッケージを用意します。以前 `dev` 以下に公開した該当フォルダーから、ソースパッケージ、署名ファイル、ハッシュファイルを新しいディレクトリ（例：`1.1.0`）にコピーします。注意事項：

- ファイル名に **`rcxx` サフィックスを含めないでください**（ファイル名は変更できますが、署名を再計算しないでください）。
- ハッシュは再計算しても構いません。結果は同じです。

> この手順を実行できるのは PMC メンバーだけです。

コピー元の SVN パス：

```text
https://dist.apache.org/repos/dist/dev/doris/
```

コピー先の SVN パス：

```text
https://dist.apache.org/repos/dist/release/doris/
```

コマンド例：

```shell
svn mv -m "move doris 1.1.0-rc05 to release" \
    https://dist.apache.org/repos/dist/dev/doris/1.1 \
    https://dist.apache.org/repos/dist/release/doris/1.1
```

初回リリースの場合は、KEYS ファイルもコピーして SVN のリリースディレクトリに追加する必要があります。追加が完了すると、公開したファイルは次の場所で確認できます：

```text
https://dist.apache.org/repos/dist/release/doris/1.xx/
```

少し待つと、Apache の公式サイトでも確認できるようになります：

```text
http://www.apache.org/dist/doris/1.xx/
```

## 2. Doris 公式サイトと GitHub にリンクを公開する

この節では Doris Core を例に説明します。他のコンポーネントについては、対応する名前に置き換えてください。

### 2.1 ダウンロードリンクを作成する

| リンクの種類 | URL |
|--------------|-----|
| ダウンロードリンク | `http://www.apache.org/dyn/closer.cgi?filename=doris/1.xx/apache-doris-1.xx-src.tar.gz&action=download` |
| wget ダウンロード | `https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| 元の配置場所 | `https://www.apache.org/dist/doris/1.xx/` |
| Closer のエントリ | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| ソースパッケージ | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| ASC 署名 | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.asc` |
| sha512 チェックサム | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.sha512` |
| KEYS | `http://archive.apache.org/dist/doris/KEYS` |

wget コマンドの例：

```shell
wget --trust-server-names "https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz"
```

詳しいルールについては、[Apache のダウンロードページのガイドライン](http://www.apache.org/dev/release-download-pages#closer)を参照してください。

### 2.2 Maven

[Apache Maven Staging Repositories](https://repository.apache.org/#stagingRepositories) で、該当する Staging リポジトリを探します：

1. まだクローズされていない場合は、先に `close` をクリックします。
2. `Release` をクリックして正式にリリースします。

> `close` の手順で `No public key: Key with id: (xxx) was not able to be located on` と表示された場合は、次のコマンドで公開鍵を公開鍵サーバーに同期してから、再度クローズしてください：
>
> ```shell
> gpg --keyserver hkp://keyserver.ubuntu.com --send-keys xxx
> ```
>
> `xxx` の値は `gpg -k` で確認できます。

### 2.3 リリースノートを用意する

次の二か所を更新する必要があります：

#### 2.3.1 GitHub Release ページ

```text
https://github.com/apache/doris/releases/tag/0.9.0-rc01
```

#### 2.3.2 Doris 公式サイトのダウンロードページ

ダウンロードページは、次のパスにある Markdown ファイルです：

```text
docs/zh-CN/downloads/downloads.md
docs/en/downloads/downloads.md
```

次の二点を変更します：

1. 旧バージョンのダウンロード URL を Apache のアーカイブ URL に変更する（次の節を参照）。
2. 新しいバージョンのダウンロード情報を追加する。

### 2.4 SVN の旧バージョンを整理する

#### 2.4.1 SVN から旧バージョンを削除する

SVN には最新バージョンのパッケージだけを残せば十分です。新しいリリース後は旧バージョンを整理し、次の二つのパスには最新バージョンのパッケージだけが残るようにします：

```text
https://dist.apache.org/repos/dist/release/doris/
https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.4.2 アーカイブの URL に置き換える

Doris 公式サイトのダウンロードページで、旧バージョンのダウンロード URL をアーカイブページの URL に変更します：

| 種類 | URL |
|------|-----|
| ダウンロードページ | `http://doris.apache.org/downloads.html` |
| アーカイブページ | `http://archive.apache.org/dist/doris` |

Apache には、過去にリリースされたバージョンをアーカイブする同期の仕組みがあります。手順については [How to Archive](https://www.apache.org/legal/release-policy.html#how-to-archive) を参照してください。旧パッケージを SVN から削除した後も、アーカイブページから入手できます。

## 3. アナウンスメール

メールの件名：

```text
[ANNOUNCE] Apache Doris 1.xx release
```

送信先のメーリングリスト：

```text
dev@doris.apache.org
```

メール本文：

```text
Hi All,

We are pleased to announce the release of Apache Doris 1.xx.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The release is available at:
http://doris.apache.org/master/zh-CN/downloads/downloads.html

Thanks to everyone who has contributed to this release, and the release note can be found here:
https://github.com/apache/doris/releases

Best Regards,

On behalf of the Doris team,
xxx
```

## FAQ

### Q1: `svn mv` で権限エラーが発生する場合は？

`release` の SVN ディレクトリへの書き込み権限があるのは PMC メンバーだけです。通常の Committer は PMC メンバーに代理で操作してもらう必要があります。

### Q2: Maven で `No public key` と表示される場合は？（`Release` をクリックした後）

GPG 公開鍵が公開鍵サーバーにアップロードされていません。次のコマンドで公開鍵を公開鍵サーバーに同期してから、再試行してください：

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>` は `gpg -k` で確認できます。

### Q3: 公式サイトのダウンロードリンクが 404 を返す場合は？

考えられる原因：

- ファイルを SVN のリリースディレクトリにコミットした直後で、CDN への反映に 10～30 分かかっている。
- 旧バージョンを整理したが、ダウンロードページの URL をアーカイブ URL に更新していない。

### Q4: ダウンロード時に旧バージョンが見つからない場合は？

旧バージョンは Apache によって自動的にアーカイブされます。ダウンロードページにある旧バージョンのリンクを `http://archive.apache.org/dist/doris/<version>/` に更新する必要があります。
