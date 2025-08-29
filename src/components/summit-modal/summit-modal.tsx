'use client';
import { Modal } from 'antd';
import { useState } from 'react';
import Link from '@docusaurus/Link';
import React from 'react';
import { css } from '@emotion/css';
import { CloseIcon } from '../Icons/close-icon';

export function SummitModal() {
    const [open, setOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const hasPopedUp = Boolean(window.localStorage.getItem('has-poped-up-doris'));
            return !hasPopedUp;
        } else {
            return false;
        }
    });
    return (
        <Modal
            rootClassName={css`
                .ant-modal-content {
                    padding: 0 !important;
                    .ant-modal-close:hover {
                        background-color: transparent !important;
                    }
                }
            `}
            maskClosable={false}
            open={open}
            closeIcon={<CloseIcon />}
            centered
            onCancel={() => {
                setOpen(false);
                localStorage.setItem('has-poped-up-doris', 'true');
            }}
            footer={null}
            width={410}
        >
            <div>
                <div
                    style={{ background: 'linear-gradient(263deg, #410DE7 0.83%, #8F4AFB 99.17%)' }}
                    className="h-[160px] w-full rounded-t-lg pl-[44px] pt-[44px]"
                >
                    <div
                        className="h-full w-full"
                        style={{
                            backgroundImage: 'url(/img/summit-bg.png)',
                            backgroundPosition: 'right bottom',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'auto 135px',
                        }}
                    >
                        <div className="text-[#FFF]">
                            <div className="mb-[2.25rem] text-[1rem]/[0.375rem] font-medium">Doris Summit 2025</div>
                            <div className="text-[1.75rem]/[120%] font-semibold text-[#F8FAFF]">Call for Speaker !</div>
                        </div>
                    </div>
                </div>
                <div className="rounded-b-lg bg-[#FFF] px-[44px] py-[1.375rem]">
                    <div className="text-[1.125rem]/[145%] font-semibold">
                        The Fastest Analytics & Search Database in the AI Era
                    </div>
                    <p className="my-3 text-[0.875rem]/[145%] font-medium text-[#616161]">November 05, 2025, Online</p>
                    <p className="mb-[0.5rem] text-[0.75rem]/[1rem] text-[#616161]">
                        We're excited to invite the global Apache Doris community to share your voice at Doris Summit
                        2025!
                    </p>
                    <p className="mb-[1.25rem] text-[0.75rem]/[1rem] text-[#616161]">
                        Bring your journey to stage and inspire the data world. Together, we'll advance the conversation
                        and push the boundaries of what's possible with Apache Doris.
                    </p>
                    <Link
                        className="block h-[2.125rem] w-full rounded-lg bg-[#5D24FF] text-center hover:bg-[linear-gradient(270deg,#AC46FA_0.06%,#3905E0_99.94%)]"
                        href={'https://apache-doris-summit.org'}
                        onClick={() => {
                            localStorage.setItem('has-poped-up-doris', 'true');
                            setOpen(false);
                        }}
                        target="_blank"
                    >
                        <span className="text-[0.875rem]/[2.125rem] font-medium  text-[#FFF]">Submit Your Talk</span>
                    </Link>
                </div>
            </div>
        </Modal>
    );
}
