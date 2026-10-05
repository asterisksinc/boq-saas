"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getDashboardOverview } from "@/lib/api/auth";

type PermissionMap = Record<string, boolean>;

type PermissionsContextValue = {
    permissions: PermissionMap;
    loading: boolean;
    error: string | null;
    can: (permission: string) => boolean;
    refresh: () => Promise<void>;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const [permissions, setPermissions] = useState<PermissionMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const overview = await getDashboardOverview();
            const nextPermissions = Object.entries(overview.permissions ?? {}).reduce<PermissionMap>((result, [key, enabled]) => {
                if (enabled !== undefined) result[key] = enabled;
                return result;
            }, {});
            setPermissions(nextPermissions);
            setError(null);
        } catch (reason) {
            setPermissions({});
            setError(reason instanceof Error ? reason.message : "Permissions could not be loaded.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const value = useMemo<PermissionsContextValue>(() => ({
        permissions,
        loading,
        error,
        can: (permission) => permissions[permission] === true,
        refresh,
    }), [permissions, loading, error]);

    return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error("usePermissions must be used within PermissionsProvider.");
    }
    return context;
}
