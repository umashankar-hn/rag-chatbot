import {
  SignInButton,
  SignUpButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Button } from './ui/button';

export default function Navigation() {
  return (
    <nav className='border-b border-slate-400'>
      <div className='flex justify-between px-4 items-center h-16 mx-auto'>
        <div className='text-2xl font-semibold'>Rag chatbot</div>
        <div className='flex gap-2'>
          <SignedOut>
            <SignInButton mode='modal'>
              <Button variant={'ghost'}>Sign In</Button>
            </SignInButton>
            <SignUpButton mode='modal'>
              <Button>Sign up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
            <SignOutButton>
              <Button variant={'outline'}>Sign out</Button>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
