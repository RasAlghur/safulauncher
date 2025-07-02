import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";

/**
 * Description placeholder
 *
 * @interface AuthProviderProps
 * @typedef {AuthProviderProps}
 */
interface AuthProviderProps {
  /**
   * Description placeholder
   *
   * @type {ReactNode}
   */
  children: ReactNode;
}

/**
 * Description placeholder
 *
 * @interface AuthContextType
 * @typedef {AuthContextType}
 */
interface AuthContextType {
  /**
   * Description placeholder
   *
   * @type {boolean}
   */
  isModalOpen: boolean;
  /**
   * Description placeholder
   *
   * @type {Dispatch<SetStateAction<boolean>>}
   */
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Description placeholder
 *
 * @type {*}
 */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/**
 * Description placeholder
 *
 * @param {AuthProviderProps} param0
 * @param {ReactNode} param0.children
 * @returns {*}
 */
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

/**
 * Description placeholder
 *
 * @returns {*}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
