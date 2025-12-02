import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useGetCompaniesLogin } from "../../hooks/useCompanyQueries";
import { useState, useEffect } from "react";
import { LoginCard } from "../../components/login/LoginCard";
import CryptoJS from 'crypto-js';
import { type CompanyLogin } from "../../types/company";

type LoginFormData = {
    usuario: string;
    clave_acceso: string;
    empresa?: string;
};

// Constants
const REMEMBER_ME_USERNAME_KEY = 'login_remember_username';
const REMEMBER_ME_PASSWORD_KEY = 'login_remember_password';
const LOGIN_URL_PARAM_KEY = 'login_url_param';
const ENCRYPTION_KEY = import.meta.env.VITE_LOGIN_ENCRYPTION_KEY || 'default-fallback-key';

// Encryption utilities
const encryptData = (data: string): string => {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return '';
    }
};

// Company ref (secret key) utilities
const getStoredCompanyRef = (): string | null => {
    return localStorage.getItem(LOGIN_URL_PARAM_KEY);
};

const getUrlCompanyRef = (): string | null => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return urlParams.get('ref');
};

const restoreUrlCompanyRef = (ref: string): void => {
    if (ref) {
        window.history.replaceState(null, '', `#/?ref=${encodeURIComponent(ref)}`);
    } else {
        window.history.replaceState(null, '', `#/`);
    }
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, errors, onSubmit, isLoading, setValue } = useAuth();
    const [rememberMe, setRememberMe] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [urlRef, setUrlRef] = useState<string | null>(getUrlCompanyRef());
    const { data: companiesLogin = [] } = useGetCompaniesLogin();

    // Listen for URL hash changes to detect manual URL edits
    useEffect(() => {
        const handleHashChange = () => {
            setUrlRef(getUrlCompanyRef());
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Load saved credentials on initial mount
    useEffect(() => {
        const savedUsername = localStorage.getItem(REMEMBER_ME_USERNAME_KEY);
        const savedPassword = localStorage.getItem(REMEMBER_ME_PASSWORD_KEY);

        if (savedUsername && savedPassword) {
            const decryptedUsername = decryptData(savedUsername);
            const decryptedPassword = decryptData(savedPassword);
            if (decryptedUsername && decryptedPassword) {
                setValue('usuario', decryptedUsername);
                setValue('clave_acceso', decryptedPassword);
                setRememberMe(true);
            }
        }
    }, [setValue]);

    // Handle company preselection and ref synchronization
    // Priority: URL ref > localStorage ref
    useEffect(() => {
        if (companiesLogin.length === 0) return;

        // Check URL first (highest priority), then localStorage
        const storedRef = getStoredCompanyRef();
        const refToValidate = urlRef || storedRef;

        if (refToValidate) {
            // Try to find matching company
            const matchedCompany = companiesLogin.find((c: CompanyLogin) => c.SECRET_KEY === refToValidate);

            if (matchedCompany) {
                // Valid ref found - sync everything
                localStorage.setItem(LOGIN_URL_PARAM_KEY, refToValidate);
                setSelectedCompany(matchedCompany.RAZON_SOCIAL);
                setValue('ref', refToValidate);
                restoreUrlCompanyRef(refToValidate);
            } else {
                // Invalid ref - clear everything
                localStorage.setItem(LOGIN_URL_PARAM_KEY, "");
                setSelectedCompany("");
                setValue('ref', '');
                restoreUrlCompanyRef("");
            }
        } else {
            // No ref in URL or localStorage - show default state
            localStorage.setItem(LOGIN_URL_PARAM_KEY, "");
            setSelectedCompany("");
            setValue('ref', '');
            restoreUrlCompanyRef("");
        }
    }, [companiesLogin, setValue, urlRef]);

    const handleCompanySelect = (companyName: string): void => {
        const selectedComp = companiesLogin.find((c: CompanyLogin) => c.RAZON_SOCIAL === companyName);
        if (selectedComp) {
            const secretKey = selectedComp.SECRET_KEY;
            // Update all related state in one place
            localStorage.setItem(LOGIN_URL_PARAM_KEY, secretKey);
            restoreUrlCompanyRef(secretKey);
            setValue('ref', secretKey);
            setSelectedCompany(companyName);
            setUrlRef(secretKey); // Update URL ref state
        }
    };

    const handleLoginSubmit = async (formData: LoginFormData) => {
        // Handle remember me functionality
        if (rememberMe) {
            localStorage.setItem(REMEMBER_ME_USERNAME_KEY, encryptData(formData.usuario));
            localStorage.setItem(REMEMBER_ME_PASSWORD_KEY, encryptData(formData.clave_acceso));
        } else {
            localStorage.removeItem(REMEMBER_ME_USERNAME_KEY);
            localStorage.removeItem(REMEMBER_ME_PASSWORD_KEY);
        }

        const result = await onSubmit(formData);
        if (result.success) {
            navigate('/rag');
        }
    };

    return (
        <section className="min-h-screen w-full bg-slate-50 flex justify-center items-center p-4">
            <LoginCard
                register={register}
                handleSubmit={handleSubmit}
                errors={errors}
                isLoading={isLoading}
                onFormSubmit={handleLoginSubmit}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                selectedCompany={selectedCompany}
                onCompanySelect={handleCompanySelect}
                REMEMBER_ME_USERNAME_KEY={REMEMBER_ME_USERNAME_KEY}
                REMEMBER_ME_PASSWORD_KEY={REMEMBER_ME_PASSWORD_KEY}
            />
        </section>
    );
};