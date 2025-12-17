'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserProfile, UserRole, Warehouse } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/hooks/use-language';
import { useData } from '@/lib/hooks/use-data';


export default function AdminUsersPage() {
    const { toast } = useToast();
    const { t } = useLanguage();
    const { users, warehouses, addUser, updateUser, deleteUser } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const roleNames: Record<UserRole, string> = {
        admin: t('administrator'),
        operator: t('operator'),
        reports: t('reports'),
        unassigned: t('unassigned')
    };

    const handleSaveUser = (formData: FormData) => {
        const user: UserProfile = {
            uid: editingUser?.uid || `user-${Date.now()}`,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as UserRole,
            warehouseId: formData.get('role') === 'operator' ? formData.get('warehouseId') as string : undefined,
        };

        if (!user.name || !user.email || !user.role) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: t('please_fill_all_required_fields')
            });
            return;
        }
        
        if (user.role === 'operator' && !user.warehouseId) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: t('operators_must_have_warehouse')
            });
            return;
        }

        if (editingUser) {
            updateUser(user);
             toast({ title: t('user_updated'), description: t('user_updated_successfully') });
        } else {
            addUser(user);
             toast({ title: t('user_created'), description: t('new_user_created_successfully') });
        }
        
        setIsDialogOpen(false);
        setEditingUser(null);
    };

    const handleEditClick = (user: UserProfile) => {
        setEditingUser(user);
        setIsDialogOpen(true);
    }
    
    const handleAddNewClick = () => {
        setEditingUser(null);
        setIsDialogOpen(true);
    }

    const handleDeleteClick = (uid: string) => {
        deleteUser(uid);
        toast({
          variant: "destructive",
          title: t('user_deleted'),
          description: t('user_deleted_successfully')
      });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('user_administration')}</h1>
                <Button onClick={handleAddNewClick}>
                    <PlusCircle className="mr-2" />
                    {t('create_user')}
                </Button>
            </div>
             <CardDescription>{t('create_and_manage_users')}</CardDescription>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('name')}</TableHead>
                                <TableHead>{t('email')}</TableHead>
                                <TableHead>{t('role')}</TableHead>
                                <TableHead>{t('assigned_warehouse')}</TableHead>
                                <TableHead>{t('password')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const assignedWarehouse = warehouses.find(w => w.id === user.warehouseId);
                                return (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{roleNames[user.role]}</TableCell>
                                        <TableCell>{assignedWarehouse ? `${assignedWarehouse.name} (${assignedWarehouse.country})` : 'N/A'}</TableCell>
                                        <TableCell>123456</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                                        <Pencil className="mr-2 h-4 w-4"/>
                                                        {t('edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(user.uid)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4"/>
                                                        {t('delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingUser(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? t('edit_user') : t('create_new_user')}</DialogTitle>
                    </DialogHeader>
                    <UserForm user={editingUser} warehouses={warehouses} onSave={handleSaveUser} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UserForm({ user, warehouses, onSave }: { user: UserProfile | null, warehouses: Warehouse[], onSave: (data: FormData) => void }) {
    const { t } = useLanguage();
    const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(user?.role);
    const initialCountry = user?.warehouseId ? warehouses.find(w => w.id === user.warehouseId)?.country : undefined;
    const [selectedCountry, setSelectedCountry] = useState<string | undefined>(initialCountry);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(user?.warehouseId);
    const [showPassword, setShowPassword] = useState(false);


    const countries = [...new Set(warehouses.map(w => w.country))];
    const filteredWarehouses = selectedCountry ? warehouses.filter(w => w.country === selectedCountry) : [];

    const handleCountryChange = (country: string) => {
        setSelectedCountry(country);
        setSelectedWarehouseId(undefined); // Reset warehouse selection
    };
    
    const handleRoleChange = (role: string) => {
        const newRole = role as UserRole;
        setSelectedRole(newRole);
        if (newRole !== 'operator') {
            setSelectedCountry(undefined);
            setSelectedWarehouseId(undefined);
        }
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">{t('full_name')}</Label>
                <Input id="name" name="name" defaultValue={user?.name} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" name="email" type="email" defaultValue={user?.email} required />
            </div>
             <div className="relative space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} defaultValue="123456" required />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-6 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">{t('role')}</Label>
                <Select name="role" defaultValue={user?.role} onValueChange={handleRoleChange} required>
                    <SelectTrigger id="role">
                        <SelectValue placeholder={t('select_a_role')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">{t('administrator')}</SelectItem>
                        <SelectItem value="operator">{t('operator')}</SelectItem>
                        <SelectItem value="reports">{t('reports')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selectedRole === 'operator' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="country">{t('country')}</Label>
                        <Select onValueChange={handleCountryChange} value={selectedCountry}>
                            <SelectTrigger id="country">
                                <SelectValue placeholder={t('select_a_country')} />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(country => (
                                    <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCountry && (
                         <div className="space-y-2">
                            <Label htmlFor="warehouseId">{t('assigned_warehouse')}</Label>
                            <Select name="warehouseId" key={selectedWarehouseId} value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                                <SelectTrigger id="warehouseId">
                                    <SelectValue placeholder={t('select_a_warehouse')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredWarehouses.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{`${w.name} (${w.city})`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </>
            )}
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t('cancel')}</Button>
                </DialogClose>
                <Button type="submit">{t('save')}</Button>
            </DialogFooter>
        </form>
    );
}
