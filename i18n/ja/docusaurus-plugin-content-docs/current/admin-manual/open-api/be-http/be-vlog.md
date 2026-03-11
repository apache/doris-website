---
{
  "title": "BE VLOGを変更",
  "language": "ja",
  "description": "この関数は、BE側のVLOGログを動的に調整するために使用されます。"
}
---
## リクエスト

`POST /api/glog/adjust?module=<module_name>&level=<level_number>`

## 説明

この機能は、BE側でVLOGログを動的に調整するために使用されます。

## クエリパラメータ

* `module_name`
    VLOGを設定するモジュール、接尾辞なしのBEファイル名に対応

* `level_number`
    VLOGレベル、1から10まで。オフにする場合は-1

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
