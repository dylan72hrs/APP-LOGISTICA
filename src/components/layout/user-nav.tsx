'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLanguage } from '@/lib/hooks/use-language';
import { loadProfileNickname, saveProfileNickname } from '@/lib/profile-storage';
import { LogOut, User as UserIcon } from 'lucide-react';

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 0) return 'U';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export function UserNav() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    if (!user) return;
    setNickname(loadProfileNickname(user.email));
  }, [user]);

  if (!user) {
    return null;
  }

  const avatarSrc = user.email.toLowerCase() === 'imaulen@masterdrilling.com'
    ? '/branding/imaulen.webp'
    : undefined;
  const roleLabel = user.role === 'admin'
    ? 'Admin General'
    : user.role === 'operator'
      ? 'Operador de Bodega'
      : user.role === 'reports'
        ? 'Usuario Reportes'
        : 'Sin rol asignado';

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    saveProfileNickname(user.email, value);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setIsProfileOpen(true);
              }}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>{t('profile')}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('profile')}</DialogTitle>
            <DialogDescription>
              Perfil visual local. No modifica permisos ni seguridad.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 rounded-md border bg-muted/30 p-4">
            <Avatar className="h-16 w-16">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{nickname || user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-2">{roleLabel}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-nickname">Apodo visual</Label>
            <Input
              id="profile-nickname"
              value={nickname}
              onChange={(event) => handleNicknameChange(event.target.value)}
              placeholder={user.name}
              maxLength={40}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
