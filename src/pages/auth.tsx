import { Layout } from 'antd';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import style from './auth.module.scss'
import Left from './Layout/left';

interface AuthContextType {
    isLoggedIn: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const {Header} = Layout
 export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('isLoggedIn') === 'true';
    });

    const login = async (_username: string, _password: string) => {
        // 模拟登录请求
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// 鉴权组件：未登录跳转登录页
export function RequireAuth() {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();


    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { state: { from: location.pathname }, replace: true });
        }
    }, [isLoggedIn, navigate, location]);

    if (!isLoggedIn) {
        return null;
    }

    return <>

    <Layout style={{height: '100%'}}>
        <Header/>
        <div className={style.content}>
            <Outlet />
        </div>
    </Layout>
    </>;
}