---
{
    "title": "BE の VLOG を変更する",
    "language": "ja",
    "description": "この API は、BE 側の VLOG ログを動的に調整するために使用します。"
}
---

## リクエスト

`POST /api/glog/adjust?module=<module_name>&level=<level_number>`

## 説明

この API は、BE 側の VLOG ログを動的に調整するために使用します。

## クエリパラメータ

* `module_name`
    VLOG を設定するモジュール。BE 側のファイル名から拡張子を除いたものに対応します。

* `level_number`
    VLOG レベル。1 から 10 まで指定できます。-1 を指定すると無効になります。

## リクエストボディ

なし

## レスポンス

    ```json
    {
        msg: "adjust vlog of xxx from -1 to 10 succeed",
        code: 0
    }
    ```

## 例

    ```bash
    curl -X POST "http://127.0.0.1:8040/api/glog/adjust?module=vrow_distribution&level=-1"
    ```
