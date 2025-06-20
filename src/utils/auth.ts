export const getToken = (): string | null => {
    return sessionStorage.getItem("auth_token");
};

export const validateToken = async (): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;

    // check if the token hasn't expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
        sessionStorage.removeItem("auth_token");
        return false;
    }

    return true;
};