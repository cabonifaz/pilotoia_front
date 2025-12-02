import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useGetCompaniesLogin } from "../../hooks/useCompanyQueries";
import { useState, useEffect } from "react";
import { LoginCard } from "../../components/login/LoginCard";
import CryptoJS from 'crypto-js';

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

const restoreUrlCompanyRef = (urlRef: string | null, storedRef: string | null): void => {
    const refToUse = urlRef || storedRef;
    if (refToUse) {
        window.history.replaceState(null, '', `#/?ref=${encodeURIComponent(refToUse)}`);
    }
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, errors, onSubmit, isLoading, setValue } = useAuth();
    const [rememberMe, setRememberMe] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const { data: companiesLogin = [] } = useGetCompaniesLogin();

    // Load saved credentials and handle URL parameters on component mount
    useEffect(() => {
        const storedRef = getStoredCompanyRef();

        if (storedRef) {
            restoreUrlCompanyRef(storedRef, null);
        }

        // Load saved credentials
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

    // Preselect company based on stored secret key
    useEffect(() => {
        if (companiesLogin.length > 0) {
            const storedRef = getStoredCompanyRef();
            if (storedRef) {
                const matchedCompany = companiesLogin.find((c: any) => c.SECRET_KEY === storedRef);
                if (matchedCompany) {
                    setSelectedCompany(matchedCompany.RAZON_SOCIAL);
                    setValue('ref', storedRef);
                } else {
                    // If stored ref doesn't exist in companies list, clear it
                    localStorage.removeItem(LOGIN_URL_PARAM_KEY);
                    setSelectedCompany("");
                    setValue('ref', '');
                }
            }
        }
    }, [companiesLogin, setValue]);

    // Set form ref field when selected company changes
    useEffect(() => {
        const storedRef = getStoredCompanyRef();
        if (storedRef) {
            setValue('ref', storedRef);
        }
    }, [selectedCompany, setValue]);

    // Keep URL in sync with localStorage when company selection changes
    useEffect(() => {
        const storedRef = getStoredCompanyRef();
        if (storedRef) {
            restoreUrlCompanyRef(storedRef, null);
        }
    }, [selectedCompany]);

    const handleCompanySelect = (companyName: string): void => {
        const selectedComp = companiesLogin.find((c: any) => c.RAZON_SOCIAL === companyName);
        if (selectedComp) {
            localStorage.setItem(LOGIN_URL_PARAM_KEY, selectedComp.SECRET_KEY);
            restoreUrlCompanyRef(selectedComp.SECRET_KEY, null);
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
                REMEMBER_ME_USERNAME_KEY={REMEMBER_ME_USERNAME_KEY}
                REMEMBER_ME_PASSWORD_KEY={REMEMBER_ME_PASSWORD_KEY}
            />
        </section>
    );
};