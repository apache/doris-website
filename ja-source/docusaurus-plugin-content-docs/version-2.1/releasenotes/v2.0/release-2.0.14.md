---
{
  "title": "リリース 2.0.14",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.14バージョンでは約110件の改善とバグ修正が行われました"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.14 バージョンでは約110の改善とバグ修正が行われました


## 1 新機能

- 最新のクエリprofileを取得するREST インターフェースを追加: `curl http://user:password@127.0.0.1:8030/api/profile/text` [#38268](https://github.com/apache/doris/pull/38268)

## 2 改善

- sequence columnを持つMOW tableのprimary key point queryパフォーマンスを最適化 [#38287](https://github.com/apache/doris/pull/38287)

- 多数の条件を持つinverted indexクエリのパフォーマンスを向上 [#35346](https://github.com/apache/doris/pull/35346)

- tokenized inverted index作成時に`support_phrase`オプションを自動的に有効化し、`match_phrase`フレーズクエリを高速化 [#37949](https://github.com/apache/doris/pull/37949)

- 簡略化されたSQL hintsをサポート、例: `SELECT /*+ query_timeout(3000) */ * FROM t;` [#37720](https://github.com/apache/doris/pull/37720)

- `429`エラーに遭遇した際にobject storageからの読み取りを自動的に再試行し、安定性を向上 [#35396](https://github.com/apache/doris/pull/35396)

- LEFT SEMI / ANTI JOINは適格なデータ行にマッチした際に後続のマッチング実行を終了し、パフォーマンスを向上。[#34703](https://github.com/apache/doris/pull/34703)

- MySQL結果に不正なデータを返す際のcoredumpを防止。[#28069](https://github.com/apache/doris/pull/28069)

- 型名の出力を小文字に統一し、MySQLとの互換性を維持し、BIツールにより親和的に。[#38521](https://github.com/apache/doris/pull/38521)


完全なリストはGitHub [link](https://github.com/apache/doris/compare/2.0.13...2.0.14)でアクセスでき、主要な機能と改善が以下にハイライトされています。

## Credits

このリリースに貢献してくださった全ての方に感謝します:

@ByteYue, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Lchangliang, @LiBinfeng-01, @Mryange, @XieJiann, @Yukang-Lian, @Yulei-Yang, @airborne12, @amorynan, @biohazard4321, @cambyzju, @csun5285, @eldenmoon, @englefly, @freemandealer, @hello-stephen, @hubgeter, @kaijchen, @liaoxin01, @luwei16, @morningman, @morrySnow, @mymeiyi, @qidaye, @sollhui, @starocean999, @w41ter, @wuwenchi, @xiaokang, @xy720, @yujun777, @zclllyybb, @zddr, @zhangstar333, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993
