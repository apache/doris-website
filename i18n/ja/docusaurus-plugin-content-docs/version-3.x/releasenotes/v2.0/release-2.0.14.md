---
{
  "title": "リリース 2.0.14",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.14バージョンでは約110の改善とバグ修正が行われました"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.14バージョンでは約110の改善とバグ修正が行われました。


## 1 新機能

- 最新のクエリprofileを取得するREST interfaceを追加：`curl http://user:password@127.0.0.1:8030/api/profile/text` [#38268](https://github.com/apache/doris/pull/38268)

## 2 改善

- sequence columnsを持つMOW tablesのprimary key point queryのパフォーマンスを最適化 [#38287](https://github.com/apache/doris/pull/38287)

- 多くの条件を持つinverted index queriesのパフォーマンスを向上 [#35346](https://github.com/apache/doris/pull/35346)

- tokenized inverted index作成時に`support_phrase`オプションを自動的に有効にして`match_phrase` phrase queriesを高速化 [#37949](https://github.com/apache/doris/pull/37949)

- 簡略化されたSQL hintsをサポート、例：`SELECT /*+ query_timeout(3000) */ * FROM t;` [#37720](https://github.com/apache/doris/pull/37720)

- `429`エラーに遭遇した際にobject storageからの読み取りを自動的にリトライして安定性を向上 [#35396](https://github.com/apache/doris/pull/35396)

- LEFT SEMI / ANTI JOINで適格なデータ行にマッチした際に後続のマッチング実行を終了してパフォーマンスを向上 [#34703](https://github.com/apache/doris/pull/34703)

- 不正なデータをMySQLの結果に返す際のcoredumpを防止 [#28069](https://github.com/apache/doris/pull/28069)

- 型名の出力を小文字で統一してMySQLとの互換性を保持し、BIツールにより親和的に [#38521](https://github.com/apache/doris/pull/38521)


完全なリストはGitHub [link](https://github.com/apache/doris/compare/2.0.13...2.0.14) からアクセスできます。主要な機能と改善点は以下にハイライトされています。

## Credits

本リリースに貢献したすべての方々に感謝します：

@ByteYue, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Lchangliang, @LiBinfeng-01, @Mryange, @XieJiann, @Yukang-Lian, @Yulei-Yang, @airborne12, @amorynan, @biohazard4321, @cambyzju, @csun5285, @eldenmoon, @englefly, @freemandealer, @hello-stephen, @hubgeter, @kaijchen, @liaoxin01, @luwei16, @morningman, @morrySnow, @mymeiyi, @qidaye, @sollhui, @starocean999, @w41ter, @wuwenchi, @xiaokang, @xy720, @yujun777, @zclllyybb, @zddr, @zhangstar333, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993
