'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/lib/hooks/use-language';
import { useAuth } from '@/lib/hooks/use-auth';
import { Bot } from 'lucide-react';

export default function LoginPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const companyLogo = PlaceHolderImages.find(p => p.id === 'company-logo');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('please_enter_email_password'),
      });
      return;
    }

    const isValidLogin = login(username, password);
    if (!isValidLogin) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Credenciales demo invalidas.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-5xl items-center gap-6 md:grid-cols-[1fr_420px]">
        <div className="hidden min-h-[520px] items-center justify-center rounded-md border bg-primary/5 p-8 md:flex">
          <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-primary/20 bg-background shadow-xl">
            <div className="absolute inset-8 rounded-full border border-dashed border-primary/30 animate-spin [animation-duration:14s]" />
            <div className="absolute -right-4 top-16 h-14 w-14 rounded-full border bg-background shadow-md animate-pulse" />
            <div className="absolute bottom-12 left-6 h-10 w-10 rounded-full border bg-background shadow-sm animate-bounce [animation-duration:3s]" />
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-primary/30 bg-primary text-primary-foreground shadow-lg">
              <Bot className="h-16 w-16" />
            </div>
          </div>
        </div>

        <Card className="w-full shadow-2xl">
          <CardHeader className="text-center">
            {companyLogo && (
              <Image
                src={companyLogo.imageUrl}
                alt={companyLogo.description}
                width={84}
                height={84}
                className="mx-auto mb-4"
                data-ai-hint={companyLogo.imageHint}
                priority
              />
            )}
            <CardTitle className="text-3xl font-bold">EPP Tracker 3.0</CardTitle>
            <CardDescription>{t('epp_management_control')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                {t('login')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
