'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/hooks/use-language';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate register. In a real app, you'd call Firebase here.
    if (email && password && name) {
      // After registration, user needs role assignment. Redirect to login.
      toast({
        title: t('registration_successful'),
        description: t('admin_must_assign_role'),
      });
      router.push('/login');
    } else {
       toast({
        variant: "destructive",
        title: t('error'),
        description: t('please_fill_all_fields'),
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Package className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold">{t('create_account')}</CardTitle>
            <CardDescription>{t('create_new_account_epp_tracker')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">{t('full_name')}</Label>
                <Input id="name" placeholder="Juan Pérez" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              {t('register')}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <div className="text-center text-sm w-full">
                {t('already_have_account')}{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                {t('login')}
                </Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
