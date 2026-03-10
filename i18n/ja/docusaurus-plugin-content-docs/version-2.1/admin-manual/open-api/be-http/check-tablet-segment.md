---
{
  "title": "全てのタブレットセグメント喪失をチェック",
  "language": "ja",
  "description": "BEノードでセグメントが失われる原因となる例外が発生する場合があります。ただし、メタデータではタブレットが正常であることが示されています。"
}
---
# Check All Tablet Segment Lost

## Request

`GET /api/check_tablet_segment_lost?repair={bool}`

## Description

BEノードでsegmentが失われる原因となる例外が発生する場合があります。しかし、メタデータではタブレットが正常であることが示されます。この異常なレプリカはFEによって検出されず、自動的に修復することができません。クエリが実行されると、`failed to initialize storage reader`という例外情報がスローされます。このインターフェースの機能は、現在のBEノード上でsegmentが失われたすべてのタブレットをチェックすることです。

## Query parameters

* `repair`
    - `true`: segmentが失われたタブレットはSHUTDOWNステータスに設定され、不正なレプリカとして扱われ、FEによって検出および修復されます。
    - `false`: segmentが欠落しているすべてのタブレットが返され、何も実行されません。

## Request body

None

## Response

    戻り値は、現在のBEノード上でsegmentが失われたすべてのタブレットです:

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
