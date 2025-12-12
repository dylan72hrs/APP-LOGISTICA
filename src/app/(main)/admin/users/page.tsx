import { PlaceholderPage } from "@/components/placeholder-page";
import { Users } from "lucide-react";

export default function AdminUsersPage() {
    return (
        <PlaceholderPage 
            title="Administración de Usuarios"
            description="Crea nuevos usuarios y gestiona sus roles y permisos."
            icon={Users}
        />
    )
}
