import React, { useEffect, useMemo } from 'react';
import { Form, message } from 'antd';
import { Option } from '@site/src/constant/download.data';
import FormSelect from '../form-select/form-select';
import copy from 'copy-to-clipboard';
import { ToolsEnum } from '@site/src/constant/download.data';
import { useForm, useWatch } from 'antd/es/form/Form';
import { DownloadIcon } from '../Icons/download-icon';

interface DownloadFormToolsProps {
    data: Option[];
}
export default function DownloadFormTools(props: DownloadFormToolsProps) {
    const { data } = props;
    const [form] = useForm();
    const tool = useWatch('tool', form);
    const architecture = useWatch('architecture', form);
    const version = useWatch('version', form);

    const getOptions = useMemo(() => {
        if (!tool) return [];
        return data.find(item => tool === item.value).children;
    }, [tool]);

    const getArchitectureOptions = useMemo(() => {
        if (!tool || !version) return [];
        const current = data.find(item => item.value === tool).children;
        return current.find(item => version === item.value).children;
    }, [version]);

    const getDownloadLinkByCard = (source?: boolean) => {
        const currentTool = data.find(item => tool === item.value).children;
        if (!architecture) {
            return currentTool.find(item => version === item.value).gz;
        } else {
            if (source) {
                return currentTool.find(item => version === item.value).source;
            } else {
                const currentVersion = currentTool.find(item => version === item.value).children;
                return currentVersion.find(item => architecture === item.value).gz;
            }
        }
    };

    useEffect(() => {
        if (tool) {
            form.setFieldValue('version', getOptions[0].value);
        }
    }, [tool]);

    useEffect(() => {
        if (version && getArchitectureOptions?.length > 0) {
            form.setFieldValue('architecture', getArchitectureOptions[0].value);
        }
    }, [version]);

    return (
        <div className="rounded-lg border border-b-[0.375rem] border-[#444FD9] px-8 pt-[3.125rem] pb-[2.1875rem]">
            <div className="mb-8 text-xl font-medium text-left">Downloads</div>
            <Form
                form={form}
                onFinish={val => {
                    const url = getDownloadLinkByCard();
                    window.open(url, '_blank');
                }}
                initialValues={{
                    tool: data[0]?.value,
                    version: '',
                    architecture: '',
                }}
            >
                <Form.Item name="tool" rules={[{ required: true }]}>
                    <FormSelect placeholder="Tools" label="Tools" isCascader={false} options={data} />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) =>
                        getFieldValue('tool') === ToolsEnum.StreamLoader ? (
                            <>
                                <Form.Item name="version" rules={[{ required: true }]}>
                                    <FormSelect
                                        placeholder="Version"
                                        label="Version"
                                        isCascader={false}
                                        options={getOptions}
                                    />
                                </Form.Item>
                                <Form.Item name="architecture" rules={[{ required: true }]}>
                                    <FormSelect
                                        placeholder="Architecture"
                                        label="Architecture"
                                        isCascader={false}
                                        options={getArchitectureOptions}
                                    />
                                </Form.Item>
                            </>
                        ) : (
                            <Form.Item name="version" rules={[{ required: true }]}>
                                <FormSelect
                                    placeholder="Version"
                                    label="Version"
                                    isCascader={false}
                                    options={getOptions}
                                />
                            </Form.Item>
                        )
                    }
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }} colon={false}>
                    <button type="submit" className="button-primary w-full text-lg">
                        Download
                    </button>
                </Form.Item>
                <div
                    className="flex cursor-pointer text-[#444FD9] items-center mt-4 justify-center"
                    onClick={() => {
                        const url = getDownloadLinkByCard();
                        copy(url);
                        message.success('Copy Successfully!');
                    }}
                >
                    <span className="mr-2">Copy link</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="2.5" y="5.5" width="8" height="8" rx="0.564706" stroke="#444FD9" strokeWidth="1.2" />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M6.0999 1.89996C5.43716 1.89996 4.8999 2.43722 4.8999 3.09996V5.49995H6.0999V3.09996L12.8999 3.09996V9.89996H10.5V11.1H12.8999C13.5626 11.1 14.0999 10.5627 14.0999 9.89996V3.09996C14.0999 2.43722 13.5626 1.89996 12.8999 1.89996H6.0999Z"
                            fill="#444FD9"
                        />
                    </svg>
                </div>
                {tool === ToolsEnum.StreamLoader && (
                    <div className="flex justify-center mt-4 hover:text-[#444FD9]">
                        <div
                            className="inline-flex items-center text-[#8592A6] cursor-pointer hover:underline hover:text-[#444FD9]"
                            onClick={() => {
                                const url = getDownloadLinkByCard(true);
                                window.open(url, '_blank');
                            }}
                        >
                            Source code
                            <div className="ml-1">
                                <DownloadIcon style={{ fontSize: 14 }} />
                            </div>
                        </div>
                    </div>
                )}
            </Form>
        </div>
    );
}
