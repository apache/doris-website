---
{
    "title": "エラスティックスケーリング",
    "language": "ja",
    "description": "Apache Doris のエラスティックスケーリングガイド。サービスを中断せずに FE/BE ノードをオンラインで追加・削除する方法と、スケールインの 2 つの選択肢である DROP と DECOMMISSION を説明します。",
    "keywords": [
        "Doris エラスティックスケーリング",
        "Doris オンラインスケールアウト",
        "Doris スケールイン",
        "FE スケールアウト",
        "BE スケールアウト",
        "FE スケールイン",
        "BE スケールイン",
        "ALTER SYSTEM ADD FOLLOWER",
        "ALTER SYSTEM ADD OBSERVER",
        "ALTER SYSTEM ADD BACKEND",
        "ALTER SYSTEM DROP BACKEND",
        "ALTER SYSTEM DECOMMISSION BACKEND",
        "DECOMMISSION",
        "データ移行",
        "ノードの起動とデコミッション",
        "クラスタのスケールアウト"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster scale-out / Cluster scale-in / Node bring-up and decommission -->

Apache Doris はオンラインでのエラスティックスケーリングに対応しています。サービスを中断せずにノードを動的に追加・削除し、業務の拡大に対応したり、未使用のリソースを解放したりできます。BE ノードのスケーリングはクラスタの可用性に影響しませんが、データ移行が発生するため、負荷の低い時間帯に実行してください。

## 適用シナリオ

| シナリオ | 推奨操作 | 説明 |
| --- | --- | --- |
| FE の読み取り能力が不足している | Observer FE をスケールアウトする | Observer は Master の選出に参加せず、メタデータの読み取りスループットの向上に使用します |
| FE の高可用性が不足している | Follower FE をスケールアウトする | Master と Follower の合計数を奇数に保ちます。3 または 5 が推奨されます |
| BE のストレージ容量または計算能力が不足している | BE をスケールアウトする | BE を追加すると、システムが自動的にリバランスし、データが徐々に均等に分散されます |
| 特定の BE ノードをデコミッションする | BE をスケールインする（DECOMMISSION） | 先にデータを移行し、その後ノードをオフラインにします。本番環境で推奨されます |
| ノードが故障し、直ちに削除する必要がある | BE をスケールインする（DROP） | ノードを直ちにオフラインにするため、データが失われる可能性があります。異常時にのみ使用してください |

## 前提条件

- クラスタ管理者権限があり、`ALTER SYSTEM` 操作を実行できること。
- 各ノードの IP、ポート、ロール（Follower / Observer / BE）が決まっていること。
- 新たに追加する FE ノードの `http_port` が、クラスタ内の既存のすべての FE ノードの `http_port` と一致していること。
- BE のスケールインを負荷の低い時間帯に実行し、移行するデータを受け入れるための十分なディスク容量を確保していること。

## FE クラスタのスケーリング

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: FE scale-out / FE scale-in -->

### FE のロール

Doris の FE ノードには、次の三つのロールがあります。すべての FE ノードが完全なメタデータを保持します。

| ロール | Master の選出に参加 | メタデータの読み取り／書き込み | 用途 |
| --- | --- | --- | --- |
| Master | はい（唯一） | 読み取り＋書き込み | メタデータの読み取りと書き込みを処理します。Master のメタデータの変更は BDB JE プロトコルを通じて他のノードに同期されます。クラスタごとに許可される Master は一つだけです |
| Follower | はい | 読み取り | メタデータの読み取りを処理します。Master に障害が発生すると、Follower が選出を開始して新しい Master を選びます。Master と Follower の合計数は奇数が推奨されます |
| Observer | いいえ | 読み取り | メタデータの読み取りを処理します。Master の選出には参加しません。FE の読み取り能力のスケールアウトに使用します |

通常、各 FE ノードは 10～20 の BE ノードをサポートでき、ほとんどのワークロードでは 3 つの FE ノードで十分です。

### FE クラスタのスケールアウト

:::info 注意
新しい FE ノードを追加する際は、次の点に注意してください。

- 新しい FE の `http_port` は、クラスタ内の既存のすべての FE ノードの `http_port` と一致させてください。
- Follower ノードを追加する際は、クラスタ内の Master と Follower の合計数を奇数にすることが推奨されます。
- `show frontends` コマンドを使用すると、現在のクラスタ内の各ノードのポートとロールを確認できます。
:::

1. FE ノードを起動します。

    ```shell
    fe/bin/start_fe.sh --helper <leader_fe_host>:<edit_log_port> --daemon
    ```

2. FE ノードを登録します。

    Follower FE として登録する場合：

    ```sql
    ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>";
    ```

    Observer FE として登録する場合：

    ```sql
    ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>";
    ```

3. 新たに追加した FE ノードの状態を確認します。

    ```sql
    show frontends;
    ```

### FE クラスタのスケールイン

スケールインする際は、クラスタに残る Master と Follower の合計数が引き続き奇数になるようにしてください。次のコマンドでノードを削除します。

```sql
ALTER SYSTEM DROP FOLLOWER[OBSERVER] "<fe_host>:<edit_log_port>";
```

スケールイン後、削除した FE ノードのデプロイディレクトリ内のファイルを手動で削除してください。

## BE クラスタのスケーリング

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: BE scale-out / BE scale-in / Data migration -->

### BE クラスタのスケールアウト

1. BE プロセスを起動します。

    ```shell
    be/bin/start_be.sh
    ```

2. BE ノードを登録します。

    ```sql
    ALTER SYSTEM ADD backend '<be_host>:<be_heartbeat_service_port>';
    ```

登録後、新しい BE は自動的にクラスタに参加し、Doris は既存のデータを新しいノードへ徐々にリバランスします。

### BE クラスタのスケールイン

BE ノードをスケールインする際は、DROP または DECOMMISSION を選択できます。違いは次のとおりです。

| 項目 | DROP | DECOMMISSION |
| --- | --- | --- |
| デコミッションの仕組み | ノードを直接オフラインにし、BE ノードを削除します | コマンド実行後、BE 上のデータを他のノードへ移行しようとします。移行が完了すると、BE ノードは自動的にオフラインになります |
| 反映されるタイミング | 実行後すぐに反映されます | データ移行の完了後に反映されます。クラスタ内の現在のデータ量によっては、数時間から最長一日かかる場合があります |
| 単一レプリカのテーブルの扱い | データが失われる可能性があります | データは失われません |
| 複数ノードを同時にデコミッションする場合 | データが失われる可能性があります | データは失われません |
| 本番環境での推奨 | 本番環境では推奨されません | 本番環境で推奨されます |

#### DROP による BE ノードの削除

ノードが故障した場合、またはノードを直ちに削除する必要があるテスト環境で使用します。

```sql
ALTER SYSTEM DROP backend "<be_host>:<be_heartbeat_service_port>";
```

#### DECOMMISSION による BE ノードの削除

本番環境では DECOMMISSION が推奨されます。先にデータを移行し、その後ノードをオフラインにします。

```sql
ALTER SYSTEM DECOMMISSION backend "<be_host>:<be_heartbeat_service_port>";
```

DECOMMISSION コマンドに関する注意事項：

- DECOMMISSION は非同期操作です。実行後、`SHOW backends;` で BE ノードの `SystemDecommissioned` が `true` と表示されます。これはノードのデコミッションが進行中であることを意味します。
- DECOMMISSION コマンドは完了できない場合があります。たとえば、残りの BE にデコミッション対象の BE のデータを格納するだけの容量がない場合や、残りのマシン数がレプリカ数の最小要件を満たさない場合です。このとき、BE の `SystemDecommissioned` は `true` のままになります。
- `TabletNum` の値を `SHOW PROC '/backends';` で確認することで、DECOMMISSION の進捗を確認できます。デコミッションが進行中の場合、`TabletNum` は減少し続けます。
- `CANCEL DECOMMISSION BACKEND "<be_host>:<be_heartbeat_service_port>";` でデコミッションをキャンセルできます。キャンセル後、BE 上のデータ量はその時点の残量のままとなり、Doris は後でリバランスします。
- `balance_slot_num_per_path` パラメータを調整すると、データ移行速度を変更できます。

## FAQ

### Q: 新たに追加した FE ノードを起動できない場合は？

`http_port` が既存の FE と異なるか、`--helper` で Leader FE を指定していない可能性があります。`http_port` の設定を `fe.conf` で確認してください。初回起動時は `--helper <leader_fe_host>:<edit_log_port>` を使用してください。

### Q: `ALTER SYSTEM ADD FOLLOWER` の実行後もクラスタが新しいノードを認識しない場合は？

ノードが起動していない、ネットワークに接続できない、またはファイアウォールによってポートがブロックされている可能性があります。`show frontends` でノードの状態を確認し、`edit_log_port` に接続できることを確かめてください。

### Q: DECOMMISSION が長時間完了しない場合は？

残りの BE のストレージ容量が不足しているか、残りのノード数がレプリカ数の最小要件を満たしていない可能性があります。BE ノードを追加するか、デコミッション前にスケールアウトしてください。`SHOW PROC '/backends';` で `TabletNum` が減少し続けているかを確認してください。

### Q: DECOMMISSION を途中でキャンセルするには？

`CANCEL DECOMMISSION BACKEND "<be_host>:<be_heartbeat_service_port>";` を実行します。その後、Doris がリバランスします。

### Q: データ移行が遅すぎる場合は？

デフォルトの移行並列度が低いためです。移行速度を上げるには、`balance_slot_num_per_path` パラメータを調整してください。

### Q: FE のスケールイン後もディスク容量が解放されない場合は？

スケールインコマンドが成功したら、削除した FE ノードのデプロイディレクトリを手動で削除してください。
