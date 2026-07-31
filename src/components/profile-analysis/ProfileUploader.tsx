import HCaptcha from '@hcaptcha/react-hcaptcha';
import React, { ChangeEvent, DragEvent, JSX, useCallback, useRef, useState } from 'react';
import type { ResponseLanguage } from './profile-analysis.types';

export const MAX_PROFILE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface ProfileUploaderProps {
    file: File | null;
    language: ResponseLanguage;
    disabled: boolean;
    hcaptchaSiteKey: string;
    onFileChange: (file: File | null) => void;
    onLanguageChange: (language: ResponseLanguage) => void;
    onAnalyze: (hcaptchaToken: string, resetCaptcha: () => void) => void;
}

export function validateProfileFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.txt')) {
        return 'Select a .txt file. Other file types are not supported.';
    }
    if (file.size > MAX_PROFILE_FILE_SIZE_BYTES) {
        return 'The selected file is larger than 10 MiB.';
    }
    return null;
}

export function formatProfileFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
    }
    if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(1)} KiB`;
    }
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function ProfileUploader({
    file,
    language,
    disabled,
    hcaptchaSiteKey,
    onFileChange,
    onLanguageChange,
    onAnalyze,
}: ProfileUploaderProps): JSX.Element {
    const [validationError, setValidationError] = useState<string | null>(null);
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [hcaptchaToken, setHCaptchaToken] = useState<string | null>(null);
    const [hcaptchaError, setHCaptchaError] = useState<string | null>(null);
    const hcaptchaRef = useRef<HCaptcha>(null);

    const resetCaptcha = useCallback(() => {
        hcaptchaRef.current?.resetCaptcha();
        setHCaptchaToken(null);
        setHCaptchaError(null);
    }, []);

    const acceptFile = (nextFile: File | null) => {
        if (!nextFile) {
            setValidationError(null);
            onFileChange(null);
            return;
        }

        const nextError = validateProfileFile(nextFile);
        setValidationError(nextError);
        onFileChange(nextError ? null : nextFile);
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        acceptFile(event.currentTarget.files?.item(0) ?? null);
        event.currentTarget.value = '';
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        if (disabled || !consentAccepted) {
            return;
        }
        if (event.dataTransfer.files.length > 1) {
            setValidationError('Select only one Profile file at a time.');
            onFileChange(null);
            return;
        }
        acceptFile(event.dataTransfer.files.item(0));
    };

    return (
        <section className="profile-analysis__uploader" aria-labelledby="profile-analysis-upload-title">
            <h2 id="profile-analysis-upload-title">Upload a Query Profile</h2>
            <p id="profile-analysis-file-help" className="profile-analysis__help">
                Choose one UTF-8 .txt file up to 10 MiB after reviewing and accepting the notice below.
            </p>

            <fieldset className="profile-analysis__language" disabled={disabled}>
                <legend>Response language</legend>
                <label>
                    <input
                        type="radio"
                        name="profile-analysis-language"
                        value="en"
                        checked={language === 'en'}
                        onChange={() => onLanguageChange('en')}
                    />
                    English
                </label>
                <label>
                    <input
                        type="radio"
                        name="profile-analysis-language"
                        value="zh-CN"
                        checked={language === 'zh-CN'}
                        onChange={() => onLanguageChange('zh-CN')}
                    />
                    Simplified Chinese
                </label>
            </fieldset>

            <label
                className={`profile-analysis__drop-zone${
                    disabled || !consentAccepted ? ' profile-analysis__drop-zone--disabled' : ''
                }`}
                onDragOver={event => event.preventDefault()}
                onDrop={handleDrop}
            >
                <span className="profile-analysis__drop-zone-title">Choose a file or drag it here</span>
                <span className="profile-analysis__drop-zone-note">Apache Doris Query Profile in .txt format</span>
                <input
                    className="profile-analysis__file-input"
                    type="file"
                    accept=".txt,text/plain"
                    aria-label="Choose an Apache Doris Query Profile file"
                    aria-describedby="profile-analysis-file-help"
                    disabled={disabled || !consentAccepted}
                    onChange={handleInputChange}
                />
            </label>

            {validationError && (
                <div className="profile-analysis__validation-error" role="alert">
                    {validationError}
                </div>
            )}

            {file && (
                <div className="profile-analysis__file" aria-live="polite">
                    <span className="profile-analysis__file-name" title={file.name}>
                        {file.name}
                    </span>
                    <span className="profile-analysis__file-size">{formatProfileFileSize(file.size)}</span>
                </div>
            )}

            {consentAccepted && (
                <div className="profile-analysis__captcha">
                    <p id="profile-analysis-captcha-help" className="profile-analysis__captcha-label">
                        Complete the human verification before starting the analysis.
                    </p>
                    {hcaptchaSiteKey ? (
                        <HCaptcha
                            ref={hcaptchaRef}
                            sitekey={hcaptchaSiteKey}
                            reCaptchaCompat={false}
                            sentry={false}
                            onVerify={token => {
                                setHCaptchaToken(token);
                                setHCaptchaError(null);
                            }}
                            onExpire={() => {
                                setHCaptchaToken(null);
                                setHCaptchaError('Verification expired. Complete it again.');
                            }}
                            onChalExpired={() => {
                                setHCaptchaToken(null);
                                setHCaptchaError('Verification expired. Complete it again.');
                            }}
                            onError={() => {
                                setHCaptchaToken(null);
                                setHCaptchaError(
                                    'Human verification could not load. Check your connection and try again.',
                                );
                            }}
                        />
                    ) : (
                        <div className="profile-analysis__validation-error" role="alert">
                            Human verification is not configured. Contact the site administrator.
                        </div>
                    )}
                    <small>
                        This site is protected by hCaptcha and its{' '}
                        <a
                            href="https://www.hcaptcha.com/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a
                            href="https://www.hcaptcha.com/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Terms of Service
                        </a>{' '}
                        apply.
                    </small>
                    {hcaptchaError && (
                        <div className="profile-analysis__validation-error" role="alert">
                            {hcaptchaError}
                        </div>
                    )}
                </div>
            )}

            <button
                className="button button--primary profile-analysis__analyze-button"
                type="button"
                disabled={!file || disabled || !consentAccepted || !hcaptchaToken}
                onClick={() => {
                    if (hcaptchaToken) onAnalyze(hcaptchaToken, resetCaptcha);
                }}
            >
                {disabled ? 'Processing…' : 'Analyze Profile'}
            </button>

            <div
                className="profile-analysis__privacy-notice"
                id="profile-analysis-privacy-notice"
                role="note"
            >
                <div className="profile-analysis__privacy-notice-title">
                    <span className="profile-analysis__privacy-notice-icon" aria-hidden="true">
                        !
                    </span>
                    <h3>Privacy and AI processing notice</h3>
                </div>
                <p>
                    This feature is provided by VeloDB and third-party large language model service providers.
                    It is not an official Apache Doris project feature, so please use it at your discretion.
                </p>
                <p>
                    Do not upload passwords, keys, access tokens, personal information, customer-confidential
                    data, or any other sensitive content that you are not authorized to disclose. All uploaded
                    information will be automatically and permanently deleted within one hour.
                </p>
                <label className="profile-analysis__consent">
                    <input
                        type="checkbox"
                        checked={consentAccepted}
                        disabled={disabled}
                        aria-describedby="profile-analysis-privacy-notice"
                        onChange={event => {
                            const accepted = event.currentTarget.checked;
                            setConsentAccepted(accepted);
                            if (!accepted) {
                                resetCaptcha();
                                onFileChange(null);
                            }
                        }}
                    />
                    I have read the notice, am authorized to upload this profile, and consent to third-party AI
                    processing.
                </label>
            </div>
        </section>
    );
}
