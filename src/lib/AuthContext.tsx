import {
    createContext,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    useContext,
    useState,
} from "react";

interface AuthProviderProps {
    children: ReactNode;
}

interface AuthContextType {
    isModalOpen: boolean;
    setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <AuthContext.Provider
            value={{
                isModalOpen,
                setIsModalOpen,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
