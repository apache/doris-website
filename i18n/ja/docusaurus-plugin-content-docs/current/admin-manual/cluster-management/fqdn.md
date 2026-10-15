---
{
    "title": "FQDN",
    "language": "ja",
    "description": "Apache Doris で FQDN（完全修飾ドメイン名）モードを有効にする方法を説明します。新規クラスタの構築、既存クラスタの移行、Kubernetes へのデプロイ、サーバーの IP アドレス変更を扱います。"
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenarios: Cluster deployment / Node changes / Kubernetes deployment -->

この記事では、Apache Doris クラスタで FQDN（完全修飾ドメイン名）を有効にする方法を説明します。FQDN は、インターネット上の特定のコンピュータまたはホストを示す完全なドメイン名です。

FQDN を有効にすると、Doris ノード間の通信はすべて FQDN に基づいて行われます。ノードを追加するときは、FQDN を直接指定します。たとえば、BE ノードを追加するコマンドは次のとおりです。

```sql
ALTER SYSTEM ADD BACKEND "be_host:heartbeat_service_port";
```

FQDN モードでは、`be_host` に BE ノードの IP アドレスではなく FQDN を設定する必要があります。

## 適用場面 {#applicable-scenarios}

<!-- Knowledge type: Architecture decision -->

| 場面 | 説明 | 操作手順 |
| --- | --- | --- |
| 新規クラスタのデプロイ | 新しいクラスタの構築時に FQDN を有効にし、後からの移行を避けます | [新規クラスタで FQDN を有効にする](#enable-fqdn-on-a-new-cluster) |
| Kubernetes へのデプロイ | Pod の再起動後に IP アドレスが変わっても、ドメイン名は変わりません。FQDN によってサービスの継続性を確保できます。 | [K8s に Doris をデプロイする](#deploy-doris-on-k8s) |
| サーバーの IP アドレス変更 | ネットワークインターフェースの切り替えやマシンの交換時に、Doris のメタデータを変更する必要はありません | [サーバーの IP アドレス変更](#server-ip-change) |
| 既存クラスタの移行 | IP アドレスを使用して稼働しているクラスタを FQDN モードに切り替えます | [既存クラスタで FQDN を有効にする](#enable-fqdn-on-an-existing-cluster) |

## 前提条件 {#prerequisites}

<!-- Knowledge type: Pre-deployment checks -->

FQDN を有効にする前に、次の条件を満たす必要があります。

- `enable_fqdn_mode = true` を `fe.conf` に設定します。
- クラスタ内のすべてのマシンにホスト名を設定します。
- クラスタ内の各マシンの `/etc/hosts` ファイルに、他のすべてのマシンの IP アドレスと FQDN の対応関係を記載します。
- `/etc/hosts` ファイルに同じ IP アドレスを重複して記載してはいけません。

## 新規クラスタで FQDN を有効にする {#enable-fqdn-on-a-new-cluster}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New cluster deployment -->

3 FE + 3 BE のクラスタをデプロイする場合を例に、手順を示します。

1. **マシンを準備する**：クラスタの規模に応じてマシンを用意します（この例では 6 台）。

2. **ホスト名の一意性を確認する**：各マシンで `host` コマンドを実行し、返される結果がそれぞれ異なることを確認します。6 台のマシンのホスト名を `fe1`、`fe2`、`fe3`、`be1`、`be2`、`be3` とします。

3. **`/etc/hosts` を設定する**：6 台すべてのマシンで、6 つの FQDN に対応する実際の IP アドレスを `/etc/hosts` に設定します。

    ```text
    172.22.0.1 fe1
    172.22.0.2 fe2
    172.22.0.3 fe3
    172.22.0.4 be1
    172.22.0.5 be2
    172.22.0.6 be3
    ```

4. **ネットワークを確認する**：任意のノード（たとえば `fe1`）で `ping fe2` を実行します。正しい IP アドレスに名前解決され、ノードに到達できれば、ネットワーク環境の準備は完了です。

5. **FQDN の設定を有効にする**：各 FE ノードの `fe.conf` に次の設定を追加します。

    ```text
    enable_fqdn_mode = true
    ```

6. **クラスタをデプロイする**：[手動デプロイ](../../install/deploy-manually/integrated-storage-compute-deploy-manually)に従って、FE / BE のデプロイを完了します。

7. **必要に応じて Broker を追加する**：選択したマシンに Broker をデプロイし、次のコマンドを実行します。

    ```sql
    ALTER SYSTEM ADD BROKER broker_name "fe1:8000","be1:8000",...;
    ```

## K8s に Doris をデプロイする {#deploy-doris-on-k8s}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Kubernetes deployment -->

Kubernetes 環境では、Pod が予期せず再起動した後も IP アドレスが同じであるとは限りませんが、ドメイン名は変わりません。Doris で FQDN を有効にすると、この性質を利用して Pod の再起動後もサービスに到達できるようにできます。

K8s に Doris をデプロイする詳しい手順については、[K8s に Doris をデプロイする](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster)を参照してください。

## サーバーの IP アドレス変更 {#server-ip-change}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Node IP change / Network interface switch / Machine replacement -->

「新規クラスタで FQDN を有効にする」の手順でデプロイした後に、マシンの IP アドレスを変更する場合（ネットワークインターフェースの切り替えやマシンの交換など）は、すべてのマシンの `/etc/hosts` ファイルを更新するだけです。Doris クラスタのメタデータを変更する必要はありません。

## 既存クラスタで FQDN を有効にする {#enable-fqdn-on-an-existing-cluster}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Migration of existing cluster -->

**バージョンの前提条件**：現在使用している Doris のバージョンが、次の構文をサポートしている必要があります。

```sql
ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
```

現在のバージョンがこの構文をサポートしていない場合は、サポートするバージョンに先にアップグレードしてください。

:::caution
以下の操作を行うには、クラスタに Follower ノードが少なくとも 3 つ必要です。それ未満の場合、クラスタは正常に起動しません。
:::

### FE ノードで FQDN を有効にする {#enable-fqdn-on-fe-nodes}

Follower ノードと Observer ノードで次の操作を順番に行い、**Master ノードは最後に操作してください**。

1. **ノードを停止する**：対象の FE プロセスを停止します。

2. **ノードの状態を確認する**：MySQL クライアントで `SHOW FRONTENDS` を実行し、この FE ノードの `Alive` が `false` に変わったことを確認します。

3. **FQDN を設定する**：次の SQL を実行します（Master ノードの停止後は、新しい Master が自動的に選出されます。その場合は、新しい Master でこの文を実行します）。

    ```sql
    ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
    ```

4. **ノードの設定を変更する**：停止したノードの FE ルートディレクトリにある `conf/fe.conf` を編集し、次の設定を追加します。

    ```text
    enable_fqdn_mode = true
    ```

    この設定を追加してもノードが正常に起動しない場合は、`enable_fqdn_mode = true` を**すべて**の FE の `fe.conf` に追加してから、停止した FE ノードを起動します。

5. **ノードを起動する**：FE プロセスを起動し、ノードをクラスタに再参加させます。

### BE ノードで FQDN を有効にする {#enable-fqdn-on-be-nodes}

BE ノードで FQDN を有効にする際、再起動は不要です。MySQL クライアントから次のコマンドを実行します。

```sql
ALTER SYSTEM MODIFY BACKEND "<backend_ip>:<HeartbeatPort>" HOSTNAME "<be_hostname>";
```

`HeartbeatPort` のポート番号が不明な場合は、`SHOW BACKENDS` コマンドで確認してください。

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->

### Q: `enable_fqdn_mode` の設定値は任意に変更できますか？ {#q-can-the-enable_fqdn_mode-configuration-item-be-changed-at-will}

いいえ、任意に変更することはできません。IP アドレスを使用して稼働しているクラスタを FQDN モードに切り替えるには、[既存クラスタで FQDN を有効にする](#enable-fqdn-on-an-existing-cluster)の手順に従ってください。

### Q: Follower ノードが 3 つ未満でも FQDN を有効にできますか？ {#q-can-fqdn-be-enabled-when-there-are-fewer-than-3-follower-nodes}

いいえ。既存クラスタで移行手順を実行するには、Follower ノードが少なくとも 3 つ必要です。それ未満の場合、クラスタは正常に起動しません。

### Q: サーバーの IP アドレスを変更した後、Doris のメタデータを変更する必要がありますか？ {#q-does-doris-metadata-need-to-be-modified-after-a-server-ip-change}

いいえ。すべてのマシンの `/etc/hosts` で、IP アドレスと FQDN の対応関係を更新するだけです。

### Q: ノードを追加するとき、`be_host` には何を設定しますか？ {#q-what-should-be_host-be-set-to-when-adding-a-node}

FQDN を有効にした後は、`be_host` に BE ノードの IP アドレスではなく FQDN を設定する必要があります。
