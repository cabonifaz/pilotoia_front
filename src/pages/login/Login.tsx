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

// Company ref (secret key) utilities - no longer using localStorage

const getUrlCompanyRef = (): string | null => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return urlParams.get('ref');
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, errors, onSubmit, isLoading, setValue } = useAuth();
    const [rememberMe, setRememberMe] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [urlRef, setUrlRef] = useState<string | null>(getUrlCompanyRef());
    const [hasValidRef, setHasValidRef] = useState<boolean>(false);
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

    // Handle company preselection based on URL ref only
    useEffect(() => {
        if (companiesLogin.length === 0) return;

        if (urlRef) {
            // Try to find matching company
            const matchedCompany = companiesLogin.find((c: CompanyLogin) => c.SECRET_KEY === urlRef);

            if (matchedCompany) {
                // Valid ref found - pre-select and hide select
                setSelectedCompany(matchedCompany.RAZON_SOCIAL);
                setValue('ref', urlRef);
                setHasValidRef(true);
            } else {
                // Invalid ref - show select
                setSelectedCompany("");
                setValue('ref', '');
                setHasValidRef(false);
            }
        } else {
            // No ref in URL - show select
            setSelectedCompany("");
            setValue('ref', '');
            setHasValidRef(false);
        }
    }, [companiesLogin, setValue, urlRef]);

    const handleCompanySelect = (companyName: string): void => {
        const selectedComp = companiesLogin.find((c: CompanyLogin) => c.RAZON_SOCIAL === companyName);
        if (selectedComp) {
            const secretKey = selectedComp.SECRET_KEY;
            // Just update form value and UI - don't touch localStorage or URL
            setValue('ref', secretKey);
            setSelectedCompany(companyName);
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
                shouldShowCompanySelect={!hasValidRef}
                REMEMBER_ME_USERNAME_KEY={REMEMBER_ME_USERNAME_KEY}
                REMEMBER_ME_PASSWORD_KEY={REMEMBER_ME_PASSWORD_KEY}
            />
        </section>
    );
};