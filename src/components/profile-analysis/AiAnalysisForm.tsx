import HCaptcha from '@hcaptcha/react-hcaptcha';
import React, { JSX, useCallback, useRef, useState } from 'react';
import type { ResponseLanguage } from './profile-analysis.types';

interface AiAnalysisFormProps {
    file: File | null;
    language: ResponseLanguage;
    disabled: boolean;
    hcaptchaSiteKey: string;
    onLanguageChange: (language: ResponseLanguage) => void;
    onAnalyze: (hcaptchaToken: string, resetCaptcha: () => void) => void;
}

export function AiAnalysisForm({
    file,
    language,
    disabled,
    hcaptchaSiteKey,
    onLanguageChange,
    onAnalyze,
}: AiAnalysisFormProps): JSX.Element {
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [hcaptchaToken, setHCaptchaToken] = useState<string | null>(null);
    const [hcaptchaError, setHCaptchaError] = useState<string | null>(null);
    const hcaptchaRef = useRef<HCaptcha>(null);

    const resetCaptcha = useCallback(() => {
        hcaptchaRef.current?.resetCaptcha();
        setHCaptchaToken(null);
        setHCaptchaError(null);
    }, []);

    return (
        <div className="profile-analysis__panel">
            <p className="profile-analysis__skills-credit">
                <a
                    href="https://github.com/apache/doris-skills"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Powered by Doris Skills (opens in a new tab)"
                >
                    Powered by <strong>Doris Skills</strong>
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M6 3h7v7M13 3 5 11M11 9v4H3V5h4" />
                    </svg>
                </a>
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

            <div className="profile-analysis__privacy-notice" id="profile-analysis-privacy-notice" role="note">
                <div className="profile-analysis__privacy-notice-title">
                    <span className="profile-analysis__privacy-notice-icon" aria-hidden="true">
                        !
                    </span>
                    <h3>Privacy and AI processing notice</h3>
                </div>
                <p>
                    This feature is provided by VeloDB and third-party large language model service providers. It
                    is not an official Apache Doris project feature, so please use it at your discretion.
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
                            if (!accepted) resetCaptcha();
                        }}
                    />
                    I have read the notice, am authorized to upload this profile, and consent to third-party AI
                    processing.
                </label>
            </div>

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
                        <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href="https://www.hcaptcha.com/terms" target="_blank" rel="noopener noreferrer">
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
                className="button button--primary profile-analysis__action-button"
                type="button"
                disabled={!file || disabled || !consentAccepted || !hcaptchaToken}
                onClick={() => {
                    if (hcaptchaToken) onAnalyze(hcaptchaToken, resetCaptcha);
                }}
            >
                {disabled ? 'Processing… · Estimated 1–2 minutes' : 'Analyze with AI'}
            </button>
        </div>
    );
}
