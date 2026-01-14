"use client";

import React from "react";
import { useRouteGuard } from "../_hooks/useRouteGuard";

interface Props {
    children: React.ReactNode;
}
const AdminLayout = ({ children }: Props) => {
    const { isAuthenticated } = useRouteGuard();
    if (!isAuthenticated) {
        return null;
    }
    return <div>{children}</div>;
};

export default AdminLayout;