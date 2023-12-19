import React from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import { PageMetadata } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import ExternalLink from '../components/external-link/external-link';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';
export default function NotFound() {
    return (
        <>
            <PageMetadata
                title={translate({
                    id: 'theme.NotFound.title',
                    message: 'Page Not Found',
                })}
            />
            <Layout>
                <main className="container margin-vert--xl">
                    <div className="row">
                        <div className="col">
                            <div className="flex justify-center mb-10">
                                <img
                                    style={{ width: 120 }}
                                    src={require('@site/static/images/empty-data.png').default}
                                    alt=""
                                />
                            </div>
                            <h1 className="text-[1.75rem] text-[#1D1D1D] leading-[1.6] text-center">
                                <Translate id="theme.NotFound.title" description="The title of the 404 page">
                                    Page Not Found
                                </Translate>
                            </h1>
                            <p className="text-center mt-2 text-sm text-[#8592A6]">
                                <Translate id="theme.NotFound.p1" description="The first paragraph of the 404 page">
                                    Oops! The page you are looking for can't be found. In any case, try to look for a
                                    different page or report this issue.
                                </Translate>
                            </p>
                            <div className="flex justify-center gap-x-10 mt-10">
                                <div className="w-[9.75rem]">
                                    <ExternalLink
                                        to="/"
                                        label="Go to home"
                                        className="text-sm h-[2.625rem] bg-primary text-white rounded-md hover:text-white cursor-pointer"
                                        linkIcon={<ExternalLinkArrowIcon />}
                                    />
                                </div>
                                <div className="w-[9.75rem]">
                                    <ExternalLink
                                        label="Report this issue"
                                        linkIcon={<ExternalLinkArrowIcon />}
                                        className="text-sm border border-[#444FD9] h-[2.625rem] rounded-md text-primary cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </Layout>
        </>
    );
}
