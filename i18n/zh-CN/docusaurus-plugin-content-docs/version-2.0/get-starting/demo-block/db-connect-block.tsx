import React from 'react';
import './demo-block.css';
export default function ConnectBlock() {
    return (
        <div className="home-page-section">
            <div className="home-page-section-left">
                <div className="home-page-option">
                    <div className="home-page-option-section-icon">
                        <svg width="28px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <g className="icon-svg">
                                <path d="M20 19.25H4c-.7 0-1.25-.56-1.25-1.25V6c0-.7.55-1.25 1.25-1.25h16c.69 0 1.25.55 1.25 1.25v12c0 .69-.56 1.25-1.25 1.25Zm0 1.5c1.51 0 2.75-1.24 2.75-2.75V6c0-1.52-1.24-2.75-2.75-2.75H4C2.48 3.25 1.25 4.48 1.25 6v12c0 1.51 1.23 2.75 2.75 2.75h16Z" />
                                <path d="M11 13.75h4c.41 0 .75-.34.75-.75 0-.42-.34-.75-.75-.75h-4c-.42 0-.75.33-.75.75 0 .41.33.75.75.75Z" />
                                <path d="M5.46 8.53l2 2V9.46l-2 2c-.3.29-.3.76 0 1.06 .29.29.76.29 1.06 0l2-2c.29-.3.29-.77 0-1.07l-2-2c-.3-.3-.77-.3-1.07 0 -.3.29-.3.76 0 1.06Z" />
                            </g>
                            <path fill="none" d="M0 0h24v24H0Z" />
                        </svg>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 30, marginTop: 12 }}>数据库连接</div>
                </div>

                {/* <div style={{ marginBottom: 30, width: 800, fontSize: 14 }}>分别介绍如何通过 MySQL Client、MySQL JDBC Connector、DBeaver 和 Doris 内置的 Web UI 来连接 Doris</div> */}
                {/* <div>
                    <a style={{ color: "#444fd9" }} href="../../install/source-install/compilation-linux">查看更多 →</a>
                </div> */}
            </div>
            <div>
                <div className="home-page-button-container">
                    <a
                        className="home-page-option-button"
                        href="/docs/en/integrations/sql-clients/clickhouse-client-local"
                    >
                        {/* <div className="home-page-option-icon">
                            <svg width="28px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <g className="icon-svg">
                                    <path d="M20 19.25H4c-.7 0-1.25-.56-1.25-1.25V6c0-.7.55-1.25 1.25-1.25h16c.69 0 1.25.55 1.25 1.25v12c0 .69-.56 1.25-1.25 1.25Zm0 1.5c1.51 0 2.75-1.24 2.75-2.75V6c0-1.52-1.24-2.75-2.75-2.75H4C2.48 3.25 1.25 4.48 1.25 6v12c0 1.51 1.23 2.75 2.75 2.75h16Z" />
                                    <path d="M11 13.75h4c.41 0 .75-.34.75-.75 0-.42-.34-.75-.75-.75h-4c-.42 0-.75.33-.75.75 0 .41.33.75.75.75Z" />
                                    <path d="M5.46 8.53l2 2V9.46l-2 2c-.3.29-.3.76 0 1.06 .29.29.76.29 1.06 0l2-2c.29-.3.29-.77 0-1.07l-2-2c-.3-.3-.77-.3-1.07 0 -.3.29-.3.76 0 1.06Z" />
                                </g>
                                <path fill="none" d="M0 0h24v24H0Z" />
                            </svg>
                        </div> */}
                        <div className="home-page-text">数据库连接</div>
                    </a>
                    <div></div>
                </div>



            </div>
        </div>

    );
}
