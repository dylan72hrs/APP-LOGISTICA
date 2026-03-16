'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/lib/hooks/use-language';
import { useAuth } from '@/lib/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState('Imaulen@masterdrilling.com');
  const [password, setPassword] = useState('123456');
  const companyLogo = PlaceHolderImages.find(p => p.id === 'company-logo');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email);
    } else {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('please_enter_email_password'),
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
            {companyLogo && (
                <Image
                    src={companyLogo.imageUrl}
                    alt={companyLogo.description}
                    width={200}
                    height={200}
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
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@stockflow.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} maxLength={8} />
            </div>
            <Button type="submit" className="w-full">
              {t('login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
