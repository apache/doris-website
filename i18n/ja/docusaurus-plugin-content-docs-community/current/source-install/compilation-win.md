---
title: Windows（WSL2）で Apache Doris をコンパイルする
language: ja
description: WSL2 を使用して Windows 上で Apache Doris をコンパイルする手順。
keywords:
    - Windows でのコンパイル
    - WSL2
    - WSL
    - Apache Doris
    - ソースコードからのコンパイル
    - Linux サブシステム
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

このドキュメントでは、Windows 上で Apache Doris のソースコードをコンパイルする方法を説明します。Doris は Windows 上でのネイティブコンパイルに直接対応していませんが、WSL2（Windows Subsystem for Linux 2）を使用して Windows 上で Linux サブシステムを実行し、Linux 向けのコンパイル手順でビルドできます。

:::tip
Windows と WSL2 を使用する方法では、現在、ストレージとコンピュートを分離するモードのコンパイルとデプロイには対応していません。
:::

## 対象ユーザー、利点、欠点

| 項目 | 説明 |
| ---- | ---- |
| 対象ユーザー | 開発マシンが Windows で、Doris のコンパイルとデバッグが必要な開発者 |
| 利点 | デュアルブート環境や追加の Linux サーバーが不要で、ローカルでコンパイルできる |
| 欠点 | Windows 10 2004 以降または Windows 11 が必要で、一定のディスク容量を使用する |

## 1. 環境要件

<!-- Knowledge type: Hardware requirements -->

| 項目 | 要件 |
| ---- | ---- |
| Windows のバージョン | Windows 10 2004（ビルド 19041）以降、または Windows 11 |
| WSL のバージョン | WSL2（Ubuntu 22.04 または Ubuntu 24.04 ディストリビューションを推奨） |
| ディスク容量 | ソースコード、サードパーティーライブラリ、ビルド成果物のために、50 GB 以上の空き容量を推奨 |

## 2. コンパイル手順

### 2.1 WSL2 をインストールする

Microsoft の公式ドキュメント「[WSL のインストールガイド](https://learn.microsoft.com/en-us/windows/wsl/install)」を参照し、PowerShell で次のコマンドを実行します。

```powershell
wsl --install
```

インストールが完了したらシステムを再起動し、画面の指示に従って Linux サブシステムを初期化します（ユーザー名とパスワードを設定します）。

### 2.2 WSL2 で Doris をコンパイルする

WSL2 で起動した Linux サブシステムに入り、次のいずれかの方法でコンパイルします。

- [LDB Toolchain でコンパイルする（推奨）](./compilation-with-ldb-toolchain)
- [Docker イメージでコンパイルする（推奨）](./compilation-with-docker)
- [Linux 上で直接コンパイルする](./compilation-linux)

## 3. 注意事項

- **保存先ドライブ**：WSL2 ディストリビューションのデータは、デフォルトで C ドライブに保存されます。C ドライブの空き容量が少ない場合は、システムドライブの容量不足を避けるため、インストール前に WSL2 のデータを別のドライブへ移行してください。移行方法については、[WSL のエクスポートとインポート](https://learn.microsoft.com/en-us/windows/wsl/basic-commands#export-a-distribution-to-a-tar-file)のコマンドを参照してください。
- **リソース制限**：WSL2 はデフォルトでホストのメモリを使用します。メモリ不足でコンパイルプロセスが頻繁に強制終了される場合は、`memory` と `processors` の制限値を `%UserProfile%\.wslconfig` で増やしてください。
- **ファイルシステム**：ソースコードは、WSL2 内の ext4 ファイルシステム（`~/doris` など）に配置し、マウントされた `/mnt/c/...` パスには置かないでください。ファイルシステムをまたぐアクセスにより、コンパイルが極端に遅くなります。

## FAQ

### Q1: 「Windows needs to be updated」と表示され、WSL2 のインストールに失敗する場合は？

Windows 10 2004（ビルド 19041）以降にアップグレードするか、Windows 11 を使用してください。

### Q2: WSL2 でのコンパイルが極端に遅い場合は？

ソースコードが WSL2 内部のファイルシステム（`~/doris` など）にあり、`/mnt/c/...` 以下にはないことを確認してください。ファイルシステムをまたぐアクセスは、コンパイルを大幅に遅くします。

### Q3: WSL2 がホストのメモリをすべて使用してしまう場合は？

`%UserProfile%\.wslconfig` で WSL2 のリソース使用量を制限します。

```ini
[wsl2]
memory=12GB
processors=8
```

ファイルを変更した後、`wsl --shutdown` を実行して WSL2 を再起動し、変更を反映します。

## 関連ドキュメント

- [LDB Toolchain でコンパイルする](./compilation-with-ldb-toolchain)
- [Docker イメージでコンパイルする](./compilation-with-docker)
- [Linux 上で直接コンパイルする](./compilation-linux)
