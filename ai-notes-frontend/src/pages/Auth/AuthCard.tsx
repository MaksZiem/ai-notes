import React from "react";

const AuthCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg-card rounded-2xl p-8 shadow-xl flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
};

export default AuthCard;
