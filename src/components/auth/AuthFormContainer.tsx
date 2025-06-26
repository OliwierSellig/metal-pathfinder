import React from "react";

interface AuthFormContainerProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({ title, description, children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">{children}</div>
      </div>
    </div>
  );
};

export default AuthFormContainer;
