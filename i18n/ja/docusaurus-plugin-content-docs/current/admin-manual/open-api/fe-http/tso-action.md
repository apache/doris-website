---
{
    "title": "TSO アクション",
    "language": "ja",
    "description": "Master FE への転送またはローカル状態の取得によって TSO の状態を確認します。"
}
---

<version since="dev">

</version>

## 説明 {#description}

タイムスタンプを割り当てたり論理カウンターを増加させたりせずに、TSO の状態のスナップショットを返します。有効な Doris ユーザー認証が必要です。Master FE 以外の FE は、デフォルトでリクエストを Master FE に転送します。`local=true` を指定すると、リクエストを受信した FE のローカル状態を返します。前提条件については [TSO](../../cluster-management/tso.md) を参照してください。

## リクエスト {#request}

`GET /api/tso`

## パラメータ {#parameters}

| パラメータ | 型 | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `local` | boolean | いいえ | `false` | true の場合、Master FE への転送を省略し、リクエストを受信した FE のローカル状態を照会します。 |

パスパラメータとリクエストボディはありません。

## 例 {#example}

デフォルトの HTTP ポートを使用します。パスワードの入力を求められます。

```bash
curl --user root http://127.0.0.1:8030/api/tso
```

レスポンス例（タイムスタンプは稼働中のクラスターによって異なります）：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "window_end_physical_time": 1625097601000,
    "current_tso": 426009585254400123,
    "current_tso_physical_time": 1625097600000,
    "current_tso_logical_counter": 123
  }
}
```

## レスポンスフィールド {#response-fields}

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `window_end_physical_time` | long | 予約された割り当てウィンドウの終端。単位は Unix ミリ秒です。 |
| `current_tso` | long | 現在の合成された 64 ビットの割り当てカーソル。 |
| `current_tso_physical_time` | long | current_tso の物理時間成分。単位はミリ秒です。 |
| `current_tso_logical_counter` | long | current_tso の論理カウンター成分。 |

## エラーと注意事項 {#errors-and-caveats}

認証の失敗、FE の準備ができていない状態、または転送の失敗により、正常なレスポンスを得られない場合があります。初期化されていないローカルサービスはゼロ値を返すことがあります。また、スナップショットを取得できても、後続の割り当てが成功するとは限りません。TSO を割り当てるのは稼働中の Master FE だけですが、準備ができている FE であれば、どの FE も状態確認のリクエストを受信できます。ウィンドウの終端は将来の割り当てウィンドウを予約するため、通常は現在の物理時間成分より先にあります。
