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
    ref?: string;
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

// Company ref (secret key) utilities
const LAST_LOGIN_REF_KEY = 'last_login_ref';

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
    const [wasManuallySelected, setWasManuallySelected] = useState(false);
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

    // Handle company preselection based on URL ref or stored ref from previous login
    useEffect(() => {
        if (companiesLogin.length === 0) return;

        // Use URL ref if present, otherwise fall back to stored ref from previous login
        const refToUse = urlRef || localStorage.getItem(LAST_LOGIN_REF_KEY);
        const matchedCompany = refToUse ? companiesLogin.find((c: CompanyLogin) => c.SECRET_KEY === refToUse) : null;

        if (matchedCompany) {
            // Valid ref found - pre-select and hide select
            setSelectedCompany(matchedCompany.RAZON_SOCIAL);
            setValue('ref', refToUse!);
            setHasValidRef(true);

            // Update URL to include ref if it came from localStorage (not from URL)
            if (!urlRef && localStorage.getItem(LAST_LOGIN_REF_KEY)) {
                window.location.hash = `#/?ref=${refToUse}`;
                // Clear the temporary ref from localStorage after using it for redirect
                localStorage.removeItem(LAST_LOGIN_REF_KEY);
            } else if (urlRef && localStorage.getItem(LAST_LOGIN_REF_KEY)) {
                // If URL ref exists AND localStorage ref exists, clear localStorage
                // This handles the case where logout redirected with ref but localStorage wasn't cleared
                localStorage.removeItem(LAST_LOGIN_REF_KEY);
            }
        } else {
            // No valid ref in URL or storage - show select
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
            // Mark that this was a manual selection (not from URL)
            setWasManuallySelected(true);
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
            // Store the ref in localStorage after successful login
            // Only store if it came from URL (not manually selected from dropdown)
            if (urlRef && formData.ref && !wasManuallySelected) {
                // User logged in with valid ref from URL - store for logout redirect
                localStorage.setItem(LAST_LOGIN_REF_KEY, formData.ref);
            } else {
                // User selected from dropdown - never store
                localStorage.removeItem(LAST_LOGIN_REF_KEY);
            }
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
                isCompanySelectDisabled={hasValidRef}
                REMEMBER_ME_USERNAME_KEY={REMEMBER_ME_USERNAME_KEY}
                REMEMBER_ME_PASSWORD_KEY={REMEMBER_ME_PASSWORD_KEY}
            />
        </section>
    );
};