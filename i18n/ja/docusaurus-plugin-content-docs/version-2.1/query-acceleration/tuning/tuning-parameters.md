---
{
  "title": "一般的なチューニングパラメータ",
  "language": "ja",
  "description": "クエリパフォーマンスの最適化、バージョンアップグレード、およびSQL実行における適応的並列処理のための、enable_nereids_planner、parallel_pipeline_task_num、runtime_filter_modeを含む重要なデータベースチューニングパラメータを学習する。"
}
---
| Parameter                  | Description                                         | Default Value | Usage Scenario                                               |
| -------------------------- | --------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| enable_nereids_planner     | 新しいオプティマイザーを有効にするかどうか                 | TRUE          | 低バージョンからのアップグレードなどのシナリオでは、最初はfalseに設定し、アップグレード後にtrueに設定できます |
| enable_nereids_dml         | 新しいオプティマイザーのDMLサポートを有効にするかどうか | TRUE          | 低バージョンからのアップグレードなどのシナリオでは、最初はfalseに設定し、アップグレード後にtrueに設定できます |
| parallel_pipeline_task_num | Pipelineの並列度                                | 0             | 低バージョンからのアップグレードなどのシナリオでは、この値は以前固定値に設定されていましたが、アップグレード後は0に設定でき、システムのアダプティブ戦略が並列度を決定することを示します |
| runtime_filter_mode        | Runtime Filterタイプ                                 | GLOBAL        | 低バージョンからのアップグレードなどのシナリオでは、この値はNONEでRuntime Filterが有効でなかったことを示していましたが、アップグレード後はGLOBALに設定でき、Runtime Filterがデフォルトで有効になることを示します |
