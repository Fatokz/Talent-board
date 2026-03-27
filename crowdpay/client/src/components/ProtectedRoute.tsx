import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    if (!currentUser.emailVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    return <>{children}</>;
}
