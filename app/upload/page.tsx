'use client';
import { processPdfFile } from './action';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function UploadPDF() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setMessage(null);

    try {
      let formData = new FormData();
      formData.append('pdf', file);
      const result = await processPdfFile(formData);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'PDF processed successfully',
        });
        e.target.value = '';
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Failed to Process PDF',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occured while processing PDF',
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
          PDF Upload
        </h1>
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              <Label htmlFor='pdf'>Upload PDF</Label>
              <Input
                type='file'
                id='pdf'
                accept='.pdf'
                onChange={handleChange}
                disabled={isLoading}
                className='mt-2'
              ></Input>
            </div>
            {isLoading && (
              <div className='flex items-center gap-2'>
                <Loader2 className='h-5 w-5 animate-spin' />
                <span className='text-muted-foreground'>Processing PDF...</span>
              </div>
            )}
            {message && (
              <Alert
                variant={message.type === 'error' ? 'destructive' : 'default'}
              >
                <AlertTitle>
                  {message.type == 'error' ? 'Error!' : 'Success!'}
                </AlertTitle>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
