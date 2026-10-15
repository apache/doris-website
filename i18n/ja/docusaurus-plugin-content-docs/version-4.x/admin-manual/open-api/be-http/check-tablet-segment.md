---
{
    "title": "全タブレットのセグメント欠損を確認する",
    "language": "ja",
    "description": "何らかの異常により BE ノードでセグメントが失われても、メタデータ上はタブレットが正常と表示される場合があります。"
}
---

# 全タブレットのセグメント欠損を確認する {#check-all-tablet-segment-lost}

## リクエスト {#request}

`GET /api/check_tablet_segment_lost?repair={bool}`

## 説明 {#description}

何らかの異常により BE ノードでセグメントが失われても、メタデータ上はタブレットが正常と表示される場合があります。FE はこの異常なレプリカを検出できず、自動修復もできません。クエリ実行時には、データファイルを開けなかったことを示すエラーが発生し、メッセージの末尾に `tablet=<tablet_id>` と `backend=<be_ip>` が付加されます。このインターフェースは、現在の BE ノード上でセグメントが失われたすべてのタブレットを確認します。

:::info バージョンに関する注意

4.0.8 より前のバージョンでは、こうしたエラーの先頭に `failed to initialize storage reader` が付いていました。4.0.8 以降はこの接頭辞が削除され、エラーメッセージには実際の根本原因がそのまま示されます。そのため、この接頭辞を使ってこの状況を判別しないでください。

:::

## クエリパラメータ {#query-parameters}

* `repair`
    - `true`: セグメントが失われたタブレットを SHUTDOWN 状態に設定し、不良レプリカとして扱います。これにより、FE が検出して修復できるようになります。
    - `false`: セグメントが欠損したすべてのタブレットを返し、それ以外の処理は行いません。

## リクエストボディ {#request-body}

なし

## レスポンス {#response}

    The return is all tablets on the current BE node that have lost segment:

    ```
    {
        status: "Success",
        msg: "Succeed to check all tablet segment",
        num: 3,
        bad_tablets: [
            11190,
            11210,
            11216
        ],
        set_bad: true,
        host: "172.3.0.101"
    }
    ```

## 使用例 {#examples}


    ```
    curl http://127.0.0.1:8040/api/check_tablet_segment_lost?repair=false
    ```
