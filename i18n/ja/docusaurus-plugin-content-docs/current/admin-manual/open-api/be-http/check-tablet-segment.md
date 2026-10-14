---
{
    "title": "すべての Tablet のセグメント欠損を確認する",
    "language": "ja",
    "description": "何らかの例外によって BE ノード上のセグメントが失われても、メタデータ上では Tablet が正常と表示される場合があります。"
}
---

# すべての Tablet のセグメント欠損を確認する

## リクエスト

`GET /api/check_tablet_segment_lost?repair={bool}`

## 説明

何らかの例外によって BE ノード上のセグメントが失われても、メタデータ上では Tablet が正常と表示される場合があります。この異常なレプリカは FE に検出されず、自動的には修復されません。クエリの実行時には、データファイルを開けなかったことを示すエラーが発生し、メッセージの末尾に `tablet=<tablet_id>` と `backend=<be_ip>` が付加されます。このインターフェースは、現在の BE ノード上でセグメントが欠損しているすべての Tablet を確認します。

:::info バージョンに関する注意

4.0 系の 4.0.8 より前のバージョンでは、このエラーの先頭に `failed to initialize storage reader` が付いていました。4.0.8 以降はその接頭辞が削除され、エラーメッセージには実際の根本原因が示されます。そのため、この状況の判別に接頭辞を使用しないでください。

:::

## クエリパラメータ

* `repair`
    - `true`: セグメントが欠損した Tablet を SHUTDOWN 状態に設定し、不良レプリカとして扱います。これにより、FE が検出して修復できるようになります。
    - `false`: セグメントが欠損したすべての Tablet を返し、それ以外の処理は行いません。

## リクエストボディ

なし

## レスポンス

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

## 例


    ```
    curl http://127.0.0.1:8040/api/check_tablet_segment_lost?repair=false
    ```
