import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { DownloadTypeEnum, Option } from '@site/src/constant/download.data';
import FormSelect from '../form-select/form-select';
import { useForm, useWatch } from 'antd/es/form/Form';
import * as semver from 'semver';
import copy from 'copy-to-clipboard';

interface DownloadFormProps {
    versions: Option[];
    onValuesChange: (values: any) => void;
}
export default function DownloadFormAllRelease(props: DownloadFormProps) {
    const { versions } = props;
    const [form] = useForm();
    const version = useWatch('version', form) || [versions[0].value, versions[0].children[0].value];
    const architecture = useWatch('architecture', form);
    const tarBall = useWatch('tarBall', form);

    function showArch(version: string) {
        const SUPPORTED_VERSION = '>1.2.3';
        const versionNumber = version.match(/[0-9].[0-9].[0-9]*/)?.[0] || '0.0.0';
        if (semver.satisfies(versionNumber, SUPPORTED_VERSION)) {
            return true;
        } else {
            return false;
        }
    }
    const getOptions = (version: string[]) => {
        const currentParentVersion = versions.find(item => form.getFieldValue('version')[0] === item.value).children;
        const currentVersion = currentParentVersion.find(item => form.getFieldValue('version')[1] === item.value);
        return currentVersion.items;
    };

    const getVersionLinkByKeys = (version, cpu, type) => {
        const versionNode = versions.find(item => item.value === version);
        const node = versionNode.children.find(item => item.value === cpu);
        return node?.[type] || null;
    };

    function getDownloadLinkByCard(params: { version: string[]; cpu: string; tarBall: string; type: string }) {
        const parentVersion = versions.find(item => item.value === params.version[0]);
        const childVersion = parentVersion.children.find(item => item.value === params.version[1]);
        if (!showArch(params.version[1])) {
            return childVersion.source;
        }
        const node = childVersion.items.find(item => item.value === params.cpu);
        if (tarBall === DownloadTypeEnum.Binary) {
            return node[params.type];
        } else {
            if (params.type === 'gz') {
                return `${node.source}apache-doris-${node.version}-src.tar.gz`;
            } else {
                return `${node.source}apache-doris-${node.version}-src.tar.gz.${params.type}`;
            }
        }
    }

    useEffect(() => {
        if (Array.isArray(version) && showArch(version[1])) {
            const currentParentVersion = versions.find(
                item => form.getFieldValue('version')[0] === item.value,
            ).children;
            const currentVersion = currentParentVersion.find(item => form.getFieldValue('version')[1] === item.value);
            form.setFieldValue('architecture', currentVersion.items[0].value);
        }
    }, [version]);

    return (
        <div className="rounded-lg border border-b-[0.375rem] border-[#444FD9] px-8 pt-[3.125rem] pb-[2.1875rem]">
            <div className="mb-8 text-xl font-medium text-left">Downloads</div>
            <Form
                form={form}
                onFinish={val => {
                    const url = getDownloadLinkByCard({
                        version: version,
                        cpu: architecture,
                        tarBall: tarBall,
                        type: 'gz',
                    });
                    window.open(url, '_blank');
                    return;
                }}
                initialValues={{
                    version: [versions[0].value, versions[0].children[0].value],
                    tarBall: DownloadTypeEnum.Binary,
                }}
                onValuesChange={(changedValues, values) => props?.onValuesChange(values)}
            >
                <Form.Item name="version" rules={[{ required: true }]}>
                    <FormSelect
                        placeholder="Version"
                        label="Version"
                        isCascader={true}
                        displayRender={label => {
                            return label.length > 0 ? label[label.length - 1] : '';
                        }}
                        options={versions}
                    />
                </Form.Item>
                {Array.isArray(version) && showArch(version[1]) && (
                    <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => (
                            <Form.Item name="architecture" rules={[{ required: true }]}>
                                <FormSelect
                                    placeholder="Architecture"
                                    label="Architecture"
                                    isCascader={false}
                                    options={getOptions(getFieldValue('version'))}
                                />
                            </Form.Item>
                        )}
                    </Form.Item>
                )}
                {Array.isArray(version) && showArch(version[1]) && (
                    <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => (
                            <Form.Item name="tarBall" rules={[{ required: true }]}>
                                <FormSelect
                                    placeholder="Tarball"
                                    label="Tarball"
                                    isCascader={false}
                                    options={[
                                        {
                                            label: DownloadTypeEnum.Binary,
                                            value: DownloadTypeEnum.Binary,
                                        },
                                        {
                                            label: DownloadTypeEnum.Source,
                                            value: DownloadTypeEnum.Source,
                                        },
                                    ]}
                                />
                            </Form.Item>
                        )}
                    </Form.Item>
                )}

                <Form.Item style={{ marginBottom: 0 }} colon={false}>
                    <button type="submit" className="button-primary w-full text-lg">
                        Download
                    </button>
                </Form.Item>
                {Array.isArray(version) && showArch(version[1]) && (
                    <>
                        <div
                            className="flex cursor-pointer text-[#444FD9] items-center mt-4 justify-center"
                            onClick={() => {
                                const url = getDownloadLinkByCard({
                                    version: version,
                                    cpu: architecture,
                                    tarBall: tarBall,
                                    type: 'gz',
                                });
                                copy(url);
                                message.success('Copy Successfully!');
                            }}
                        >
                            <span className="mr-2">Copy link</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <rect
                                    x="2.5"
                                    y="5.5"
                                    width="8"
                                    height="8"
                                    rx="0.564706"
                                    stroke="#444FD9"
                                    strokeWidth="1.2"
                                />
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M6.0999 1.89996C5.43716 1.89996 4.8999 2.43722 4.8999 3.09996V5.49995H6.0999V3.09996L12.8999 3.09996V9.89996H10.5V11.1H12.8999C13.5626 11.1 14.0999 10.5627 14.0999 9.89996V3.09996C14.0999 2.43722 13.5626 1.89996 12.8999 1.89996H6.0999Z"
                                    fill="#444FD9"
                                />
                            </svg>
                        </div>
                        <div className="flex justify-center mt-4">
                            <div
                                className="inline-flex items-center text-[#8592A6] cursor-pointer hover:underline hover:text-[#444FD9]"
                                onClick={() => {
                                    const url = getDownloadLinkByCard({
                                        version: version,
                                        cpu: architecture,
                                        tarBall: tarBall,
                                        type: 'asc',
                                    });
                                    window.open(url, '_blank');
                                }}
                            >
                                ASC
                            </div>
                            <div
                                className="inline-flex items-center ml-4 text-[#8592A6] hover:text-[#444FD9] cursor-pointer hover:underline"
                                onClick={() => {
                                    const url = getDownloadLinkByCard({
                                        version: version,
                                        cpu: architecture,
                                        tarBall: tarBall,
                                        type: 'sha512',
                                    });
                                    window.open(url, '_blank');
                                }}
                            >
                                SHA-512
                            </div>
                        </div>
                    </>
                )}
            </Form>
        </div>
    );
}
